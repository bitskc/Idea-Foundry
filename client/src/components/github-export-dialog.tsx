import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Github, Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

interface ExportResult {
  created: Array<{ id: string; issueNumber: number; issueUrl: string }>;
  failed: Array<{ id: string; error: string }>;
}

interface GitHubExportDialogProps {
  projectId: number;
  projectTitle: string;
  githubRepoUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GitHubExportDialog({
  projectId,
  projectTitle,
  githubRepoUrl,
  open,
  onOpenChange,
}: GitHubExportDialogProps) {
  const [step, setStep] = useState<"config" | "select" | "exporting" | "complete">("config");
  const [pat, setPat] = useState("");
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);

  const parseRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\/$/, "").replace(/\.git$/, "") };
    }
    return null;
  };

  const repoInfo = githubRepoUrl ? parseRepoInfo(githubRepoUrl) : null;

  const handleFetchStories = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ userStories: UserStory[] }>(
        `/api/projects/${projectId}/export?format=user-stories`
      );
      setUserStories(data.userStories);
      setSelectedStories(new Set(data.userStories.map(s => s.id)));
      setStep("select");
    } catch (error) {
      toast.error("Failed to parse user stories from PRD");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!pat.trim() || !repoInfo) return;

    const storiesToExport = userStories.filter(s => selectedStories.has(s.id));
    if (storiesToExport.length === 0) {
      toast.error("Select at least one user story to export");
      return;
    }

    setStep("exporting");
    try {
      const data = await api.post<ExportResult>(`/api/projects/${projectId}/export-github`, {
        pat: pat.trim(),
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        userStories: storiesToExport,
      });
      setResult(data);
      setStep("complete");

      if (data.created.length > 0) {
        toast.success(`Created ${data.created.length} GitHub issues`);
      }
    } catch (error: any) {
      toast.error(error.data?.error || "Failed to create GitHub issues");
      setStep("select");
    }
  };

  const toggleStory = (id: string) => {
    const newSelected = new Set(selectedStories);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStories(newSelected);
  };

  const toggleAll = () => {
    if (selectedStories.size === userStories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(userStories.map(s => s.id)));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("config");
      setPat("");
      setUserStories([]);
      setSelectedStories(new Set());
      setResult(null);
    }, 200);
  };

  if (!githubRepoUrl || !repoInfo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link GitHub Repository First</DialogTitle>
            <DialogDescription>
              You need to link a GitHub repository to this idea before you can export user stories as issues.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <Github className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Go to the "Make" tab on your idea page and link a GitHub repository.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Export to GitHub Issues
          </DialogTitle>
          <DialogDescription>
            Create GitHub issues from your PRD user stories in{" "}
            <span className="font-medium">{repoInfo.owner}/{repoInfo.repo}</span>
          </DialogDescription>
        </DialogHeader>

        {step === "config" && (
          <>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="pat">GitHub Personal Access Token</Label>
                <Input
                  id="pat"
                  type="password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="mt-2 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Needs <code>repo</code> scope.{" "}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Idea%20Foundry%20Export"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Create token <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Your token is sent directly to GitHub and is not stored.</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleFetchStories} disabled={!pat.trim() || isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "select" && (
          <>
            <div className="py-4">
              <div className="flex items-center justify-between mb-3">
                <Label>Select user stories to export ({selectedStories.size}/{userStories.length})</Label>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedStories.size === userStories.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {userStories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No user stories found in PRD. Make sure your PRD has sections like "### US-001: Title"
                  </p>
                ) : (
                  userStories.map((story) => (
                    <div
                      key={story.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleStory(story.id)}
                    >
                      <Checkbox
                        checked={selectedStories.has(story.id)}
                        onCheckedChange={() => toggleStory(story.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{story.id}: {story.title}</div>
                        {story.acceptanceCriteria.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {story.acceptanceCriteria.length} acceptance criteria
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("config")}>Back</Button>
              <Button onClick={handleExport} disabled={selectedStories.size === 0}>
                Export {selectedStories.size} Issues
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "exporting" && (
          <div className="py-8 text-center">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Creating GitHub issues...</p>
          </div>
        )}

        {step === "complete" && result && (
          <>
            <div className="py-4 space-y-4">
              {result.created.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Created {result.created.length} issues</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.created.map((item) => (
                      <a
                        key={item.id}
                        href={item.issueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted"
                      >
                        <span className="text-muted-foreground">#{item.issueNumber}</span>
                        <span>{item.id}</span>
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {result.failed.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Failed to create {result.failed.length} issues</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {result.failed.map((item) => (
                      <div key={item.id}>{item.id}: {item.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
