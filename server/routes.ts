import type { Express } from "express";
import { createServer, type Server } from "http";
import { isDevMode } from "./middleware/auth";
import { GeminiAdapter } from "./ai/gemini";
import { AnthropicAdapter } from "./ai/anthropic";
import { AIService, AIMessage } from "./ai/service";
import { getAIServiceForUser } from "./ai/factory";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth";
import { TechStackRecommendationSchema } from "../shared/schema";
import { stripe, createCheckoutSession, createPortalSession, getOrCreateCustomer } from "./stripe";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import { MCP_TOOLS, executeMcpTool } from "./mcp/index";
import { validateApiToken } from "./mcp/auth";
import { getStorage } from "./storage";
import type { IStorage } from "./storage";
import { registerUser, loginUser } from "./auth";

const storage: IStorage = getStorage();
// AI service is now created per-request via getAIServiceForUser (supports BYOK)

// Audience-specific question emphasis
const AUDIENCE_PROMPTS: Record<string, string> = {
  b2b_saas: "Focus on: Enterprise GTM strategy, ARR potential, integration requirements, sales cycles, customer success",
  b2c_mobile: "Focus on: Unit economics, DAU/MAU metrics, viral loops, retention strategies, app store optimization",
  marketplace: "Focus on: Two-sided growth, supply/demand balance, network effects, take rates, liquidity",
  ai_agent: "Focus on: Model selection, data pipelines, accuracy metrics, prompt engineering, API costs",
  consumer_web: "Focus on: Content strategy, engagement metrics, ad revenue potential, SEO, viral growth",
  hardware: "Focus on: Supply chain, hardware costs, software-hardware synergy, manufacturing, certifications",
};

// Challenger mode prompt - devil's advocate that pushes back on ideas
function getChallengerPrompt(audienceType?: string): string {
  const audienceEmphasis = audienceType && AUDIENCE_PROMPTS[audienceType]
    ? `\n\nAUDIENCE-SPECIFIC FOCUS:\n${AUDIENCE_PROMPTS[audienceType]}`
    : "";

  return `You are a brutally honest product strategist and devil's advocate. Your job is to stress-test ideas before founders waste time building something that won't work.

CRITICAL CONVERSATION RULES:
- Ask EXACTLY ONE tough question per response. Never list multiple.
- Keep responses SHORT (2-3 paragraphs max)
- Be direct but respectful - you're trying to help, not discourage
- Point out real competitors, market realities, and potential failures
- Find weak spots in their thinking, but also identify opportunities

YOUR APPROACH:
- Challenge assumptions: "What makes you think users would pay for this?"
- Surface competition: "Company X already does this with $50M in funding. What's your edge?"
- Question market size: "How many people actually have this problem?"
- Probe unit economics: "Customer acquisition in this space costs $XX. How does that work?"
- Find weak spots to exploit: "Competitor Y has terrible mobile UX - that could be your angle"
${audienceEmphasis}

TOPICS TO STRESS-TEST (one at a time):
1. Competition - Who else does this? Why would someone choose you?
2. Market Reality - Is this market growing? What are the trends?
3. Willingness to Pay - Have people actually paid for solutions to this?
4. Differentiation - What's genuinely unique about your approach?
5. Timing - Why now? Why hasn't this been solved already?
6. Execution Risk - What could go wrong? What's the hardest part?
7. Opportunity - Despite the challenges, what's the real opportunity here?

Be tough but constructive. Your goal is to make their idea stronger, not kill it.`;
}

// PRD Generation system prompt with flexible conversation paths
function getPRDSystemPrompt(audienceType?: string, startMode: string = "idea", conversationMode: string = "supportive", discoveryPath?: string, ideaPurpose?: string): string {
  // Use challenger mode if specified
  if (conversationMode === "challenger") {
    return getChallengerPrompt(audienceType);
  }

  const audienceEmphasis = audienceType && AUDIENCE_PROMPTS[audienceType]
    ? `\n\nAUDIENCE-SPECIFIC FOCUS:\n${AUDIENCE_PROMPTS[audienceType]}`
    : "";

  // Internal tool or personal project - skip monetization focus
  if (ideaPurpose === "internal" || ideaPurpose === "personal") {
    return `You are an expert product strategist helping someone build ${ideaPurpose === "internal" ? "an internal tool or feature" : "a personal project"}.

CRITICAL CONVERSATION RULES:
- Ask EXACTLY ONE question per response. Never list multiple questions.
- Keep responses SHORT (2-3 paragraphs max)
- Talk like a smart friend, not a formal consultant
- Acknowledge their previous answer before asking the next thing
- React genuinely - show you're listening
${audienceEmphasis}

CONVERSATION FLOW (one topic at a time, in order):
1. Problem Statement - What problem are you solving? Who will use this internally?
2. Users - Who specifically will use this? What are their roles and skill levels?
3. Current Solution - How is this handled today? What are the pain points?
4. Core Features - What are the must-have features? What's nice-to-have for later?
5. Technical Requirements - What systems does this need to integrate with? Any constraints?
6. User Experience - How should it feel to use? Any accessibility requirements?
7. Success Criteria - How will you know this is working? What defines "done"?

Be genuinely curious. Focus on solving the problem well. One question, then wait.`;
  }

  // Path for users starting with an existing audience
  if (discoveryPath === "audience_first") {
    return `You are an expert product strategist helping founders build products for their existing audience.

CRITICAL CONVERSATION RULES:
- Ask EXACTLY ONE question per response. Never list multiple questions.
- Keep responses SHORT (2-3 paragraphs max)
- Talk like a smart friend, not a corporate consultant
- Build naturally on their previous answer before asking the next thing
- React genuinely to what they share before moving on
${audienceEmphasis}

CONVERSATION FLOW (one topic at a time, in order):
1. Existing Audience - Tell me about your current audience. Who are they? How did you build this audience?
2. Audience Insights - What do you know about their biggest pain points? What do they ask you for?
3. Offer Refinement - Based on your audience, what could you offer that they'd actually pay for? What's the transformation you're providing?
4. Positioning - How does this fit with what you already do for them? Is this a new offering or an evolution?
5. Competitive Landscape - What are your audience members currently using to solve this problem?
6. Pricing Strategy - What has your audience paid for before? What's their price sensitivity?
7. MVP Definition - What's the minimum you need to build to validate this with your audience?
8. Deployment Architecture - URL structure preference? (www for landing, app. subdomain for product, or single domain?)
9. Payment Provider - Which payment service? (Stripe, or merchant-of-record like Paddle/Lemon Squeezy?)
10. Sales Tax Compliance - How will you handle sales tax as you scale?
11. Launch Plan - How will you announce this to your existing audience? Beta testers?

Be genuinely curious. You're helping them monetize an audience they already have. One question, then wait.`;
  }

  // Path for monetizable ideas - discovering the offer first
  if (startMode === "problem") {
    return `You are an expert product strategist helping founders discover profitable solutions from problems they've identified.

CRITICAL CONVERSATION RULES:
- Ask EXACTLY ONE question per response. Never list multiple questions.
- Keep responses SHORT (2-3 paragraphs max)
- Talk like a smart friend, not a corporate consultant
- Build naturally on their previous answer before asking the next thing
- React genuinely to what they share before moving on
${audienceEmphasis}

CONVERSATION FLOW (one topic at a time, in order):
1. Problem Deep-Dive - Who has this pain? How often? What's it costing them?
2. Solution Brainstorm - Generate 3-5 possible approaches. Discuss trade-offs.
3. The Offer - What transformation are you providing? Why would someone want this? What's the core value proposition?
4. Target Audience - Who specifically would pay for this? What makes them the ideal customer?
5. Commercial Opportunity - Revenue models, pricing, willingness to pay
6. Competition - What exists today? What are their weak spots you can exploit?
7. MVP Definition - Minimum to validate? Core features only.
8. Business Model - How to make money? Path to profitability?
9. Deployment Architecture - URL structure preferences? (www for marketing, app. subdomain for product, or unified domain?)
10. Payment Provider - Which payment service to integrate? (Stripe, or merchant-of-record like Paddle/Lemon Squeezy?)
11. Sales Tax Compliance - How will they handle sales tax nexus as they scale across states/countries?
12. Go-to-Market - First customers? Launch strategy?

Be genuinely curious. Focus on commercial viability. One question, then wait.`;
  }

  // Default idea-first flow with offer question
  return `You are an expert product strategist helping founders refine their ideas through natural conversation.

CRITICAL CONVERSATION RULES:
- Ask EXACTLY ONE question per response. Never list multiple questions.
- Keep responses SHORT (2-3 paragraphs max)
- Talk like a smart friend, not a formal consultant
- Acknowledge their previous answer before asking the next thing
- React genuinely - show you're listening
${audienceEmphasis}

CONVERSATION FLOW (one topic at a time, in order):
1. Problem Statement - What problem are you solving? Who has it? How painful is it?
2. The Offer - What's your core value proposition? Why would someone want this? What transformation are you providing?
3. Target Audience - Who specifically would pay for this? What makes them ideal?
4. Solution Overview - How does it work? What makes your approach unique?
5. Core Features - What's in the MVP? What's Phase 2?
6. Monetization - How will it make money? What's your pricing strategy?
7. Technical Stack - Web, mobile, or both? Key integrations needed?
8. Deployment Architecture - URL structure preference? (www for landing, app. subdomain for product, or single domain?)
9. Payment Provider - Which payment service? (Stripe, or merchant-of-record like Paddle/Lemon Squeezy?)
10. Sales Tax Strategy - How will you handle sales tax compliance as you grow?
11. Success Metrics - How will you measure success? Key KPIs?
12. Go-to-Market - Who are your first customers? Launch strategy?

Be genuinely curious. One question at a time, then wait for their answer.`;
}

// Zod schemas for structured output
const NameSuggestionSchema = z.array(z.object({
  name: z.string(),
  tagline: z.string(),
  style: z.string(),
}));

const ResearchSchema = z.object({
  viabilityScore: z.number().min(1).max(10),
  viabilityBreakdown: z.object({
    marketSize: z.number().min(1).max(10),
    competition: z.number().min(1).max(10),
    effort: z.number().min(1).max(10),
    profitPotential: z.number().min(1).max(10),
  }),
  competitors: z.array(z.object({
    name: z.string(),
    description: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    url: z.string().optional(),
  })),
  keyInsights: z.array(z.string()),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check endpoint (public, no auth)
  app.get("/api/health", async (req, res) => {
    try {
      if (isDevMode) {
        res.json({ status: "ok", mode: "dev", timestamp: new Date().toISOString() });
        return;
      }
      // Test database connection — user not existing is fine, we just need the query to succeed
      await storage.getUser("00000000-0000-0000-0000-000000000000");
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Database connection failed" });
    }
  });

  // Auth routes (email/password with JWT — no Supabase)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters" });
        return;
      }
      const { token, user } = await registerUser(email, password);
      res.json({ token, user });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes("already exists")) {
        res.status(409).json({ error: message });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }
      const { token, user } = await loginUser(email, password);
      res.json({ token, user });
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes("Invalid") || message.includes("reset")) {
        res.status(401).json({ error: message });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
      }
    }
  });

  // Get current user profile
  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      let user = await storage.getUser(authReq.user.id);
      
      // In dev mode, create the user if they don't exist
      if (!user && isDevMode) {
        user = await storage.createUser({
          id: authReq.user.id,
          email: authReq.user.email,
          subscriptionStatus: "pro",
        });
      }
      
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Change password (requires auth)
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const user = await storage.getUser(authReq.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(authReq.user.id, { password: hashedPassword });
      res.json({ success: true });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // BYOK: List user API keys (masked)
  app.get("/api/user/keys", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const keys = await storage.getUserApiKeys(authReq.user.id);
      res.json(keys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  // BYOK: Save/update user API key
  app.post("/api/user/keys", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { provider, apiKey, model } = req.body;
      if (!provider || !apiKey) {
        return res.status(400).json({ error: "Provider and apiKey are required" });
      }
      const validProviders = ["gemini", "anthropic", "openai"];
      if (!validProviders.includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }
      const { encrypt } = await import("./crypto");
      const encryptedKey = encrypt(apiKey.trim());
      const result = await storage.createUserApiKey(authReq.user.id, provider, encryptedKey, model || null);
      res.json(result);
    } catch (error) {
      console.error("Error saving API key:", error);
      res.status(500).json({ error: "Failed to save API key" });
    }
  });

  // BYOK: Delete user API key
  app.delete("/api/user/keys/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      await storage.deleteUserApiKey(id, authReq.user.id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });


  // BYOK: Update model selection for a key
  app.patch("/api/user/keys/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const { model } = req.body;
      if (typeof model !== "string" && model !== null) {
        return res.status(400).json({ error: "model must be a string or null" });
      }
      await storage.updateUserApiKeyModel(id, authReq.user.id, model || null);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating API key model:", error);
      res.status(500).json({ error: "Failed to update model" });
    }
  });

  // BYOK: List available models for a provider (uses user's key or server default)
  app.get("/api/models/:provider", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;
      const validProviders = ["gemini", "anthropic"];
      if (!validProviders.includes(provider)) {
        return res.status(400).json({ error: "Invalid provider. Supported: gemini, anthropic" });
      }

      // Get the user's BYOK key for this provider, or fall back to server default
      const byokEntry = await storage.getUserApiKey(authReq.user.id, provider);
      let apiKey: string | undefined;
      if (byokEntry) {
        apiKey = byokEntry.key;
      } else {
        apiKey = provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY;
      }

      if (!apiKey) {
        return res.status(400).json({ error: `No API key available for ${provider}. Add your key in Settings.` });
      }

      if (provider === "gemini") {
        // Gemini doesn't have a listModels method in the SDK — use REST API directly
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          const errText = await resp.text();
          console.error("Gemini models API error:", resp.status, errText);
          return res.status(resp.status).json({ error: `Gemini API error: ${resp.statusText}` });
        }
        const data = await resp.json() as { models?: Array<{ name: string; displayName: string; supportedGenerationMethods?: string[] }> };
        const models = (data.models || [])
          .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
          .map(m => ({
            id: m.name.replace("models/", ""),
            name: m.displayName,
          }));
        res.json({ models });
      } else if (provider === "anthropic") {
        // Anthropic SDK has a models.list() method
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey });
        const list = await client.models.list();
        const models = list.data.map((m: { id: string; display_name?: string }) => ({
          id: m.id,
          name: m.display_name || m.id,
        }));
        res.json({ models });
      }
    } catch (error) {
      console.error("Error listing models:", error);
      res.status(500).json({ error: "Failed to list models" });
    }
  });

  // BYOK: Get user's per-task model preferences
  app.get("/api/user/model-preferences", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const prefs = await storage.getUserModelPreferences(authReq.user.id);
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching model preferences:", error);
      res.status(500).json({ error: "Failed to fetch model preferences" });
    }
  });

  // BYOK: Set/update a per-task model preference
  app.put("/api/user/model-preferences", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { task, provider, model } = req.body;
      if (!task || !provider) {
        return res.status(400).json({ error: "task and provider are required" });
      }
      const validProviders = ["gemini", "anthropic"];
      if (!validProviders.includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }
      const result = await storage.upsertUserModelPreference(authReq.user.id, task, provider, model || null);
      res.json(result);
    } catch (error) {
      console.error("Error saving model preference:", error);
      res.status(500).json({ error: "Failed to save model preference" });
    }
  });
  // Stripe webhook - registered before requireAuth because it uses its own
  // signature verification and must receive the raw request body.
  app.post("/api/webhook/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Webhook Error: Missing signature or secret");
      return res.status(400).send("Webhook Error: Missing signature or secret");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, Array.isArray(sig) ? sig[0] : sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.error(`Webhook signature verification failed: ${errMessage}`);
      return res.status(400).send(`Webhook Error: ${errMessage}`);
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string | null;

        if (userId && subscriptionId) {
            await storage.updateUser(userId, {
                subscriptionStatus: 'pro',
                stripeSubscriptionId: subscriptionId
            });
            console.log(`User ${userId} upgraded to Pro`);
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (user) {
             await storage.updateUser(user.id, {
                 subscriptionStatus: 'free',
                 stripeSubscriptionId: null
             });
             console.log(`User ${user.id} subscription deleted`);
         }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      res.status(500).send("Webhook handler failed");
    }
  });

  // Apply auth to all API routes below
  app.use("/api", requireAuth);

  // Generate app name suggestions
  app.post("/api/generate-names", async (req, res) => {
    try {
      const { idea, type } = req.body;
      const authReq = req as unknown as AuthenticatedRequest;

      if (!idea || idea.length < 10) {
        return res.status(400).json({ error: "Please provide a product idea" });
      }

      const typeContext = type ? `Product type: ${type}` : "";

      const prompt = `Generate 6 unique app name suggestions for this idea:
${idea}

${typeContext}

Rules for good names:
- Short (1-2 words, max 12 characters preferred)
- Easy to pronounce and spell
- Memorable and catchy
- Available as a domain name (avoid common words)
- Evokes the product's purpose or feeling
- Mix of styles: playful, professional, abstract, descriptive

Return ONLY a JSON array of 6 name suggestions with this exact format:
[{"name": "AppName", "tagline": "Short catchy tagline", "style": "playful|professional|abstract|descriptive"}]`;
      const userAiService = await getAIServiceForUser(authReq.user.id, storage, "name-generation");
      const names = await userAiService.generateJSON(prompt, [], {
        schema: NameSuggestionSchema,
        maxTokens: 500
      });

      res.json({ names });
    } catch (error) {
      console.error("Error generating names:", error);
      // Fallback names
      const fallbackNames = [
        { name: "AppFlow", tagline: "Streamline your workflow", style: "professional" },
        { name: "Sparkr", tagline: "Ignite your ideas", style: "playful" },
        { name: "Nexus", tagline: "Connect everything", style: "abstract" },
        { name: "Buildly", tagline: "Build it better", style: "descriptive" },
        { name: "Vibe", tagline: "Feel the difference", style: "playful" },
        { name: "Forge", tagline: "Craft your vision", style: "professional" },
      ];
      res.json({ names: fallbackNames });
    }
  });

  // Get all projects for authenticated user
  app.get("/api/projects", async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const projectsList = await storage.getProjectsByUserId(authReq.user.id);
      res.json(projectsList);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Get single project with conversation
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const authReq = req as unknown as AuthenticatedRequest;
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const conversation = await storage.getConversationByProjectId(id);
      res.json({ ...project, conversation });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Create new project from idea or problem
  // Quick capture - create project without conversation (for marinating ideas)
  app.post("/api/projects/quick", async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { rawIdea, type = "Unknown", notes = "", targetAvatar = null } = req.body;

      if (!rawIdea || rawIdea.length < 10) {
        return res.status(400).json({ error: "Please provide at least 10 characters describing your idea" });
      }

      // Create project without conversation - for quick capture
      const project = await storage.createProject({
        title: rawIdea.substring(0, 50) + (rawIdea.length > 50 ? "..." : ""),
        description: rawIdea,
        type,
        status: "draft",
        ideaStatus: "exploring",
        progress: 0,
        rawIdea,
        startMode: "quick",
        conversationMode: "supportive",
        prdContent: null,
        notes: notes || rawIdea,
        targetAvatar,
        userId: authReq.user.id,
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating quick capture:", error);
      res.status(500).json({ error: "Failed to capture idea" });
    }
  });

  // Create new full project
  app.post("/api/projects", async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { rawIdea, type = "Unknown", startMode = "idea", conversationMode = "supportive", targetAvatar = null, discoveryPath = "idea_first", ideaPurpose = "monetize" } = req.body;

      console.log("[CREATE PROJECT] User:", authReq.user.id, "Email:", authReq.user.email);
      console.log("[CREATE PROJECT] Body:", { rawIdea: rawIdea?.substring(0, 50), type, startMode });

      if (!rawIdea || rawIdea.length < 10) {
        return res.status(400).json({ error: `Please provide at least 10 characters describing your ${startMode}` });
      }

      // Check free tier limit
      const user = await storage.getUser(authReq.user.id);
      console.log("[CREATE PROJECT] User found:", !!user, "Subscription:", user?.subscriptionStatus);
      
      if (user?.subscriptionStatus === "free") {
        const projectCount = await storage.countProjectsByUserId(authReq.user.id);
        console.log("[CREATE PROJECT] Project count:", projectCount);
        if (projectCount >= 2) {
          return res.status(402).json({
            error: "FREE_LIMIT_REACHED",
            message: "You've used your 2 free ideas. Upgrade to Pro for unlimited.",
            upgradeUrl: "/app/upgrade",
          });
        }
      }

      // Create project
      console.log("[CREATE PROJECT] Creating project...");
      const project = await storage.createProject({
        title: rawIdea.substring(0, 50) + (rawIdea.length > 50 ? "..." : ""),
        description: rawIdea,
        type,
        status: "draft",
        ideaStatus: "exploring",
        progress: 0,
        rawIdea,
        startMode,
        conversationMode,
        discoveryPath,
        ideaPurpose,
        prdContent: null,
        targetAvatar,
        userId: authReq.user.id,
      });
      console.log("[CREATE PROJECT] Project created:", project.id);

      // Create associated conversation with appropriate starting section
      const conversation = await storage.createConversation({
        projectId: project.id,
        currentSection: startMode === "problem" ? "Problem Deep-Dive" : "Problem Statement",
        currentStep: 0,
        answers: {},
      });

      // Add initial AI greeting message based on start mode and conversation mode
      let greetingMessage: string;
      if (conversationMode === "challenger") {
        greetingMessage = "Hey. I'm Idea Foundry in Challenger Mode - think of me as your brutally honest friend who won't let you waste months building something that won't work. I'll push back, point out competition, and stress-test your thinking. Don't worry, I'm on your side - I just want your idea to be bulletproof. So... what are you thinking about building?";
      } else if (startMode === "problem") {
        greetingMessage = "Hi there! I'm here to help you explore this problem. Let's dig into it together, brainstorm potential solutions, and find profitable opportunities. Tell me more about the problem you've spotted!";
      } else {
        greetingMessage = "Hi there! I'm here to help you flesh out this idea. Share your thoughts and let's explore it together!";
      }

      await storage.createMessage({
        conversationId: conversation.id,
        role: "ai",
        content: greetingMessage,
      });

      // Add user's idea as their first message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: rawIdea,
      });

      // Generate AI response to the input
      try {
        const systemPrompt = getPRDSystemPrompt(type, startMode, conversationMode, discoveryPath, ideaPurpose);
        const history: AIMessage[] = [
          { role: "assistant", content: greetingMessage },
          { role: "user", content: rawIdea },
        ];
        const userAiService = await getAIServiceForUser(authReq.user.id, storage, "idea-analysis");
        const aiResponse = await userAiService.generateText(rawIdea, history, {
          systemPrompt,
          maxTokens: 1500
        });

        await storage.createMessage({
          conversationId: conversation.id,
          role: "ai",
          content: aiResponse,
        });

        // Update conversation step
        await storage.updateConversation(conversation.id, {
          currentStep: 1,
          currentSection: startMode === "problem" ? "Problem Deep-Dive" : "Problem Statement",
        });

        // Update project progress
        await storage.updateProject(project.id, {
          progress: 10,
          status: "in_progress",
        });
      } catch (aiError) {
        console.error("Error generating AI response:", aiError);
        // Add fallback message if AI fails
        const fallbackMessage = startMode === "problem"
          ? "That's a real pain point! Let's understand it better. Who specifically experiences this problem, and how often do they encounter it?"
          : "That's an interesting idea! Let's explore it further. What specific problem are you trying to solve with this product?";

        await storage.createMessage({
          conversationId: conversation.id,
          role: "ai",
          content: fallbackMessage,
        });
      }

      res.status(201).json({ ...project, conversation });
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Update project (PATCH)
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (existingProject.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateProjectSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        ideaStatus: z.string().optional(),
        progress: z.number().optional(),
      }).strict();

      const result = updateProjectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid update data", details: result.error.flatten() });
      }
      const project = await storage.updateProject(id, result.data);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Generate competitor research and viability score for a project
  app.post("/api/projects/:id/research", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const prompt = `Analyze this business idea and provide competitor research and a viability assessment.

IDEA: ${project.title}
DESCRIPTION: ${project.description}
RAW IDEA: ${project.rawIdea}
TYPE: ${project.type}

Respond with a JSON object containing:
1. "viabilityScore": number from 1-10 (10 = highly viable)
2. "viabilityBreakdown": object with "marketSize", "competition", "effort", "profitPotential" each 1-10
3. "competitors": array of 3-5 competitor objects, each with "name", "description", "strengths" (array of 2-3 strings), "weaknesses" (array of 2-3 strings), "url" (optional)
4. "keyInsights": array of 4-6 key insights or recommendations (strings)

Be realistic and honest in your assessment. Consider market size, competition intensity, required effort to build, and profit potential.`;

      // Use per-task model preference (defaults to Anthropic for reasoning)
      const service = await getAIServiceForUser(authReq.user.id, storage, "research");

      const researchData = await service.generateJSON(prompt, [], {
        schema: ResearchSchema,
        systemPrompt: "You are a business analyst providing competitor research and viability assessments."
      });

      // Update project with research data
      const updatedProject = await storage.updateProject(id, {
        viabilityScore: researchData.viabilityScore,
        viabilityBreakdown: researchData.viabilityBreakdown,
        competitors: researchData.competitors,
        keyInsights: researchData.keyInsights,
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Error generating research:", error);
      res.status(500).json({ error: "Failed to generate research" });
    }
  });

  // Export project data as structured JSON (US-005)
  app.get("/api/projects/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const format = req.query.format as string | undefined;

      // PRD-only export
      if (format === "prd") {
        if (!project.prdContent) {
          return res.status(404).json({ error: "No PRD generated for this project" });
        }
        return res.json({
          meta: {
            exportedAt: new Date().toISOString(),
            version: "1.0",
            ideaId: project.id,
            format: "prd",
          },
          prd: project.prdContent,
        });
      }

      // User stories extraction from PRD
      if (format === "user-stories") {
        if (!project.prdContent) {
          return res.status(404).json({ error: "No PRD generated for this project" });
        }

        // Parse user stories from PRD markdown (pattern: ### US-XXX: Title)
        // Using [\s\S] instead of . with 's' flag for cross-line matching
        const userStoryPattern = /###\s*(US-\d+):\s*([\s\S]+?)(?=\n###|\n##|$)/g;
        const userStories: Array<{
          id: string;
          title: string;
          description: string;
          acceptanceCriteria: string[];
        }> = [];

        let match;
        while ((match = userStoryPattern.exec(project.prdContent)) !== null) {
          const storyId = match[1];
          const content = match[2].trim();
          const titleMatch = content.match(/^([^\n]+)/);
          const title = titleMatch ? titleMatch[1].trim() : storyId;

          // Extract acceptance criteria (lines starting with - [ ] or - [x])
          const acPattern = /-\s*\[[ x]\]\s*(.+)/gi;
          const acceptanceCriteria: string[] = [];
          let acMatch;
          while ((acMatch = acPattern.exec(content)) !== null) {
            acceptanceCriteria.push(acMatch[1].trim());
          }

          userStories.push({
            id: storyId,
            title,
            description: content.substring(title.length).trim().split("\n\n")[0] || "",
            acceptanceCriteria,
          });
        }

        return res.json({
          meta: {
            exportedAt: new Date().toISOString(),
            version: "1.0",
            ideaId: project.id,
            format: "user-stories",
          },
          userStories,
        });
      }

      // Full export (default)
      const exportData = {
        meta: {
          exportedAt: new Date().toISOString(),
          version: "1.0",
          ideaId: project.id,
          format: "full",
        },
        idea: {
          id: project.id,
          title: project.title,
          description: project.description,
          type: project.type,
          status: project.status,
          ideaStatus: project.ideaStatus,
          rawIdea: project.rawIdea,
          githubRepoUrl: project.githubRepoUrl,
          notes: project.notes,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        prd: project.prdContent || null,
        viability: project.viabilityScore ? {
          score: project.viabilityScore,
          breakdown: project.viabilityBreakdown,
          competitors: project.competitors,
          insights: project.keyInsights,
        } : null,
        techStack: project.techStack || null,
        targetAvatar: project.targetAvatar || null,
      };

      res.json(exportData);
    } catch (error) {
      console.error("Error exporting project:", error);
      res.status(500).json({ error: "Failed to export project" });
    }
  });

  // Export user stories to GitHub Issues (US-007)
  app.post("/api/projects/:id/export-github", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { pat, owner, repo, userStories } = req.body;

      if (!pat || typeof pat !== "string") {
        return res.status(400).json({ error: "GitHub Personal Access Token is required" });
      }
      if (!owner || !repo) {
        return res.status(400).json({ error: "GitHub owner and repo are required" });
      }
      if (!Array.isArray(userStories) || userStories.length === 0) {
        return res.status(400).json({ error: "At least one user story is required" });
      }

      const created: Array<{ id: string; issueNumber: number; issueUrl: string }> = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const story of userStories) {
        try {
          // Build issue body with acceptance criteria as checklist
          let body = `**${story.title}**\n\n`;
          if (story.description) {
            body += `${story.description}\n\n`;
          }
          if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
            body += `## Acceptance Criteria\n\n`;
            for (const ac of story.acceptanceCriteria) {
              body += `- [ ] ${ac}\n`;
            }
          }
          body += `\n---\n*Exported from Idea Foundry - ${project.title}*`;

          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${pat}`,
              "Content-Type": "application/json",
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Idea-Foundry",
            },
            body: JSON.stringify({
              title: `${story.id}: ${story.title}`,
              body,
              labels: ["user-story", "from-prd"],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }

          const issueData = await response.json();
          created.push({
            id: story.id,
            issueNumber: issueData.number,
            issueUrl: issueData.html_url,
          });
        } catch (error: any) {
          failed.push({
            id: story.id,
            error: error.message || "Unknown error",
          });
        }
      }

      res.json({ created, failed });
    } catch (error) {
      console.error("Error exporting to GitHub:", error);
      res.status(500).json({ error: "Failed to export to GitHub" });
    }
  });

  // Generate tech stack recommendation for a project
  app.post("/api/projects/:id/recommend-stack", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check for cached recommendation (allow force refresh via query param)
      const forceRefresh = req.query.refresh === 'true';
      if (!forceRefresh && project.techStackRecommendation &&
        typeof project.techStackRecommendation === 'object' &&
        Object.keys(project.techStackRecommendation).length > 0) {
        return res.json(project.techStackRecommendation);
      }

      // Get conversation context if available
      let conversationContext = "";
      const conversation = await storage.getConversationByProjectId(id);
      if (conversation) {
        const messagesList = await storage.getMessagesByConversation(conversation.id);
        // Get last 10 messages for context
        const recentMessages = messagesList.slice(-10);
        if (recentMessages.length > 0) {
          conversationContext = recentMessages
            .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}...`)
            .join("\n");
        }
      }

      const prompt = `Analyze this project idea and recommend an optimal tech stack for a solo founder or small team.

PROJECT: ${project.title}
DESCRIPTION: ${project.description}
RAW IDEA: ${project.rawIdea}
TYPE: ${project.type}
PURPOSE: ${project.ideaPurpose || "monetize"}
${conversationContext ? `\nCONTEXT FROM CONVERSATION:\n${conversationContext}` : ""}

Consider:
1. Speed to MVP - prioritize fast iteration and time-to-market
2. AI coding assistant compatibility - choose well-documented, popular technologies
3. Cost efficiency - free tiers where possible for early stage
4. Scalability - can grow with the product without major rewrites
5. Solo founder friendly - minimize DevOps complexity
6. The project type and purpose when making recommendations

Return a JSON object with this exact structure:
{
  "recommended": {
    "frontend": { "name": "Technology name", "reason": "Brief reason why" },
    "backend": { "name": "Technology name", "reason": "Brief reason why" },
    "database": { "name": "Technology name", "reason": "Brief reason why" },
    "hosting": { "name": "Technology name", "reason": "Brief reason why" },
    "auth": { "name": "Technology name", "reason": "Brief reason why" },
    "payments": { "name": "Technology name", "reason": "Brief reason why" }
  },
  "fullStack": {
    "name": "Full-stack alternative if applicable",
    "reason": "Why this could be a simpler choice"
  },
  "aiAssistants": [
    { "name": "AI Tool Name", "bestFor": "What it's best at", "tip": "Optional pro tip" }
  ],
  "mvpTimeline": "Estimated time to MVP (e.g., '2-4 weeks')",
  "costEstimate": "Monthly infrastructure cost estimate (e.g., '$0-50/month')",
  "warnings": ["Array of things to watch out for or consider"]
}

Be practical and opinionated. Choose technologies that work well together and are widely supported by AI coding assistants.`;

      // Use per-task model preference (defaults to Anthropic for reasoning)
      const service = await getAIServiceForUser(authReq.user.id, storage, "tech-stack");

      const recommendation = await service.generateJSON(prompt, [], {
        schema: TechStackRecommendationSchema,
        systemPrompt: "You are a senior full-stack architect helping founders choose the right tech stack for their projects. Be practical, opinionated, and focused on speed to MVP.",
        maxTokens: 1500
      });

      // Cache the recommendation
      await storage.updateProject(id, {
        techStackRecommendation: recommendation
      });

      res.json(recommendation);
    } catch (error) {
      console.error("Error generating tech stack recommendation:", error);
      res.status(500).json({ error: "Failed to generate tech stack recommendation" });
    }
  });

  // Start conversation for an existing project (for quick-capture projects)
  app.post("/api/projects/:id/start-conversation", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;
      const { conversationMode = "supportive" } = req.body;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if conversation already exists
      const existingConversation = await storage.getConversationByProjectId(id);
      if (existingConversation) {
        return res.json(existingConversation);
      }

      // Create new conversation
      const conversation = await storage.createConversation({
        projectId: id,
        currentSection: "Problem Statement",
        currentStep: 0,
        answers: {},
      });

      // Add initial AI greeting
      const greeting = conversationMode === "challenging"
        ? `Welcome! I'm here to challenge your idea and help you think critically about it.\n\nYou shared: "${project.rawIdea?.substring(0, 100)}..."\n\nLet me ask you some tough questions. What specific problem are you trying to solve, and why do you think people will pay for this solution?`
        : `Hi! I'm excited to help you explore and develop your idea.\n\nYou shared: "${project.rawIdea?.substring(0, 100)}..."\n\nLet's start by understanding the problem. What specific pain point or need does your idea address?`;

      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: greeting,
      });

      // Update project to reflect it now has an active conversation
      await storage.updateProject(id, {
        startMode: "idea",
        conversationMode,
      });

      res.json(conversation);
    } catch (error) {
      console.error("Error starting conversation:", error);
      res.status(500).json({ error: "Failed to start conversation" });
    }
  });

  // Get conversation with messages
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const project = await storage.getProject(conversation.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messagesList = await storage.getMessagesByConversation(id);
      res.json({ ...conversation, messages: messagesList });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Send message and get AI response
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Get conversation to check current step
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Get project to determine audience type, start mode, and conversation mode
      const project = await storage.getProject(conversation.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Save user message
      await storage.createMessage({
        conversationId,
        role: "user",
        content: content.trim(),
      });

      // Get conversation history
      const messagesList = await storage.getMessagesByConversation(conversationId);
      const chatHistory = messagesList.map((m) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));
      const audienceType = project?.type;
      const projectStartMode = project?.startMode || "idea";
      const projectConversationMode = project?.conversationMode || "supportive";
      const projectDiscoveryPath = project?.discoveryPath || "idea_first";
      const projectIdeaPurpose = project?.ideaPurpose || "monetize";

      const systemPrompt = getPRDSystemPrompt(audienceType, projectStartMode, projectConversationMode, projectDiscoveryPath, projectIdeaPurpose);

      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      // Stream AI response chunks — use per-task model preference
      const userAiService = await getAIServiceForUser(authReq.user.id, storage, "brainstorming");
      let aiResponse = "";

      try {
        for await (const chunk of userAiService.generateTextStream(content.trim(), chatHistory, {
          systemPrompt,
          maxTokens: 1500
        })) {
          aiResponse += chunk;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      } catch (streamError) {
        console.error("Streaming error (BYOK key may be invalid):", streamError);

        // If we got partial response, save it and end
        if (aiResponse) {
          await storage.createMessage({
            conversationId,
            role: "ai",
            content: aiResponse + "\n\n*[Response was interrupted]*",
          });
          res.write(`data: ${JSON.stringify({ error: "Stream interrupted", partial: true })}\n\n`);
          res.end();
          return;
        }

        // No partial response — try falling back to server default keys
        console.log("Falling back to server default AI key...");
        const fallbacks: { name: string; service: AIService }[] = [];
        if (process.env.GEMINI_API_KEY) {
          fallbacks.push({ name: "Gemini", service: new GeminiAdapter() });
        }
        if (process.env.ANTHROPIC_API_KEY) {
          fallbacks.push({ name: "Anthropic", service: new AnthropicAdapter() });
        }

        let fallbackSucceeded = false;
        for (const { name, service: fallbackService } of fallbacks) {
          try {
            console.log(`Trying ${name} fallback...`);
            for await (const chunk of fallbackService.generateTextStream(content.trim(), chatHistory, {
              systemPrompt,
              maxTokens: 1500
            })) {
              aiResponse += chunk;
              res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            }
            fallbackSucceeded = true;
            break;
          } catch (fallbackError) {
            console.error(`${name} fallback failed:`, fallbackError);
          }
        }

        if (!fallbackSucceeded) {
          res.write(`data: ${JSON.stringify({ error: "Failed to generate response. Please check your API key in Settings." })}\n\n`);
          res.end();
          return;
        }
      }

      // Save AI message
      await storage.createMessage({
        conversationId,
        role: "ai",
        content: aiResponse,
      });

      const newStep = conversation.currentStep + 1;

      // Different section flows for idea vs problem mode
      const ideaSections = [
        { step: 0, section: "Problem Statement", progress: 10 },
        { step: 1, section: "Target Audience", progress: 25 },
        { step: 2, section: "Solution Overview", progress: 40 },
        { step: 3, section: "Core Features", progress: 55 },
        { step: 4, section: "Monetization", progress: 70 },
        { step: 5, section: "Technical Specs", progress: 85 },
        { step: 6, section: "Finalizing", progress: 100 },
      ];

      const problemSections = [
        { step: 0, section: "Problem Deep-Dive", progress: 10 },
        { step: 1, section: "Solution Brainstorm", progress: 20 },
        { step: 2, section: "Target Audience", progress: 35 },
        { step: 3, section: "Commercial Opportunity", progress: 50 },
        { step: 4, section: "Competition", progress: 65 },
        { step: 5, section: "MVP Definition", progress: 80 },
        { step: 6, section: "Business Model", progress: 90 },
        { step: 7, section: "Finalizing", progress: 100 },
      ];

      const sections = projectStartMode === "problem" ? problemSections : ideaSections;
      const currentPhase = sections.find(s => s.step === newStep) || sections[sections.length - 1];

      await storage.updateConversation(conversationId, {
        currentStep: newStep,
        currentSection: currentPhase.section,
      });

      // Update project progress
      if (project) {
        await storage.updateProject(conversation.projectId, {
          progress: currentPhase.progress,
          status: currentPhase.progress === 100 ? "completed" : "in_progress",
        });
      }

      // Send final event with metadata
      res.write(`data: ${JSON.stringify({ done: true, step: newStep, section: currentPhase.section, progress: currentPhase.progress })}\n\n`);
      res.end();

    } catch (error) {
      console.error("Error processing message:", error);
      // If SSE headers already sent, send error as SSE event then close
      if (res.headersSent) {
        try {
          res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
          res.end();
        } catch {
          // Connection already closed
        }
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  // Notes API
  app.get("/api/projects/:id/notes", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const notesList = await storage.getNotesByProject(projectId);
      res.json(notesList);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/projects/:id/notes", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;
      const { content } = req.body;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Note content is required" });
      }

      const note = await storage.createNote({
        projectId,
        content: content.trim(),
      });
      res.json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      const project = await storage.getProject(note.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteNote(noteId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Generate PRD
  app.post("/api/projects/:id/generate-prd", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Handle both "track" (from idea-detail) and "format" (from prd-view) params
      const validTracks = ["quick", "standard", "production"];
      const formatToTrack: Record<string, string> = { full: "standard", business: "standard", pitch: "quick" };
      const requestedTrack = req.body?.track || formatToTrack[req.body?.format] || "standard";
      const track = validTracks.includes(requestedTrack) ? requestedTrack : "standard";
      const userRequirements = req.body?.userRequirements || "";

      // Build context from conversation if available
      let conversationContext = "";
      const conversation = await storage.getConversationByProjectId(projectId);
      if (conversation) {
        const messagesList = await storage.getMessagesByConversation(conversation.id);
        conversationContext = messagesList
          .map(m => `${m.role === "user" ? "Founder" : "PM"}: ${m.content}`)
          .join("\n\n");
      }

      // Build base context from project data
      const projectContext = `
IDEA TITLE: ${project.title}
IDEA DESCRIPTION: ${project.description}
RAW IDEA: ${project.rawIdea}
TYPE: ${project.type}
NOTES: ${project.notes || "None"}
${conversationContext ? `\nCONVERSATION:\n${conversationContext}` : ""}
${userRequirements ? `\nUSER REQUIREMENTS:\n${userRequirements}` : ""}
`;

      // Implementation status section included in all PRD formats
      const implementationStatusSection = `
## Implementation Status

> **Instructions for AI Agent:** As you implement this PRD, update this section to track your progress. Change the status of each item as you work through it. This section serves as a living record of what has been completed, what is in progress, and what remains.
>
> **Status Legend:**
> - \`[ ]\` Not Started
> - \`[~]\` In Progress
> - \`[x]\` Complete
> - \`[!]\` Blocked (add note explaining why)
>
> **How to update:** After completing each feature or section, come back to this status table and mark it accordingly. Add notes about any deviations from the PRD, issues encountered, or decisions made during implementation.

### Overall Progress
- [ ] Project Setup & Configuration
- [ ] Database Schema & Migrations
- [ ] Backend API Endpoints
- [ ] Frontend Pages & Components
- [ ] Authentication & Authorization
- [ ] Core Feature Integration
- [ ] Testing & Validation
- [ ] Deployment

### Feature Implementation Status
<!-- AI Agent: Replace the items below with the actual features from this PRD as you begin implementation. Mark each with the appropriate status. -->

| Feature | Status | Notes |
|---------|--------|-------|
| [Feature 1 from PRD] | [ ] Not Started | |
| [Feature 2 from PRD] | [ ] Not Started | |
| [Feature 3 from PRD] | [ ] Not Started | |

### Implementation Log
<!-- AI Agent: Add dated entries here as you make progress. Example: -->
<!-- - **[Date]**: Started project setup, initialized repo, installed dependencies -->
<!-- - **[Date]**: Completed database schema, all migrations running -->
<!-- - **[Date]**: Feature X complete, moved to Feature Y -->
`;

      let prdPrompt = "";
      let maxTokens = 4000;

      if (track === "quick") {
        maxTokens = 3000;
        prdPrompt = `Create a QUICK PRD for rapid prototyping. This will be used by an AI coding agent (like Claude Code, Cursor, etc.) to build a working prototype.

${projectContext}

Generate a concise PRD with these sections:

# [Product Name] - Quick PRD

${implementationStatusSection}

## Overview
- One paragraph explaining what this product does and who it's for

## Problem
- The core problem being solved (2-3 sentences)

## Solution
- How the product solves it (2-3 sentences)

## Core Features (MVP)
List 3-5 essential features. For each:
- **Feature Name**: Brief description
- User Story: "As a [user], I want [action] so that [benefit]"

## Tech Stack Recommendation
- Frontend: [recommendation]
- Backend: [recommendation]
- Database: [recommendation]
- Key dependencies to install

## Pages/Screens
List the main pages needed with a one-line description each

## Data Model (Simple)
List the main entities and their key fields (just field names, not full schema)

IMPORTANT: In the "Implementation Status" section, replace the placeholder feature names in the Feature Implementation Status table with the actual features you defined in "Core Features (MVP)" above, each marked as "[ ] Not Started".

Keep the entire document under 1500 words. Be specific enough that an AI can start building immediately.`;

      } else if (track === "standard") {
        maxTokens = 6000;
        prdPrompt = `Create a STANDARD PRD with enough detail for AI coding agents to implement well.

${projectContext}

Generate a detailed PRD with these sections:

# [Product Name] - Product Requirements Document

${implementationStatusSection}

## 1. Executive Summary
- Problem statement (2-3 sentences)
- Solution overview (2-3 sentences)
- Target users
- Key differentiators

## 2. User Personas
For the primary persona:
- Name, role, demographics
- Goals and motivations
- Pain points and frustrations
- How they'll use the product

## 3. Core Features (MVP)
For each of 5-8 features:
- **Feature Name**
- Description (what it does)
- User Story: "As a [user], I want [action] so that [benefit]"
- Acceptance Criteria (3-5 testable criteria as checkboxes)
- Priority: Must-have / Should-have / Nice-to-have

## 4. Technical Architecture
### Tech Stack
- Frontend: [specific framework/library with version]
- Backend: [specific framework with version]
- Database: [type and why]
- Authentication: [approach]
- Hosting: [recommendation]

### API Endpoints
List the main API endpoints:
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|

### Database Schema
For each table/collection:
- Table name
- Fields with types
- Relationships

## 5. UI Components
List the main UI components needed:
- Component name
- Purpose
- Key props/state

## 6. Pages/Routes
| Route | Page | Components Used | Description |
|-------|------|-----------------|-------------|

## 7. Monetization
- Pricing model
- Revenue streams

## 8. Success Metrics
- 3-5 KPIs with target values

## 9. MVP Roadmap
- Week 1-2: [priorities]
- Week 3-4: [priorities]

## 10. Risks
- Top 3 technical risks and mitigations

IMPORTANT: In the "Implementation Status" section, replace the placeholder feature names in the Feature Implementation Status table with the actual features you defined in "Core Features (MVP)" above, each marked as "[ ] Not Started".

Be specific with technology choices and include enough detail that an AI can implement each feature.`;

      } else {
        maxTokens = 10000;
        prdPrompt = `Create a PRODUCTION-READY PRD with maximum detail. This PRD will be used by AI coding agents (like Claude Code, Cursor, Windsurf, etc.) to implement a complete application. Include code examples, file structures, and step-by-step guidance.

${projectContext}

Generate an exhaustive PRD with these sections:

# [Product Name] - Production PRD

${implementationStatusSection}

## 1. Executive Summary
- Problem statement
- Solution overview
- Target market and size
- Competitive advantage
- Revenue potential

## 2. User Research & Personas
### Primary Persona
- Detailed demographics and psychographics
- Day-in-the-life scenario
- Goals, motivations, and frustrations
- Current solutions and why they fail
- Feature priorities

### Secondary Persona (if applicable)
- Same detail as primary

### User Journey Map
Step-by-step journey from discovery to regular use

## 3. Feature Specifications

For each feature (6-10 features):

### Feature: [Name]
**Priority:** Must-have / Should-have / Nice-to-have
**Complexity:** Low / Medium / High

**Description:**
[Detailed description of what this feature does]

**User Stories:**
- As a [user type], I want [action], so that [benefit]
- As a [user type], I want [action], so that [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1 (specific and testable)
- [ ] Criterion 2
- [ ] Criterion 3
- [ ] Criterion 4

**UI/UX Requirements:**
- Component placement
- Interaction patterns
- Responsive behavior

**Error Handling:**
- Error state 1: [what triggers it] → [how to handle]
- Error state 2: [what triggers it] → [how to handle]

**Edge Cases:**
- Edge case 1: [scenario] → [expected behavior]
- Edge case 2: [scenario] → [expected behavior]

---

## 4. Technical Architecture

### Tech Stack (with justification)
| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Frontend | | | |
| Backend | | | |
| Database | | | |
| Auth | | | |
| Hosting | | | |

### Project File Structure
\`\`\`
project-root/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── [feature]/    # Feature-specific components
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   └── App.tsx
├── server/
│   ├── routes.ts             # API routes
│   ├── storage.ts            # Database operations
│   └── index.ts              # Server entry
├── shared/
│   └── schema.ts             # Shared types/schema
└── package.json
\`\`\`

### Database Schema (Complete)
Define all tables needed for this specific application. For each table include:
- Table name (snake_case)
- All fields with PostgreSQL types
- Primary keys, foreign keys, and indexes
- Relationships between tables

Example format:
\`\`\`sql
-- Table: [entity_name]
CREATE TABLE [entity_name] (
  id SERIAL PRIMARY KEY,
  [field_name] [TYPE] [CONSTRAINTS],
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

List ALL tables required for the MVP features described above.

### API Specification (Complete)

#### Endpoint: [METHOD] /api/[path]
**Description:** [What this endpoint does]
**Authentication:** Required / Optional / None
**Request:**
\`\`\`json
{
  "field1": "type and description",
  "field2": "type and description"
}
\`\`\`
**Response (Success - 200):**
\`\`\`json
{
  "data": { ... }
}
\`\`\`
**Response (Error - 400/401/500):**
\`\`\`json
{
  "error": "Error message"
}
\`\`\`

[Repeat for all endpoints]

## 5. UI Component Library

### Component: [ComponentName]
**Purpose:** [What it does]
**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|

**Usage Example:**
\`\`\`tsx
<ComponentName prop1="value" prop2={data} />
\`\`\`

[Repeat for major components]

## 6. Page Specifications

### Page: [Page Name]
**Route:** /path
**Purpose:** [What users do here]
**Components Used:** [List of components]
**Data Requirements:** [What API calls are needed]
**State Management:** [Local state, server state, etc.]

**Wireframe Description:**
[Text description of layout - header, main content areas, sidebar if any]

**User Interactions:**
1. User clicks X → Y happens
2. User submits form → Z happens

[Repeat for all pages]

## 7. Implementation Guide (Step-by-Step)

### Phase 1: Project Setup
1. Initialize project with [command]
2. Install dependencies: [list]
3. Set up database schema
4. Configure environment variables:
   - DATABASE_URL
   - [other env vars]

### Phase 2: Core Backend
1. Implement [feature] API endpoint
   - Create route handler
   - Add storage method
   - Test with curl/Postman
2. [Next feature]

### Phase 3: Core Frontend
1. Create [component]
2. Build [page]
3. Connect to API

### Phase 4: Polish & Testing
1. Error handling
2. Loading states
3. Basic styling
4. Manual testing

## 8. Environment & Configuration

### Required Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | postgres://... |

### Package Dependencies
\`\`\`json
{
  "dependencies": {
    "[package]": "[version]"
  }
}
\`\`\`

## 9. Validation & Testing

### Manual Test Cases
| Test | Steps | Expected Result |
|------|-------|-----------------|
| [Feature] works | 1. Do X, 2. Do Y | Z should happen |

## 10. Monetization Strategy
- Pricing tiers
- Payment integration approach

## 11. Success Metrics & KPIs
| Metric | Target | How to Measure |
|--------|--------|----------------|

## 12. Risks & Mitigation
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|

## 13. Future Roadmap
- Phase 2 features (3-6 months)
- Phase 3 features (6-12 months)

---

IMPORTANT: In the "Implementation Status" section, replace the placeholder feature names in the Feature Implementation Status table with the actual features you defined in "Feature Specifications" above, each marked as "[ ] Not Started". Also update the "Overall Progress" checklist to reflect the actual phases from your Implementation Guide.
This PRD should be detailed enough that even a basic AI model can follow the step-by-step implementation guide and build a working application. Include actual code patterns and specific technology recommendations.`;
      }

      // Use per-task model preference (defaults to Anthropic for PRD generation)
      const service = await getAIServiceForUser(authReq.user.id, storage, "prd-generation");
      const prdContent = await service.generateText(prdPrompt, [], {
        systemPrompt: "You are an expert product manager and technical architect. Generate comprehensive, actionable PRDs that AI coding agents can use to implement complete applications. Always fill in the Implementation Status section with the actual features from the PRD.",
        maxTokens,
      });

      // Save PRD to project
      await storage.updateProject(projectId, {
        prdContent,
        status: "completed",
        progress: 100,
      });

      res.json({ prdContent });
    } catch (error) {
      console.error("Error generating PRD:", error);
      res.status(500).json({ error: "Failed to generate PRD" });
    }
  });

  // Create Synergy Analysis
  app.post("/api/projects/:id/synergies", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check for cached synergy analysis
      if (project.synergyAnalysis && typeof project.synergyAnalysis === 'object' && Object.keys(project.synergyAnalysis).length > 0) {
        return res.json(project.synergyAnalysis);
      }

      // Get all other projects for this user
      const allProjects = await storage.getProjectsByUserId(authReq.user.id);
      const otherProjects = allProjects.filter(p => p.id !== id);

      if (otherProjects.length === 0) {
        return res.json({
          synergies: [],
          summary: "No other projects found to analyze synergies with."
        });
      }

      // Prepare data for AI
      // Simple summary of other projects to keep prompt token count reasonable
      const projectsSummary = otherProjects.map(p =>
        `- ${p.title} (${p.type}): ${p.description.substring(0, 100)}...`
      ).join("\n");

      const prompt = `Analyze potential synergies between this project and my other active projects.

CURRENT PROJECT:
Title: ${project.title}
Type: ${project.type}
Description: ${project.description}

OTHER PROJECTS:
${projectsSummary}

Identify cross-promotion opportunities, shared technical components, or strategic integrations.
Focus on practical, actionable ways these projects could benefit each other.

Return a JSON object with this structure:
{
  "summary": "Overall assessment of synergy potential",
  "opportunities": [
    {
      "projectId": number (ID of the related project),
      "projectTitle": "Title of related project",
      "synergyType": "Cross-promotion" | "Integration" | "Shared Tech",
      "description": "Specific actionable suggestion",
      "potentialValue": "High" | "Medium" | "Low"
    }
  ]
}`;
      // Use per-task model preference (defaults to Anthropic for analysis)
      const service = await getAIServiceForUser(authReq.user.id, storage, "synergy-analysis");

      const SynergySchema = z.object({
        summary: z.string(),
        opportunities: z.array(z.object({
          projectId: z.number().optional(), // AI might not map ID perfectly from text list, handle with care in UI
          projectTitle: z.string(),
          synergyType: z.enum(["Cross-promotion", "Integration", "Shared Technology", "Shared Tech"]).transform(val => val === "Shared Technology" ? "Shared Tech" : val),
          description: z.string(),
          potentialValue: z.enum(["High", "Medium", "Low"])
        }))
      });

      const synergyData = await service.generateJSON(prompt, [], {
        schema: SynergySchema,
        maxTokens: 1000
      });

      // Cache the result
      await storage.updateProject(id, {
        synergyAnalysis: synergyData
      });

      res.json(synergyData);
    } catch (error) {
      console.error("Error generating synergies:", error);
      res.status(500).json({ error: "Failed to generate synergy analysis" });
    }
  });

  // Stripe Integration
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const user = await storage.getUser(authReq.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const customer = await getOrCreateCustomer(user.email, user.username || undefined);
      
      if (!user.stripeCustomerId) {
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const returnUrl = `${baseUrl}/app/upgrade`;

      const session = await createCheckoutSession(customer.id, returnUrl, user.id);
      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/create-portal-session", async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const user = await storage.getUser(authReq.user.id);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No subscription found" });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const returnUrl = `${baseUrl}/app/upgrade`;

      const session = await createPortalSession(user.stripeCustomerId, returnUrl);
      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Portal error:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // API Token routes (US-008)
  app.get("/api/tokens", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tokens = await storage.getApiTokensByUserId(authReq.user.id);
      res.json(tokens);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      res.status(500).json({ error: "Failed to fetch tokens" });
    }
  });

  app.post("/api/tokens", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: "Token name is required" });
      }

      const trimmedName = name.trim();
      if (trimmedName.length > 100) {
        return res.status(400).json({ error: "Token name must be 100 characters or less" });
      }

      const result = await storage.createApiToken({
        userId: authReq.user.id,
        name: trimmedName,
        expiresAt: null,
      });

      res.status(201).json({
        id: result.metadata.id,
        name: result.metadata.name,
        token: result.token, // Only shown once
        createdAt: result.metadata.createdAt,
      });
    } catch (error) {
      console.error("Error creating token:", error);
      res.status(500).json({ error: "Failed to create token" });
    }
  });

  app.delete("/api/tokens/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(400).json({ error: "Token ID is required" });
      }
      const tokenId = parseInt(id, 10);
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: "Token ID must be a valid number" });
      }

      // Verify ownership
      const tokens = await storage.getApiTokensByUserId(authReq.user.id);
      const tokenExists = tokens.some(t => t.id === tokenId);
      
      if (!tokenExists) {
        return res.status(404).json({ error: "Token not found" });
      }

      await storage.deleteApiToken(tokenId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting token:", error);
      res.status(500).json({ error: "Failed to delete token" });
    }
  });

  // MCP Server setup (US-001, US-003, US-005, US-006)

  // Rate limiter for MCP endpoints (100 req/min per token)
  const mcpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    keyGenerator: (req) => {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        // Use first 20 chars of auth header as key for rate limiting
        return authHeader.slice(0, 20);
      }
      // Fallback to 'unknown' - don't use IP to avoid IPv6 issues
      return 'anonymous';
    },
    validate: { xForwardedForHeader: false }, // Disable IPv6 validation warning
    handler: (_req, res) => {
      res.status(429).json({
        error: "Too many requests",
        retryAfter: "60s"
      });
    },
  });

  // MCP HTTP endpoint (FR-9)
  app.post("/api/mcp", mcpLimiter, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const userId = await validateApiToken(authHeader);

      if (!userId) {
        return res.status(401).json({ error: "Invalid or missing API token" });
      }

      // Handle MCP requests (tool calls)
      const { tool, params } = req.body;

      if (tool) {
        // Execute the requested tool
        const result = await executeMcpTool(tool, params || {}, userId);
        return res.json(result);
      }

      // Return server capabilities if no specific tool requested
      res.json({
        server: "idea-foundry",
        version: "1.0.0",
        tools: MCP_TOOLS,
        resources: [
          {
            name: "idea://foundry/{ideaId}",
            description: "Get full context for an idea including conversation history",
          },
        ],
      });
    } catch (error) {
      console.error("MCP endpoint error:", error);
      res.status(500).json({ error: "MCP server error" });
    }
  });

  return httpServer;
}
