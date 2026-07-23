import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ApiToken {
  id: number;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface CreateTokenResponse {
  id: number;
  name: string;
  token: string;
  createdAt: string;
}

export function ApiTokensSection() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTokenDisplayOpen, setIsTokenDisplayOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch tokens
  const { data: tokens, isLoading } = useQuery<ApiToken[]>({
    queryKey: ["/api/tokens"],
    queryFn: () => api.get("/api/tokens"),
  });

  // Create token mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<CreateTokenResponse>("/api/tokens", { name }),
    onSuccess: (data) => {
      setCreatedToken(data.token);
      setIsCreateDialogOpen(false);
      setIsTokenDisplayOpen(true);
      setNewTokenName("");
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
    },
    onError: (error: Error & { data?: { error: string } }) => {
      toast.error(error.data?.error || "Failed to create token");
    },
  });

  // Delete token mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/tokens/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      toast.success("Token revoked");
      setDeletingId(null);
    },
    onError: (error: Error & { data?: { error: string } }) => {
      toast.error(error.data?.error || "Failed to revoke token");
      setDeletingId(null);
    },
  });

  const handleCreate = () => {
    if (!newTokenName.trim()) {
      toast.error("Token name is required");
      return;
    }
    createMutation.mutate(newTokenName.trim());
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      setCopied(true);
      toast.success("Token copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy token");
    }
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatLastUsed = (dateStr: string | null) => {
    if (!dateStr) return "Never used";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateStr);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Tokens
            </CardTitle>
            <CardDescription>
              Connect AI agents to your ideas via MCP
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Create Token
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tokens && tokens.length > 0 ? (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{token.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                    <span>Created {formatDate(token.createdAt)}</span>
                    <span>•</span>
                    <span>{formatLastUsed(token.lastUsedAt)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(token.id)}
                  disabled={deletingId === token.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deletingId === token.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="mb-1">No API tokens yet</p>
            <p className="text-sm">Create a token to connect AI agents</p>
          </div>
        )}
      </CardContent>

      {/* Create Token Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Token</DialogTitle>
            <DialogDescription>
              Give your token a name to identify where it's used (e.g., "Cursor MCP", "Claude Desktop")
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="token-name">Token Name</Label>
            <Input
              id="token-name"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="My AI Agent"
              maxLength={100}
              className="mt-2"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token Display Dialog */}
      <Dialog open={isTokenDisplayOpen} onOpenChange={setIsTokenDisplayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Token Created
            </DialogTitle>
            <DialogDescription>
              Copy this token now — you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
              <code className="flex-1">{createdToken}</code>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-3 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-500">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Store this token securely. It will only be shown once.</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTokenDisplayOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
