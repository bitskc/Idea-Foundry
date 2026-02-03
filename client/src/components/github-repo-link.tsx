import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ExternalLink, Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface GitHubRepoLinkProps {
  projectId: number;
  initialUrl: string | null;
  onUpdate: (url: string | null) => void;
}

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

export function GitHubRepoLink({ projectId, initialUrl, onUpdate }: GitHubRepoLinkProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(initialUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) return true; // Empty is valid (removes link)
    if (!GITHUB_URL_PATTERN.test(value.trim())) {
      setError("URL must be: https://github.com/owner/repo");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSave = async () => {
    const trimmedUrl = url.trim();
    
    if (!validateUrl(trimmedUrl)) return;

    setIsSaving(true);
    try {
      await api.patch(`/api/projects/${projectId}`, { 
        githubRepoUrl: trimmedUrl || null 
      });
      onUpdate(trimmedUrl || null);
      setIsEditing(false);
      toast.success(trimmedUrl ? "GitHub repo linked" : "GitHub repo removed");
    } catch (err) {
      toast.error("Failed to save GitHub link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUrl(initialUrl || "");
    setError(null);
    setIsEditing(false);
  };

  const parseRepoInfo = (repoUrl: string) => {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\/$/, "") };
    }
    return null;
  };

  const repoInfo = initialUrl ? parseRepoInfo(initialUrl) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="w-5 h-5" />
          GitHub Repository
        </CardTitle>
        <CardDescription>
          Link your code repository for AI agents to access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) validateUrl(e.target.value);
                }}
                placeholder="https://github.com/owner/repo"
                className={error ? "border-destructive" : ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span className="ml-1">Save</span>
              </Button>
              <Button variant="ghost" onClick={handleCancel} size="sm">
                <X className="w-4 h-4" />
                <span className="ml-1">Cancel</span>
              </Button>
            </div>
          </div>
        ) : initialUrl && repoInfo ? (
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <Github className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <a
                  href={initialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  {repoInfo.owner}/{repoInfo.repo}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <Github className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-3">No repository linked</p>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Github className="w-4 h-4 mr-2" />
              Link Repository
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
