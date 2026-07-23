import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Trash2, UserPlus, Mail, Loader2, Eye, MessageSquare, Pencil, Globe, Link as LinkIcon, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareInfo {
  share: {
    id: number;
    visibility: string;
    shareToken: string;
    permissions: string;
    createdAt: string;
  } | null;
  collaborators: Array<{
    id: number;
    userId: string;
    role: string;
    status: string;
    invitedAt: string;
    acceptedAt: string | null;
  }>;
}

export function ShareDialog({ projectId, open, onOpenChange }: ShareDialogProps) {
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [permissions, setPermissions] = useState<"view" | "comment" | "edit">("view");
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "commenter" | "editor">("viewer");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && projectId) {
      loadShareInfo();
    }
  }, [open, projectId]);

  const loadShareInfo = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<ShareInfo>(`/api/projects/${projectId}/share`);
      setShareInfo(data);
      setIsPublic(data.share?.visibility === "public" || data.share?.visibility === "link-only");
      setPermissions((data.share?.permissions as any) || "view");
    } catch (error) {
      console.error("Error loading share info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const shareUrl = shareInfo?.share
    ? `${window.location.origin}/share/${shareInfo.share.shareToken}`
    : "";

  const toggleSharing = async () => {
    setIsSaving(true);
    try {
      const newVisibility = isPublic ? "private" : "link-only";
      await api.post(`/api/projects/${projectId}/share`, {
        visibility: newVisibility,
        permissions,
      });
      setIsPublic(!isPublic);
      toast({
        title: isPublic ? "Sharing disabled" : "Share link created",
        description: isPublic ? "The share link is no longer accessible." : "Anyone with the link can view this idea.",
      });
      loadShareInfo();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update sharing",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePermissions = async (newPerms: "view" | "comment" | "edit") => {
    setIsSaving(true);
    try {
      await api.post(`/api/projects/${projectId}/share`, {
        visibility: isPublic ? "link-only" : "private",
        permissions: newPerms,
      });
      setPermissions(newPerms);
      toast({ title: "Permissions updated" });
      loadShareInfo();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update permissions",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const makePublic = async () => {
    setIsSaving(true);
    try {
      await api.post(`/api/projects/${projectId}/share`, {
        visibility: "public",
        permissions,
      });
      setIsPublic(true);
      toast({ title: "Idea is now public", description: "Anyone can find and view this idea." });
      loadShareInfo();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to make idea public" });
    } finally {
      setIsSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revokeShare = async () => {
    setIsSaving(true);
    try {
      await api.delete(`/api/projects/${projectId}/share`);
      setIsPublic(false);
      setShareInfo(null);
      toast({ title: "Share link revoked" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to revoke share link" });
    } finally {
      setIsSaving(false);
    }
  };

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await api.post(`/api/projects/${projectId}/collaborators`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast({ title: "Invitation sent", description: `Invited ${inviteEmail} to collaborate.` });
      setInviteEmail("");
      loadShareInfo();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invitation failed",
        description: error instanceof Error ? error.message : "Failed to invite collaborator",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const removeCollaborator = async (collabId: number) => {
    try {
      await api.delete(`/api/projects/${projectId}/collaborators/${collabId}`);
      toast({ title: "Collaborator removed" });
      loadShareInfo();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove collaborator" });
    }
  };

  const permissionOptions: Array<{ value: "view" | "comment" | "edit"; label: string; icon: typeof Eye }> = [
    { value: "view", label: "View only", icon: Eye },
    { value: "comment", label: "Can comment", icon: MessageSquare },
    { value: "edit", label: "Can edit", icon: Pencil },
  ];

  const roleOptions: Array<{ value: "viewer" | "commenter" | "editor"; label: string }> = [
    { value: "viewer", label: "Viewer" },
    { value: "commenter", label: "Commenter" },
    { value: "editor", label: "Editor" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Share Idea
          </DialogTitle>
          <DialogDescription>
            Share your idea publicly or invite collaborators to work together.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Share Link Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Share link</Label>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={toggleSharing}
                  disabled={isSaving}
                  data-testid="share-toggle"
                />
              </div>

              {isPublic && shareInfo?.share && (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={shareUrl}
                      className="text-xs"
                      data-testid="share-url"
                    />
                    <Button size="icon" variant="outline" onClick={copyLink} data-testid="copy-share-link">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Visibility toggle: link-only vs public */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={shareInfo.share.visibility === "link-only" ? "default" : "outline"}
                      onClick={() => updatePermissions(permissions)}
                      disabled={isSaving}
                      className="gap-1.5"
                    >
                      <LinkIcon className="w-3 h-3" />
                      Link only
                    </Button>
                    <Button
                      size="sm"
                      variant={shareInfo.share.visibility === "public" ? "default" : "outline"}
                      onClick={makePublic}
                      disabled={isSaving}
                      className="gap-1.5"
                    >
                      <Globe className="w-3 h-3" />
                      Public
                    </Button>
                  </div>

                  {/* Permissions */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Permissions for viewers</Label>
                    <div className="flex gap-2">
                      {permissionOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <Button
                            key={opt.value}
                            size="sm"
                            variant={permissions === opt.value ? "default" : "outline"}
                            onClick={() => updatePermissions(opt.value)}
                            disabled={isSaving}
                            className="gap-1.5"
                          >
                            <Icon className="w-3 h-3" />
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={revokeShare}
                    disabled={isSaving}
                    className="text-destructive gap-1.5 p-0 h-7"
                    data-testid="revoke-share"
                  >
                    <Trash2 className="w-3 h-3" />
                    Revoke share link
                  </Button>
                </>
              )}

              {!isPublic && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  This idea is private. Toggle sharing to generate a link.
                </p>
              )}
            </div>

            {/* Collaborator Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Invite collaborators</Label>
              </div>

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-sm"
                  data-testid="invite-email"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="text-sm border rounded-md px-2 h-9 bg-background"
                  data-testid="invite-role"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={inviteCollaborator}
                  disabled={isInviting || !inviteEmail.trim()}
                  data-testid="send-invite"
                >
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                </Button>
              </div>

              {/* Collaborator list */}
              {shareInfo && shareInfo.collaborators.length > 0 && (
                <div className="space-y-2">
                  {shareInfo.collaborators.map((collab) => (
                    <div key={collab.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {collab.userId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-medium capitalize">{collab.role}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {collab.status === "pending" ? "Pending" : collab.status === "accepted" ? "Accepted" : "Declined"}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCollaborator(collab.id)}
                        data-testid={`remove-collab-${collab.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
