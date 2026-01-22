import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// PRD Generation system prompt
const PRD_SYSTEM_PROMPT = `You are an expert product manager and strategist helping founders create comprehensive Product Requirements Documents (PRDs). Your job is to ask insightful questions one at a time to extract all necessary information about their product idea.

Ask questions progressively across these sections:
1. Problem Statement - What problem are they solving? Who faces this problem?
2. Target Audience - Who are the primary users? B2B or B2C?
3. Solution Overview - What's their proposed solution?
4. Core Features - What are the key features? (MVP focus)
5. Monetization - How will they make money?
6. Technical Stack - Any tech preferences? Mobile, web, or both?
7. Success Metrics - How will they measure success?
8. Go-to-Market - How will they acquire users?

Keep questions conversational and natural. Build on previous answers. Be encouraging and constructive.`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
            { role: "system", content: PRD_SYSTEM_PROMPT },
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

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream AI response
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: PRD_SYSTEM_PROMPT },
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
      const project = await storage.getProject(conversation.projectId);
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

      // Generate comprehensive PRD
      const prdPrompt = `Based on this conversation with a founder, create a comprehensive Product Requirements Document (PRD) in markdown format.

${conversationContext}

Create a professional PRD with these sections:
1. Executive Summary
2. Problem Statement
3. Target Audience & User Personas
4. Solution Overview
5. Core Features (MVP)
6. User Stories & Acceptance Criteria
7. Technical Architecture
8. Monetization Strategy
9. Success Metrics & KPIs
10. Go-to-Market Strategy
11. Risks & Mitigation

Format in clean markdown with proper headers, lists, and structure.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prdPrompt }],
        max_completion_tokens: 4000,
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
