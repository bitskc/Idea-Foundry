import { isDevMode } from "../supabase";
import { mockStorage } from "../storage-mock";
import type { IStorage } from "../storage";
import { validateApiToken } from "./auth";

// Conditionally load storage
let storage: IStorage;
if (isDevMode) {
  storage = mockStorage;
} else {
  const { storage: supabaseStorage } = await import("../storage-supabase");
  storage = supabaseStorage;
}

/**
 * Define MCP tools available for the Idea Foundry API
 * These describe what AI agents can do via the /api/mcp endpoint
 */
export const MCP_TOOLS = [
  {
    name: "idea_foundry_list_ideas",
    description: "List all ideas for the authenticated user",
    parameters: {},
  },
  {
    name: "idea_foundry_get_idea",
    description: "Get a specific idea with full context including PRD, notes, and viability data",
    parameters: {
      ideaId: {
        type: "number",
        description: "The ID of the idea to retrieve",
      },
    },
  },
  {
    name: "idea_foundry_get_prd",
    description: "Get the PRD (Product Requirements Document) for an idea",
    parameters: {
      ideaId: {
        type: "number",
        description: "The ID of the idea",
      },
    },
  },
  {
    name: "idea_foundry_update_idea_notes",
    description: "Update an idea's notes with agent insights or observations",
    parameters: {
      ideaId: {
        type: "number",
        description: "The ID of the idea",
      },
      notes: {
        type: "string",
        description: "The notes or insights to add",
      },
    },
  },
  {
    name: "idea_foundry_export_idea",
    description: "Export an idea as structured JSON with full context, PRD, viability data, and tech stack",
    parameters: {
      ideaId: {
        type: "number",
        description: "The ID of the idea to export",
      },
      format: {
        type: "string",
        description: "Export format: 'full' (default), 'prd', or 'user-stories'",
      },
    },
  },
];

/**
 * Execute MCP tool commands
 */
export async function executeMcpTool(
  toolName: string,
  params: Record<string, any>,
  userId: string
): Promise<any> {
  try {
    switch (toolName) {
      case "idea_foundry_list_ideas": {
        const ideas = await storage.getProjectsByUserId(userId);
        return {
          ideas: ideas.map(i => ({
            id: i.id,
            title: i.title,
            type: i.type,
            status: i.status,
            ideaStatus: i.ideaStatus,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
          })),
        };
      }

      case "idea_foundry_get_idea": {
        const rawIdeaId = params.ideaId;
        if (rawIdeaId === undefined || rawIdeaId === null) return { error: "ideaId parameter required" };
        const ideaId = typeof rawIdeaId === 'string' ? parseInt(rawIdeaId, 10) : rawIdeaId;
        if (isNaN(ideaId)) return { error: "ideaId must be a valid number" };
        
        const idea = await storage.getProject(ideaId);
        if (!idea) return { error: "Idea not found" };
        if (idea.userId !== userId) return { error: "Access denied" };

        return {
          idea: {
            id: idea.id,
            title: idea.title,
            description: idea.description,
            type: idea.type,
            status: idea.status,
            ideaStatus: idea.ideaStatus,
            rawIdea: idea.rawIdea,
            prdContent: idea.prdContent,
            notes: idea.notes,
            githubRepoUrl: idea.githubRepoUrl,
            viabilityScore: idea.viabilityScore,
            viabilityBreakdown: idea.viabilityBreakdown,
            competitors: idea.competitors,
            keyInsights: idea.keyInsights,
            targetAvatar: idea.targetAvatar,
            techStack: idea.techStack,
            techStackRecommendation: idea.techStackRecommendation,
            createdAt: idea.createdAt,
            updatedAt: idea.updatedAt,
          },
        };
      }

      case "idea_foundry_get_prd": {
        const rawIdeaId = params.ideaId;
        if (rawIdeaId === undefined || rawIdeaId === null) return { error: "ideaId parameter required" };
        const ideaId = typeof rawIdeaId === 'string' ? parseInt(rawIdeaId, 10) : rawIdeaId;
        if (isNaN(ideaId)) return { error: "ideaId must be a valid number" };

        const idea = await storage.getProject(ideaId);
        if (!idea) return { error: "Idea not found" };
        if (idea.userId !== userId) return { error: "Access denied" };

        if (!idea.prdContent) {
          return { error: "No PRD generated yet for this idea" };
        }

        return {
          ideaId: idea.id,
          title: idea.title,
          prd: idea.prdContent,
        };
      }

      case "idea_foundry_update_idea_notes": {
        const rawIdeaId = params.ideaId;
        const newNotes = params.notes;
        if (rawIdeaId === undefined || rawIdeaId === null || !newNotes) {
          return { error: "ideaId and notes parameters required" };
        }
        const ideaId = typeof rawIdeaId === 'string' ? parseInt(rawIdeaId, 10) : rawIdeaId;
        if (isNaN(ideaId)) return { error: "ideaId must be a valid number" };

        const idea = await storage.getProject(ideaId);
        if (!idea) return { error: "Idea not found" };
        if (idea.userId !== userId) return { error: "Access denied" };

        const updatedNotes = idea.notes
          ? `${idea.notes}\n\n[Agent Update]: ${newNotes}`
          : `[Agent Update]: ${newNotes}`;

        await storage.updateProject(ideaId, { notes: updatedNotes });

        return {
          success: true,
          ideaId,
          updatedNotes,
        };
      }

      case "idea_foundry_export_idea": {
        const rawIdeaId = params.ideaId;
        if (rawIdeaId === undefined || rawIdeaId === null) {
          return { error: "ideaId parameter required" };
        }
        const ideaId = typeof rawIdeaId === 'string' ? parseInt(rawIdeaId, 10) : rawIdeaId;
        if (isNaN(ideaId)) return { error: "ideaId must be a valid number" };

        const idea = await storage.getProject(ideaId);
        if (!idea) return { error: "Idea not found" };
        if (idea.userId !== userId) return { error: "Access denied" };

        const format = params.format || "full";

        if (format === "prd") {
          if (!idea.prdContent) {
            return { error: "No PRD generated for this idea" };
          }
          return {
            meta: { exportedAt: new Date().toISOString(), version: "1.0", ideaId, format: "prd" },
            prd: idea.prdContent,
          };
        }

        if (format === "user-stories") {
          if (!idea.prdContent) {
            return { error: "No PRD generated for this idea" };
          }
          // Parse user stories from PRD markdown
          const userStoryPattern = /###\s*(US-\d+):\s*([\s\S]+?)(?=\n###|\n##|$)/g;
          const userStories: Array<{ id: string; title: string; description: string; acceptanceCriteria: string[] }> = [];
          
          let match;
          while ((match = userStoryPattern.exec(idea.prdContent)) !== null) {
            const storyId = match[1];
            const content = match[2].trim();
            const titleMatch = content.match(/^([^\n]+)/);
            const title = titleMatch ? titleMatch[1].trim() : storyId;
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
          return {
            meta: { exportedAt: new Date().toISOString(), version: "1.0", ideaId, format: "user-stories" },
            userStories,
          };
        }

        // Full export
        return {
          meta: { exportedAt: new Date().toISOString(), version: "1.0", ideaId, format: "full" },
          idea: {
            id: idea.id,
            title: idea.title,
            description: idea.description,
            type: idea.type,
            status: idea.status,
            ideaStatus: idea.ideaStatus,
            rawIdea: idea.rawIdea,
            githubRepoUrl: idea.githubRepoUrl,
            notes: idea.notes,
            createdAt: idea.createdAt,
            updatedAt: idea.updatedAt,
          },
          prd: idea.prdContent || null,
          viability: idea.viabilityScore ? {
            score: idea.viabilityScore,
            breakdown: idea.viabilityBreakdown,
            competitors: idea.competitors,
            insights: idea.keyInsights,
          } : null,
          techStack: idea.techStack || null,
          targetAvatar: idea.targetAvatar || null,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing MCP tool ${toolName}:`, error);
    return { error: String(error) };
  }
}
