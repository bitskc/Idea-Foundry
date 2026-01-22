import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { speechToText, textToSpeech, ensureCompatibleFormat } from "./replit_integrations/audio/client";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Generate app name suggestions
  app.post("/api/generate-names", async (req, res) => {
    try {
      const { idea, type } = req.body;
      
      if (!idea || idea.length < 10) {
        return res.status(400).json({ error: "Please provide a product idea" });
      }

      const typeContext = type ? `Product type: ${type}` : "";
      
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are a creative brand naming expert. Generate unique, memorable app/product names.
            
Rules for good names:
- Short (1-2 words, max 12 characters preferred)
- Easy to pronounce and spell
- Memorable and catchy
- Available as a domain name (avoid common words)
- Evokes the product's purpose or feeling
- Mix of styles: playful, professional, abstract, descriptive

Return ONLY a JSON array of 6 name suggestions with this exact format:
[{"name": "AppName", "tagline": "Short catchy tagline", "style": "playful|professional|abstract|descriptive"}]`
          },
          {
            role: "user",
            content: `Generate 6 unique app name suggestions for this idea:
${idea}

${typeContext}

Return only the JSON array, no other text.`
          }
        ],
        max_completion_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "[]";
      
      // Parse JSON from response
      let names = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          names = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing names:", parseError);
      }
      
      // Ensure we always have 6 suggestions
      const fallbackNames = [
        { name: "AppFlow", tagline: "Streamline your workflow", style: "professional" },
        { name: "Sparkr", tagline: "Ignite your ideas", style: "playful" },
        { name: "Nexus", tagline: "Connect everything", style: "abstract" },
        { name: "Buildly", tagline: "Build it better", style: "descriptive" },
        { name: "Vibe", tagline: "Feel the difference", style: "playful" },
        { name: "Forge", tagline: "Craft your vision", style: "professional" },
      ];
      
      while (names.length < 6) {
        names.push(fallbackNames[names.length % fallbackNames.length]);
      }

      res.json({ names: names.slice(0, 6) });
    } catch (error) {
      console.error("Error generating names:", error);
      res.status(500).json({ error: "Failed to generate names" });
    }
  });

  // Speech-to-Text: Transcribe audio to text
  app.post("/api/speech-to-text", async (req, res) => {
    try {
      const { audio } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: "No audio data provided" });
      }

      const audioBuffer = Buffer.from(audio, "base64");
      const { buffer, format } = await ensureCompatibleFormat(audioBuffer);
      const transcript = await speechToText(buffer, format);
      
      res.json({ transcript });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Text-to-Speech: Convert text to audio
  app.post("/api/text-to-speech", async (req, res) => {
    try {
      const { text, voice = "nova" } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const audioBuffer = await textToSpeech(text, voice, "mp3");
      const audioBase64 = audioBuffer.toString("base64");
      
      res.json({ audio: audioBase64 });
    } catch (error) {
      console.error("Error generating speech:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projectsList = await storage.getAllProjects();
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
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating quick capture:", error);
      res.status(500).json({ error: "Failed to capture idea" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { rawIdea, type = "Unknown", startMode = "idea", conversationMode = "supportive", targetAvatar = null, discoveryPath = "idea_first", ideaPurpose = "monetize" } = req.body;
      
      if (!rawIdea || rawIdea.length < 10) {
        return res.status(400).json({ error: `Please provide at least 10 characters describing your ${startMode}` });
      }

      // Create project
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
      });

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
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: getPRDSystemPrompt(type, startMode, conversationMode, discoveryPath, ideaPurpose) },
            { role: "assistant", content: greetingMessage },
            { role: "user", content: rawIdea },
          ],
          max_completion_tokens: 1500,
        });

        const fallbackResponse = startMode === "problem"
          ? "That's a real pain point! Let's understand it better. Who specifically experiences this problem, and how often do they encounter it?"
          : "That's an interesting idea! Let's dive deeper. What specific problem are you trying to solve with this?";
        
        const aiContent = aiResponse.choices[0]?.message?.content || fallbackResponse;
        
        await storage.createMessage({
          conversationId: conversation.id,
          role: "ai",
          content: aiContent,
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
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
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
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
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

Be realistic and honest in your assessment. Consider market size, competition intensity, required effort to build, and profit potential.

IMPORTANT: Return ONLY valid JSON, no markdown or explanation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a business analyst providing competitor research and viability assessments. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "{}";
      let researchData;
      try {
        researchData = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse research response:", content);
        throw new Error("Invalid research response format");
      }

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

  // Start conversation for an existing project (for quick-capture projects)
  app.post("/api/projects/:id/start-conversation", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { conversationMode = "supportive" } = req.body;
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
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
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messagesList = await storage.getMessagesByConversation(id);
      res.json({ ...conversation, messages: messagesList });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Get conversation to check current step
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
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

      // Get project to determine audience type, start mode, and conversation mode
      const project = await storage.getProject(conversation.projectId);
      const audienceType = project?.type;
      const projectStartMode = project?.startMode || "idea";
      const projectConversationMode = project?.conversationMode || "supportive";
      const projectDiscoveryPath = project?.discoveryPath || "idea_first";
      const projectIdeaPurpose = project?.ideaPurpose || "monetize";

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream AI response
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: getPRDSystemPrompt(audienceType, projectStartMode, projectConversationMode, projectDiscoveryPath, projectIdeaPurpose) },
          ...chatHistory,
        ],
        stream: true,
        max_completion_tokens: 1500,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      // Save AI message
      await storage.createMessage({
        conversationId,
        role: "ai",
        content: fullResponse,
      });

      // Update conversation step based on start mode
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

      res.write(`data: ${JSON.stringify({ done: true, step: newStep, section: currentPhase.section, progress: currentPhase.progress })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  // Generate PRD from project with tiered depth options
  app.post("/api/projects/:id/generate-prd", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get track and user requirements from request with validation
      const validTracks = ["quick", "standard", "production"];
      const requestedTrack = req.body?.track;
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

      let prdPrompt = "";
      let maxTokens = 4000;
      
      if (track === "quick") {
        // Quick PRD - 20-30 min, good for Claude Opus prototypes
        maxTokens = 3000;
        prdPrompt = `Create a QUICK PRD for rapid prototyping. This will be used by Claude Opus or similar AI to build a working prototype.

${projectContext}

Generate a concise PRD with these sections:

# [Product Name] - Quick PRD

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

Keep the entire document under 1500 words. Be specific enough that an AI can start building immediately.`;

      } else if (track === "standard") {
        // Standard PRD - 1-2 hours, good for mid-tier AI
        maxTokens = 6000;
        prdPrompt = `Create a STANDARD PRD with enough detail for mid-tier AI models to implement well.

${projectContext}

Generate a detailed PRD with these sections:

# [Product Name] - Product Requirements Document

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

Be specific with technology choices and include enough detail that an AI can implement each feature.`;

      } else {
        // Production PRD - 3-4 hours, comprehensive for cheap/free AI
        maxTokens = 10000;
        prdPrompt = `Create a PRODUCTION-READY PRD with maximum detail. This PRD will be used by free/cheap AI models (like Claude Haiku) to implement a complete application. Include code examples, file structures, and step-by-step guidance.

${projectContext}

Generate an exhaustive PRD with these sections:

# [Product Name] - Production PRD

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

### Phase 1: Project Setup (Day 1)
1. Initialize project with [command]
2. Install dependencies: [list]
3. Set up database schema
4. Configure environment variables:
   - DATABASE_URL
   - [other env vars]

### Phase 2: Core Backend (Day 1-2)
1. Implement [feature] API endpoint
   - Create route handler
   - Add storage method
   - Test with curl/Postman
2. [Next feature]

### Phase 3: Core Frontend (Day 2-3)
1. Create [component]
2. Build [page]
3. Connect to API

### Phase 4: Polish & Testing (Day 4)
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

This PRD should be detailed enough that even a basic AI model can follow the step-by-step implementation guide and build a working application. Include actual code patterns and specific technology recommendations.`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prdPrompt }],
        max_completion_tokens: maxTokens,
      });

      const prdContent = response.choices[0]?.message?.content || "# PRD Generation Failed";

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

  // Generate landing page for idea validation
  app.post("/api/projects/:id/generate-landing-page", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get conversation to provide context
      const conversation = await storage.getConversationByProjectId(projectId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getMessagesByConversation(conversation.id);
      const conversationContext = messages
        .map((m: { role: string; content: string }) => `${m.role === "user" ? "Founder" : "AI"}: ${m.content}`)
        .join("\n\n");

      // Generate landing page content
      const landingPagePrompt = `Based on this conversation about a product idea, create a "Coming Soon" landing page in a single self-contained HTML file.

${conversationContext}

Create an HTML file with:
1. Modern, attractive design with CSS included (dark theme, gradient accents)
2. Compelling headline and tagline
3. Value proposition bullets (3-4 points)
4. Email capture form (just the form, no backend needed)
5. Social proof placeholder section
6. Call-to-action button

Requirements:
- Single file with embedded CSS (no external dependencies)
- Mobile responsive
- Professional, modern aesthetic
- Include Font Awesome CDN for icons
- Email form should POST to "#" with a data-testid="email-form"
- Include meta tags for SEO and social sharing

Return ONLY the complete HTML code, no explanation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: landingPagePrompt }],
        max_completion_tokens: 8000,
      });

      const htmlContent = response.choices[0]?.message?.content || "<!DOCTYPE html><html><body>Failed to generate</body></html>";
      
      // Clean up the response - remove markdown code blocks if present
      const cleanHtml = htmlContent
        .replace(/^```html?\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();

      res.json({ html: cleanHtml });
    } catch (error) {
      console.error("Error generating landing page:", error);
      res.status(500).json({ error: "Failed to generate landing page" });
    }
  });

  // Find communities for idea validation
  app.post("/api/projects/:id/find-communities", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const communityPrompt = `Based on this product idea, suggest communities where the founder can validate interest and find early adopters.

Product Idea: ${project.rawIdea}
Product Type: ${project.type}

Provide a JSON response with this structure:
{
  "reddit": [
    {"name": "r/subreddit", "subscribers": "estimate", "relevance": "why this is relevant"}
  ],
  "discord": [
    {"name": "Server Name", "description": "what it's about", "invite_hint": "how to find it"}
  ],
  "twitter": [
    {"hashtag": "#hashtag", "usage": "how active", "tip": "how to use it"}
  ],
  "other": [
    {"platform": "Platform Name", "community": "Community Name", "description": "why relevant"}
  ],
  "timing_tips": ["Best time/way to post", "How to introduce yourself"]
}

Include 3-5 suggestions per category. Focus on active communities that would be receptive to new product announcements.
Return ONLY valid JSON, no explanation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: communityPrompt }],
        max_completion_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      
      // Parse and validate JSON
      try {
        const communities = JSON.parse(content.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim());
        res.json(communities);
      } catch {
        res.json({ 
          reddit: [], 
          discord: [], 
          twitter: [], 
          other: [],
          timing_tips: ["Share your idea and ask for feedback", "Be genuine and engage with responses"]
        });
      }
    } catch (error) {
      console.error("Error finding communities:", error);
      res.status(500).json({ error: "Failed to find communities" });
    }
  });

  // Reality Check - estimate time/effort for an idea
  app.post("/api/projects/:id/reality-check", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get conversation for context
      const conversation = await storage.getConversationByProjectId(projectId);
      let conversationContext = "";
      if (conversation) {
        const messages = await storage.getMessagesByConversation(conversation.id);
        conversationContext = messages
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "Founder" : "AI"}: ${m.content}`)
          .join("\n\n");
      }

      const realityCheckPrompt = `You are a brutally honest startup advisor. Based on this idea and conversation, provide a "Reality Check" to help the founder understand the true commitment required.

Product Idea: ${project.rawIdea}
Product Type: ${project.type}

${conversationContext ? `Conversation:\n${conversationContext}\n` : ""}

Provide a JSON response with this structure:
{
  "time_to_mvp": {
    "estimate": "X weeks/months",
    "hours_per_week": "X-Y hours",
    "total_hours": "X-Y hours total",
    "reality": "honest assessment of the time commitment"
  },
  "skills_required": [
    {"skill": "Skill Name", "level": "beginner/intermediate/advanced", "learning_time": "X hours/days to learn if needed"}
  ],
  "complexity_score": {
    "score": 1-10,
    "label": "Simple Side Project / Moderate Challenge / Serious Undertaking / Major Commitment / Life-Consuming Venture",
    "breakdown": "what makes it this complex"
  },
  "hidden_work": [
    "Thing people forget about #1",
    "Thing people forget about #2"
  ],
  "financial_reality": {
    "minimum_budget": "$X-Y",
    "what_it_covers": "hosting, tools, etc.",
    "hidden_costs": ["cost 1", "cost 2"]
  },
  "opportunity_cost": {
    "what_else_could_you_do": "honest assessment",
    "is_now_the_right_time": true/false,
    "reasoning": "why or why not"
  },
  "red_flags": [
    "potential issue #1",
    "potential issue #2"
  ],
  "green_flags": [
    "positive indicator #1",
    "positive indicator #2"
  ],
  "bottom_line": "1-2 sentence honest verdict on whether to proceed"
}

Be honest and direct. Don't sugarcoat. Founders with this feature enabled WANT tough love.
Return ONLY valid JSON, no explanation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: realityCheckPrompt }],
        max_completion_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      
      try {
        const realityCheck = JSON.parse(content.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim());
        res.json(realityCheck);
      } catch {
        res.json({ 
          complexity_score: { score: 5, label: "Unknown", breakdown: "Could not analyze" },
          bottom_line: "Unable to provide assessment. Please try again."
        });
      }
    } catch (error) {
      console.error("Error generating reality check:", error);
      res.status(500).json({ error: "Failed to generate reality check" });
    }
  });

  return httpServer;
}
