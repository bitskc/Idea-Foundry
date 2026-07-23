import type { Express } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import pLimit from "p-limit";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth";
import { getAIServiceForUser, getFallbackService, getProviderName } from "./ai/factory";
import { extractAIError } from "../shared/ai-tasks";
import { db } from "./db";
import {
  projects,
  type Project,
  type CompetitorSnapshot,
  type InsertCompetitorSnapshot,
  type InsertNotification,
} from "../shared/schema";
import type { IStorage } from "./storage";

// ── Types ──────────────────────────────────────────────────────────────────

interface CompetitorInfo {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  url?: string;
}

interface RadarDiff {
  added: string[];
  removed: string[];
  changed: string[];
  summary: string;
}

// Zod schema for structured competitor research output
const RadarSchema = z.object({
  competitors: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      url: z.string().optional(),
    })
  ),
});

const RADAR_SYSTEM_PROMPT =
  "You are a competitive intelligence analyst. Identify real, current competitors for the given product idea and assess their strengths and weaknesses honestly. Focus on direct and adjacent competitors a solo founder should know about.";

// ── Diff computation ───────────────────────────────────────────────────────

function computeDiff(
  newCompetitors: CompetitorInfo[],
  oldCompetitors: CompetitorInfo[]
): RadarDiff {
  const newMap = new Map(newCompetitors.map((c) => [c.name, c]));
  const oldMap = new Map(oldCompetitors.map((c) => [c.name, c]));

  const added = newCompetitors.filter((c) => !oldMap.has(c.name)).map((c) => c.name);
  const removed = oldCompetitors.filter((c) => !newMap.has(c.name)).map((c) => c.name);
  const changed: string[] = [];

  for (const c of newCompetitors) {
    const old = oldMap.get(c.name);
    if (!old) continue;
    if (
      c.description !== old.description ||
      JSON.stringify(c.strengths) !== JSON.stringify(old.strengths) ||
      JSON.stringify(c.weaknesses) !== JSON.stringify(old.weaknesses)
    ) {
      changed.push(c.name);
    }
  }

  const parts: string[] = [];
  if (added.length) parts.push(`${added.length} added`);
  if (removed.length) parts.push(`${removed.length} removed`);
  if (changed.length) parts.push(`${changed.length} changed`);
  const summary = parts.length
    ? `Competitor landscape changed: ${parts.join(", ")}.`
    : "No changes detected since last check.";

  return { added, removed, changed, summary };
}

// ── Core radar check (shared by manual + cron) ─────────────────────────────

async function runRadarCheck(
  storage: IStorage,
  project: Project,
  userId: string
): Promise<{ snapshot: CompetitorSnapshot; diff: RadarDiff }> {
  const ideaContext = `IDEA: ${project.title}\nDESCRIPTION: ${project.description}\nRAW IDEA: ${project.rawIdea}\nTYPE: ${project.type}`;

  const prompt = `Research the current competitive landscape for this product idea.

${ideaContext}

Respond with a JSON object: { "competitors": array of 3-6 competitor objects }.
Each competitor object must have:
- "name": the competitor's product/company name
- "description": one-sentence description of what they do
- "strengths": array of 2-3 strings describing their key strengths
- "weaknesses": array of 2-3 strings describing their key weaknesses
- "url": optional, their website URL

Focus on real, currently-operating competitors. If the idea is novel, include adjacent competitors solving the same problem differently.`;

  const service = await getAIServiceForUser(userId, storage, "competitor-radar");
  const providerName = getProviderName(service);
  let result: z.infer<typeof RadarSchema>;
  try {
    result = await service.generateJSON(prompt, [], {
      schema: RadarSchema,
      systemPrompt: RADAR_SYSTEM_PROMPT,
    });
  } catch (primaryError) {
    console.error(`Radar with ${providerName} failed, trying fallback:`, primaryError);
    const fallback = await getFallbackService(userId, storage, providerName);
    if (!fallback) throw primaryError;
    result = await fallback.generateJSON(prompt, [], {
      schema: RadarSchema,
      systemPrompt: RADAR_SYSTEM_PROMPT,
    });
  }

  const newCompetitors: CompetitorInfo[] = result.competitors;
  const previous = await storage.getLatestCompetitorSnapshot(project.id);
  const oldCompetitors: CompetitorInfo[] = previous
    ? (previous.competitors as CompetitorInfo[])
    : [];
  const diff = computeDiff(newCompetitors, oldCompetitors);

  const insert: InsertCompetitorSnapshot = {
    projectId: project.id,
    competitors: newCompetitors as unknown as InsertCompetitorSnapshot["competitors"],
    diffSummary: diff as unknown as InsertCompetitorSnapshot["diffSummary"],
  };
  const snapshot = await storage.createCompetitorSnapshot(insert);

  // Notify on any real change (skip the very first snapshot — nothing to compare)
  const hasChanges =
    !!previous && (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0);
  if (hasChanges) {
    const notif: InsertNotification = {
      userId,
      projectId: project.id,
      type: "competitor_change",
      title: "Competitor changes detected",
      body: diff.summary,
    };
    await storage.createNotification(notif);
  }

  return { snapshot, diff };
}

// ── Route registration ─────────────────────────────────────────────────────

export function registerRadarRoutes(app: Express, storage: IStorage): void {
  // Toggle radar monitoring on/off for a project
  app.post("/api/projects/:id/radar/toggle", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateProject(id, {
        radarEnabled: !project.radarEnabled,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error toggling radar:", error);
      res.status(500).json({ error: "Failed to toggle radar" });
    }
  });

  // Get competitor snapshots for a project
  app.get("/api/projects/:id/radar/snapshots", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const snapshots = await storage.getCompetitorSnapshots(id);
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching radar snapshots:", error);
      res.status(500).json({ error: "Failed to fetch snapshots" });
    }
  });

  // Manually trigger a radar check
  app.post("/api/projects/:id/radar/check", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const result = await runRadarCheck(storage, project, authReq.user.id);
      res.json(result);
    } catch (error) {
      console.error("Error running radar check:", error);
      const message = extractAIError(error);
      res.status(500).json({ error: message });
    }
  });

  // Get the current user's notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const notifications = await storage.getNotifications(authReq.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark a notification as read
  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ error: "Failed to mark notification read" });
    }
  });

  // Cron endpoint — sweep all radar-enabled projects
  app.get("/api/cron/competitor-radar", async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const radarProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.radarEnabled, true));

      const limit = pLimit(3);
      await Promise.all(
        radarProjects.map((p) =>
          limit(() =>
            runRadarCheck(storage, p, p.userId).catch((e) =>
              console.error(`Radar check failed for project ${p.id}:`, e)
            )
          )
        )
      );

      res.json({ checked: radarProjects.length });
    } catch (error) {
      console.error("Cron competitor-radar error:", error);
      res.status(500).json({ error: "Cron failed" });
    }
  });
}
