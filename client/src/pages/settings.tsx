import { useState } from "react";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Loader2, Key, User as UserIcon, CreditCard, Trash2, Plus, Eye, EyeOff } from "lucide-react";

// BYOK key type returned by the API (key is masked)
interface ApiKeyInfo {
  id: number;
  provider: string;
  maskedKey: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const PROVIDERS = [
  { id: "gemini", label: "Google Gemini", placeholder: "AIza..." },
  { id: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-..." },
  { id: "openai", label: "OpenAI", placeholder: "sk-..." },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // BYOK state
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Fetch user profile
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/me"],
    queryFn: () => api.get("/api/me"),
  });

  // Fetch BYOK keys
  const { data: apiKeys, isLoading: isLoadingKeys, refetch: refetchKeys } = useQuery<ApiKeyInfo[]>({
    queryKey: ["/api/user/keys"],
    queryFn: () => api.get("/api/user/keys"),
  });

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Password too short", description: "Minimum 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.post("/api/auth/change-password", { password: newPassword });
      toast({ title: "Password updated", description: "Your password has been changed." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to change password",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      toast({ variant: "destructive", title: "API key required" });
      return;
    }
    setIsSavingKey(true);
    try {
      await api.post("/api/user/keys", { provider: selectedProvider, apiKey: apiKeyInput.trim() });
      toast({ title: "API key saved", description: `Your ${PROVIDERS.find(p => p.id === selectedProvider)?.label} key has been saved.` });
      setApiKeyInput("");
      refetchKeys();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save key",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    try {
      await api.delete(`/api/user/keys/${id}`);
      toast({ title: "API key removed" });
      refetchKeys();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove key",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleManageBilling = async () => {
    try {
      const data = await api.post<{ url: string }>("/api/create-portal-session", {});
      window.location.href = data.url;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to open billing portal",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  if (isLoadingUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const isPro = user?.subscriptionStatus === "pro";

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="new-password">Change Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab (BYOK) */}
          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>Bring Your Own Key</CardTitle>
                <CardDescription>
                  Use your own AI provider API keys instead of the shared server keys.
                  Keys are encrypted at rest and never exposed after saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new key */}
                <div className="space-y-3">
                  <Label>Add a new API key</Label>
                  <div className="flex gap-2">
                    <select
                      className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <div className="flex-1 relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder={PROVIDERS.find(p => p.id === selectedProvider)?.placeholder || "API key"}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button onClick={handleSaveKey} disabled={isSavingKey || !apiKeyInput.trim()}>
                      {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Existing keys */}
                <div className="space-y-2">
                  <Label>Saved keys</Label>
                  {isLoadingKeys ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  ) : !apiKeys || apiKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No API keys saved yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {PROVIDERS.find(p => p.id === key.provider)?.label || key.provider}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">{key.maskedKey}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(key.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                  <div>
                    <p className="text-sm font-medium">Current plan</p>
                    <p className="text-2xl font-bold capitalize">{user?.subscriptionStatus || "free"}</p>
                  </div>
                  {isPro ? (
                    <Button variant="outline" onClick={handleManageBilling}>
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button onClick={() => window.location.href = "/app/upgrade"}>
                      Upgrade to Pro
                    </Button>
                  )}
                </div>

                {isPro && (
                  <p className="text-sm text-muted-foreground">
                    You can cancel or manage your subscription through the Stripe billing portal.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
