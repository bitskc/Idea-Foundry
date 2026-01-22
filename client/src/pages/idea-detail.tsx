import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import FloatingNotes from "@/components/floating-notes";
import { 
  ArrowLeft, 
  Lightbulb, 
  Flame, 
  Clock, 
  Archive,
  MessageSquare,
  Hammer,
  Eye,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Loader2,
  Save,
  FileText,
  Sparkles,
  ExternalLink,
  Building,
  Zap,
  Rocket,
  Crown,
  CheckCircle2
} from "lucide-react";
import type { Project, Conversation as ConversationType, Message } from "@shared/schema";

type IdeaStatus = "exploring" | "active" | "backburner" | "archived";

const STATUS_CONFIG: Record<IdeaStatus, { label: string; icon: React.ComponentType<{className?: string}>; color: string }> = {
  exploring: { label: "Exploring", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  active: { label: "Active", icon: Flame, color: "bg-green-500/10 text-green-600 border-green-200" },
  backburner: { label: "Backburner", icon: Clock, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  archived: { label: "Archived", icon: Archive, color: "bg-gray-500/10 text-gray-600 border-gray-200" },
};

interface Competitor {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  url?: string;
}

interface ViabilityBreakdown {
  marketSize: number;
  competition: number;
  effort: number;
  profitPotential: number;
}

export default function IdeaDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [conversation, setConversation] = useState<ConversationType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isGeneratingResearch, setIsGeneratingResearch] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [prdTrack, setPrdTrack] = useState<"quick" | "standard" | "production">("standard");
  const [userRequirements, setUserRequirements] = useState("");
  const [isGeneratingPrd, setIsGeneratingPrd] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [params.id]);

  const loadProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) throw new Error("Failed to load idea");
      const data = await response.json();
      setProject(data);
      setNotes(data.notes || "");
      if (data.conversation) {
        setConversation(data.conversation);
        const messagesRes = await fetch(`/api/conversations/${data.conversation.id}/messages`);
        if (messagesRes.ok) {
          setMessages(await messagesRes.json());
        }
      }
    } catch (error) {
      console.error("Error loading idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load idea details",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!project) return;
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error("Failed to save notes");
      toast({ title: "Notes saved" });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notes",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const generateResearch = async () => {
    if (!project) return;
    setIsGeneratingResearch(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/research`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate research");
      const data = await response.json();
      setProject(prev => prev ? { ...prev, ...data } : null);
      toast({ title: "Research generated!", description: "Competitor analysis and viability score updated." });
    } catch (error) {
      console.error("Error generating research:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate research",
      });
    } finally {
      setIsGeneratingResearch(false);
    }
  };

  const startConversation = async () => {
    if (!project) return;
    setIsStartingConversation(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/start-conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationMode: "supportive" }),
      });
      if (!response.ok) throw new Error("Failed to start conversation");
      const data = await response.json();
      setLocation(`/conversation/${data.id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start conversation",
      });
    } finally {
      setIsStartingConversation(false);
    }
  };

  const generatePrd = async () => {
    if (!project) return;
    setIsGeneratingPrd(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/generate-prd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          track: prdTrack,
          userRequirements: userRequirements.trim() || undefined
        }),
      });
      if (!response.ok) throw new Error("Failed to generate PRD");
      const data = await response.json();
      setProject(prev => prev ? { ...prev, prdContent: data.prdContent } : null);
      toast({ 
        title: "PRD Generated!", 
        description: `Your ${prdTrack === "quick" ? "Quick" : prdTrack === "standard" ? "Standard" : "Production"} PRD is ready.` 
      });
    } catch (error) {
      console.error("Error generating PRD:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PRD",
      });
    } finally {
      setIsGeneratingPrd(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto p-6 text-center">
          <p className="text-muted-foreground">Idea not found</p>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const statusConfig = STATUS_CONFIG[(project.ideaStatus as IdeaStatus) || "exploring"];
  const StatusIcon = statusConfig.icon;
  const viability = project.viabilityBreakdown as ViabilityBreakdown | null;
  const competitors = project.competitors as Competitor[] | null;
  const insights = project.keyInsights as string[] | null;

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/dashboard")}
            className="mb-4 -ml-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Ideas
          </Button>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{project.type}</Badge>
                <Badge variant="outline" className={`${statusConfig.color} gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">{project.title}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            
            {project.viabilityScore && (
              <div className="text-center shrink-0">
                <div className={`text-4xl font-bold ${
                  project.viabilityScore >= 7 ? 'text-green-600' : 
                  project.viabilityScore >= 4 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {project.viabilityScore}
                </div>
                <div className="text-xs text-muted-foreground">Viability Score</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <Eye className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="think" className="gap-2" data-testid="tab-think">
              <MessageSquare className="w-4 h-4" /> Think
            </TabsTrigger>
            <TabsTrigger value="make" className="gap-2" data-testid="tab-make">
              <Hammer className="w-4 h-4" /> Make
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Viability Score */}
            {!project.viabilityScore && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Sparkles className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Get AI-Powered Research</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Let AI analyze your idea, find competitors, and calculate a viability score in under 60 seconds.
                  </p>
                  <Button 
                    onClick={generateResearch} 
                    disabled={isGeneratingResearch}
                    data-testid="button-generate-research"
                  >
                    {isGeneratingResearch ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Research
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {project.viabilityScore && viability && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Viability Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{viability.marketSize}/10</div>
                      <div className="text-xs text-muted-foreground">Market Size</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <Target className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                      <div className="text-2xl font-bold">{viability.competition}/10</div>
                      <div className="text-xs text-muted-foreground">Competition</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                      <div className="text-2xl font-bold">{viability.effort}/10</div>
                      <div className="text-xs text-muted-foreground">Build Effort</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold">{viability.profitPotential}/10</div>
                      <div className="text-xs text-muted-foreground">Profit Potential</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competitors */}
            {competitors && competitors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    Competitors ({competitors.length})
                  </CardTitle>
                  <CardDescription>Key players in this space</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {competitors.map((competitor, idx) => (
                      <div key={idx} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{competitor.name}</h4>
                          {competitor.url && (
                            <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                              Visit <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{competitor.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-green-600 mb-1">Strengths</p>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {competitor.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-red-600 mb-1">Weaknesses</p>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {competitor.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Insights */}
            {insights && insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Quick Notes
                </CardTitle>
                <CardDescription>Jot down thoughts, questions, or next steps</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] mb-3"
                  data-testid="input-notes"
                />
                <Button 
                  onClick={saveNotes} 
                  disabled={isSavingNotes}
                  size="sm"
                  data-testid="button-save-notes"
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Think Tab */}
          <TabsContent value="think" className="space-y-6">
            {conversation ? (
              <Card>
                <CardHeader>
                  <CardTitle>Conversation History</CardTitle>
                  <CardDescription>Your AI exploration of this idea</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                    {messages.slice(-10).map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => setLocation(`/conversation/${conversation.id}`)}
                    className="w-full"
                    data-testid="button-continue-conversation"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Continue Conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Start Exploring</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Have a conversation with AI to explore, refine, and challenge your idea.
                  </p>
                  <Button 
                    onClick={startConversation}
                    disabled={isStartingConversation}
                    data-testid="button-start-conversation"
                  >
                    {isStartingConversation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Start Conversation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Make Tab */}
          <TabsContent value="make" className="space-y-6">
            {/* PRD Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Product Requirements Document
                </CardTitle>
                <CardDescription>Turn your idea into a dev-ready PRD that AI can implement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {project.prdContent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <p className="font-medium">Your PRD has been generated!</p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setLocation(`/prd/${project.id}`)}
                        data-testid="button-view-prd"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View PRD
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          await fetch(`/api/projects/${project.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ prdContent: null }),
                          });
                          setProject(prev => prev ? { ...prev, prdContent: null } : null);
                        }}
                        data-testid="button-regenerate-prd"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate New PRD
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Track Selection */}
                    <div>
                      <h4 className="font-medium mb-3">Choose your PRD depth</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setPrdTrack("quick")}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            prdTrack === "quick" 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                          data-testid="track-quick"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <span className="font-semibold">Quick</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">20-30 minutes</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>High-level features</li>
                            <li>Basic user stories</li>
                            <li>Tech stack suggestion</li>
                          </ul>
                          <p className="text-xs mt-2 text-primary">Good for: Claude Opus prototypes</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrdTrack("standard")}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            prdTrack === "standard" 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                          data-testid="track-standard"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Rocket className="w-5 h-5 text-blue-500" />
                            <span className="font-semibold">Standard</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">1-2 hours</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>Detailed features + acceptance</li>
                            <li>API endpoint specs</li>
                            <li>Database schema</li>
                            <li>UI component breakdown</li>
                          </ul>
                          <p className="text-xs mt-2 text-primary">Good for: Mid-tier AI models</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrdTrack("production")}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            prdTrack === "production" 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                          data-testid="track-production"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            <span className="font-semibold">Production</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">3-4 hours</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>Everything in Standard +</li>
                            <li>Complete file structure</li>
                            <li>Code patterns & examples</li>
                            <li>Step-by-step guide</li>
                          </ul>
                          <p className="text-xs mt-2 text-primary">Good for: Free/cheap AI models</p>
                        </button>
                      </div>
                    </div>

                    {/* User Requirements */}
                    <div>
                      <h4 className="font-medium mb-2">Your requirements (optional)</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add any preferences for tech stack, design style, constraints, or specific features you want emphasized.
                      </p>
                      <Textarea
                        placeholder="e.g., Use React + Node.js, mobile-first design, integrate with Stripe for payments, keep it simple for MVP..."
                        value={userRequirements}
                        onChange={(e) => setUserRequirements(e.target.value)}
                        className="min-h-[100px]"
                        data-testid="input-user-requirements"
                      />
                    </div>

                    {/* Generate Button */}
                    <Button 
                      onClick={generatePrd}
                      disabled={isGeneratingPrd}
                      className="w-full"
                      size="lg"
                      data-testid="button-generate-prd"
                    >
                      {isGeneratingPrd ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating {prdTrack === "quick" ? "Quick" : prdTrack === "standard" ? "Standard" : "Production"} PRD...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate {prdTrack === "quick" ? "Quick" : prdTrack === "standard" ? "Standard" : "Production"} PRD
                        </>
                      )}
                    </Button>

                    {!conversation && (
                      <p className="text-xs text-muted-foreground text-center">
                        Tip: Start a conversation in the Think tab first to provide more context for a better PRD.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Tools</CardTitle>
                <CardDescription>Test your idea before building</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-landing-page">
                    <ExternalLink className="w-5 h-5" />
                    <span className="font-medium">Landing Page Generator</span>
                    <span className="text-xs text-muted-foreground">Create a quick landing page to test interest</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-communities">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Find Communities</span>
                    <span className="text-xs text-muted-foreground">Discover where your users hang out</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <FloatingNotes 
        projectId={project.id} 
        initialNotes={notes}
        onNotesUpdate={(newNotes) => setNotes(newNotes)}
      />
    </Layout>
  );
}
