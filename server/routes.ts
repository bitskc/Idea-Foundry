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

// PRD Generation system prompt
function getPRDSystemPrompt(audienceType?: string): string {
  const audienceEmphasis = audienceType && AUDIENCE_PROMPTS[audienceType] 
    ? `\n\nAUDIENCE-SPECIFIC FOCUS:\n${AUDIENCE_PROMPTS[audienceType]}`
    : "";
  
  return `You are an expert product manager helping founders create PRDs through conversation.

IMPORTANT RESPONSE GUIDELINES:
- Keep each response SHORT and FOCUSED (2-4 paragraphs max)
- Ask only ONE question at a time
- Be conversational, not formal
- If you have a lot to say, give a brief summary and offer to elaborate
${audienceEmphasis}

Progress through these topics (one at a time):
1. Problem Statement - What problem? Who has it? How painful is it?
2. Target Audience - Who are the users? How many exist?
3. Solution Overview - How does it work? What's unique?
4. Core Features - What are the MVP features? What's Phase 2?
5. Monetization - How will it make money? What's the pricing?
6. Technical Stack - Web, mobile, or both? Key integrations?
7. Success Metrics - How to measure success? Key KPIs?
8. Go-to-Market - How to acquire first users? Launch strategy?

Build on previous answers. Be encouraging and constructive. Keep it brief!`;
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

  // Create new project from idea
  app.post("/api/projects", async (req, res) => {
    try {
      const { rawIdea, type = "Unknown" } = req.body;
      
      if (!rawIdea || rawIdea.length < 10) {
        return res.status(400).json({ error: "Please provide at least 10 characters describing your idea" });
      }

      // Create project
      const project = await storage.createProject({
        title: rawIdea.substring(0, 50) + (rawIdea.length > 50 ? "..." : ""),
        description: rawIdea,
        type,
        status: "draft",
        progress: 0,
        rawIdea,
        prdContent: null,
      });

      // Create associated conversation
      const conversation = await storage.createConversation({
        projectId: project.id,
        currentSection: "Problem Statement",
        currentStep: 0,
        answers: {},
      });

      // Add initial AI greeting message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "ai",
        content: "Hi there! I'm VibePlan, your AI product strategist. I'm here to help you transform your idea into a comprehensive PRD. Share your idea with me!",
      });

      // Add user's idea as their first message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: rawIdea,
      });

      // Generate AI response to the idea
      try {
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: getPRDSystemPrompt(type) },
            { role: "assistant", content: "Hi there! I'm VibePlan, your AI product strategist. I'm here to help you transform your idea into a comprehensive PRD. Share your idea with me!" },
            { role: "user", content: rawIdea },
          ],
          max_completion_tokens: 1500,
        });

        const aiContent = aiResponse.choices[0]?.message?.content || "That's an interesting idea! Let's dive deeper. What specific problem are you trying to solve with this?";
        
        await storage.createMessage({
          conversationId: conversation.id,
          role: "ai",
          content: aiContent,
        });

        // Update conversation step
        await storage.updateConversation(conversation.id, {
          currentStep: 1,
          currentSection: "Problem Statement",
        });

        // Update project progress
        await storage.updateProject(project.id, {
          progress: 10,
          status: "in_progress",
        });
      } catch (aiError) {
        console.error("Error generating AI response:", aiError);
        // Add fallback message if AI fails
        await storage.createMessage({
          conversationId: conversation.id,
          role: "ai",
          content: "That's an interesting idea! Let's explore it further. What specific problem are you trying to solve with this product?",
        });
      }

      res.status(201).json({ ...project, conversation });
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
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

      // Get project to determine audience type
      const project = await storage.getProject(conversation.projectId);
      const audienceType = project?.type;

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream AI response
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: getPRDSystemPrompt(audienceType) },
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

      // Update conversation step
      const newStep = conversation.currentStep + 1;
      const sections = [
        { step: 0, section: "Problem Statement", progress: 10 },
        { step: 1, section: "Target Audience", progress: 25 },
        { step: 2, section: "Monetization", progress: 40 },
        { step: 3, section: "Technical Specs", progress: 55 },
        { step: 4, section: "Core Features", progress: 70 },
        { step: 5, section: "Success Metrics", progress: 85 },
        { step: 6, section: "Finalizing", progress: 100 },
      ];

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

  // Generate PRD from conversation
  app.post("/api/projects/:id/generate-prd", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const conversation = await storage.getConversationByProjectId(projectId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messagesList = await storage.getMessagesByConversation(conversation.id);
      
      // Build context from conversation
      const conversationContext = messagesList
        .map(m => `${m.role === "user" ? "Founder" : "PM"}: ${m.content}`)
        .join("\n\n");

      // Determine export format (default to full PRD)
      const format = req.body?.format || "full";
      
      let prdPrompt = "";
      
      if (format === "pitch") {
        // One-page pitch deck summary
        prdPrompt = `Based on this conversation with a founder, create a ONE-PAGE PITCH SUMMARY in markdown format.

${conversationContext}

Create a concise pitch summary with:
1. **Problem** (2-3 sentences)
2. **Solution** (2-3 sentences)  
3. **Target Market** (size and who)
4. **Unique Value Proposition** (why you'll win)
5. **Business Model** (how you make money)
6. **Traction/Validation** (any early signals)
7. **Ask** (what you need next)

Keep it under 500 words. Use punchy, investor-friendly language.`;
      } else if (format === "business") {
        // Business plan format
        prdPrompt = `Based on this conversation with a founder, create a BUSINESS PLAN SUMMARY in markdown format.

${conversationContext}

Create a business-focused document with:
1. **Executive Summary** - The opportunity in 3 paragraphs
2. **Market Analysis** - TAM/SAM/SOM, competitive landscape, market timing
3. **Business Model** - Revenue streams, pricing strategy, unit economics
4. **Go-to-Market Strategy** - Customer acquisition, channels, partnerships
5. **Financial Projections** - Key assumptions, revenue potential, timeline to profitability
6. **Team & Resources** - What's needed to execute
7. **Risks & Mitigation** - Market, technical, and execution risks

Focus on business viability and profitability. Suitable for investors and stakeholders.`;
      } else {
        // Full dev-ready PRD
        prdPrompt = `Based on this conversation with a founder, create a comprehensive DEV-READY Product Requirements Document (PRD) in markdown format.

${conversationContext}

Create a professional PRD with these sections:

# [Product Name] - Product Requirements Document

## 1. Executive Summary
- Problem statement (concise)
- Solution overview
- Target market size
- Expected revenue potential

## 2. Problem Statement
- The challenge in detail
- Current alternatives and why they fail
- Impact of the problem

## 3. Target Audience & User Personas
- Primary persona with name, role, pain points
- Secondary persona if applicable
- User journey overview

## 4. Solution Overview
- How the product works
- Key differentiators
- Core value propositions

## 5. Core Features (MVP)
For each feature include:
- Feature name and description
- User story format: "As a [user], I want [action], so that [benefit]"
- Acceptance criteria (checkboxes)

## 6. Technical Architecture
- Recommended tech stack with justification
- High-level system components
- Key integrations needed
- Database considerations

## 7. Monetization Strategy
- Pricing model
- Revenue streams
- Unit economics (if discussed)

## 8. Success Metrics & KPIs
- Primary success metrics
- Secondary metrics
- Targets for MVP launch

## 9. Go-to-Market Strategy
- Launch plan
- Customer acquisition channels
- Partnerships to explore

## 10. Roadmap
- Phase 1 (MVP): Core features
- Phase 2 (3-6 months): Growth features
- Phase 3 (6-12 months): Scale features

## 11. Risks & Mitigation
- Technical risks
- Market risks  
- Execution risks

Format in clean markdown with proper headers, bullet points, and structure. Be specific and actionable.`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prdPrompt }],
        max_completion_tokens: 6000,
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

  return httpServer;
}
