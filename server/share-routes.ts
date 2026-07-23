import type { Express } from "express";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth";
import { getStorage } from "./storage";
import type { IStorage } from "./storage";
import crypto from "crypto";

const storage: IStorage = getStorage();

export function registerShareRoutes(app: Express) {
  // ===== Share link management (owner-only) =====

  // Get share settings for a project
  app.get("/api/projects/:id/share", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(String(req.params.id));
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const share = await storage.getProjectShare(projectId);
      const collaborators = await storage.getProjectCollaborators(projectId);
      res.json({ share, collaborators });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch share settings", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create or update share link
  app.post("/api/projects/:id/share", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(String(req.params.id));
      const authReq = req as unknown as AuthenticatedRequest;
      const { visibility, permissions } = req.body;

      if (!visibility || !["public", "private", "link-only"].includes(visibility)) {
        return res.status(400).json({ error: "Invalid visibility" });
      }
      if (permissions && !["view", "comment", "edit"].includes(permissions)) {
        return res.status(400).json({ error: "Invalid permissions" });
      }

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const existing = await storage.getProjectShare(projectId);
      if (existing) {
        const updated = await storage.updateProjectShare(projectId, {
          visibility,
          permissions: permissions || existing.permissions,
        });
        return res.json(updated);
      }

      const shareToken = crypto.randomBytes(24).toString("hex");
      const share = await storage.createProjectShare({
        projectId,
        ownerId: authReq.user.id,
        visibility,
        shareToken,
        permissions: permissions || "view",
      });
      res.json(share);
    } catch (error) {
      res.status(500).json({ error: "Failed to create share link", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Delete share link (revoke access)
  app.delete("/api/projects/:id/share", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(String(req.params.id));
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteProjectShare(projectId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to revoke share link", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // ===== Public share view (no auth required, token-based) =====

  app.get("/api/shared/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const share = await storage.getProjectShareByToken(token);
      if (!share) return res.status(404).json({ error: "Share link not found" });
      if (share.visibility === "private") {
        return res.status(403).json({ error: "This idea is no longer shared publicly" });
      }

      const project = await storage.getProject(share.projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });

      // Return a sanitized public view — no sensitive fields
      res.json({
        id: project.id,
        title: project.title,
        description: project.description,
        type: project.type,
        ideaStatus: project.ideaStatus,
        viabilityScore: project.viabilityScore,
        viabilityBreakdown: project.viabilityBreakdown,
        competitors: project.competitors,
        keyInsights: project.keyInsights,
        ideaClassification: project.ideaClassification,
        developmentDifficulty: project.developmentDifficulty,
        difficultyRoiRatio: project.difficultyRoiRatio,
        pivotSuggestions: project.pivotSuggestions,
        specialistAssessments: project.specialistAssessments,
        prdContent: project.prdContent,
        pitchContent: project.pitchContent,
        logoData: project.logoData,
        techStack: project.techStack,
        targetAvatar: project.targetAvatar,
        progress: project.progress,
        createdAt: project.createdAt,
        permissions: share.permissions,
        ownerEmail: undefined, // Don't expose owner identity
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared project", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // ===== Collaborator management (owner-only) =====

  // Invite a collaborator by email
  app.post("/api/projects/:id/collaborators", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(String(req.params.id));
      const authReq = req as unknown as AuthenticatedRequest;
      const { email, role } = req.body;

      if (!email) return res.status(400).json({ error: "Email is required" });
      if (role && !["viewer", "commenter", "editor"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Look up user by email
      const invitee = await storage.getUserByUsername(email);
      if (!invitee) {
        return res.status(404).json({ error: "User not found. They need to create an account first." });
      }
      if (invitee.id === authReq.user.id) {
        return res.status(400).json({ error: "You can't invite yourself" });
      }

      // Check if already a collaborator
      const existing = await storage.getCollaboratorByUser(projectId, invitee.id);
      if (existing) {
        return res.status(409).json({ error: "User is already a collaborator", collaborator: existing });
      }

      const collaborator = await storage.createProjectCollaborator({
        projectId,
        userId: invitee.id,
        invitedBy: authReq.user.id,
        role: role || "viewer",
        status: "pending",
      });

      // Create notification for invitee
      await storage.createNotification({
        userId: invitee.id,
        projectId,
        type: "collaborator_invite",
        title: "You've been invited to collaborate",
        body: `You've been invited to collaborate on "${project.title}"`,
      });

      res.json(collaborator);
    } catch (error) {
      res.status(500).json({ error: "Failed to invite collaborator", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Remove a collaborator
  app.delete("/api/projects/:id/collaborators/:collabId", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(String(req.params.id));
      const collabId = parseInt(String(req.params.collabId));
      const authReq = req as unknown as AuthenticatedRequest;

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== authReq.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.removeCollaborator(collabId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove collaborator", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // ===== Collaborator actions (invited user) =====

  // Get pending invites for current user
  app.get("/api/collaborations", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      // We need to find all collaborators where userId = current user
      // This requires a method we don't have in the interface yet,
      // so we'll query via the notifications for now
      const notifications = await storage.getNotifications(authReq.user.id);
      const inviteNotifications = notifications.filter(n => n.type === "collaborator_invite");
      res.json(inviteNotifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collaborations", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Accept or decline an invite
  app.patch("/api/collaborators/:collabId", requireAuth, async (req, res) => {
    try {
      const collabId = parseInt(String(req.params.collabId));
      const authReq = req as unknown as AuthenticatedRequest;
      const { status } = req.body;

      if (!status || !["accepted", "declined"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateCollaboratorStatus(collabId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update collaboration status", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get projects shared with current user (accepted collaborations)
  app.get("/api/shared-projects", requireAuth, async (req, res) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      // Get all projects, filter to those where user is an accepted collaborator
      const allProjects = await storage.getProjectsByUserId(authReq.user.id);
      // This returns only owned projects. For shared ones, we need a different approach.
      // For now, return empty — the collaborator would access via notification link.
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared projects", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });
}
