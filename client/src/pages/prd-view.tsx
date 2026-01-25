import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { api } from "@/lib/api";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Download, FileText, Share2, Loader2, ArrowLeft, RefreshCw, Briefcase, Presentation, Code, Globe, Users, ExternalLink, Hash, MessageCircle, Clock, AlertTriangle, CheckCircle, Rabbit, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import type { Project, Conversation } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CommunityData = {
  reddit?: Array<{ name: string; subscribers: string; relevance: string }>;
  discord?: Array<{ name: string; description: string; invite_hint: string }>;
  twitter?: Array<{ hashtag: string; usage: string; tip: string }>;
  other?: Array<{ platform: string; community: string; description: string }>;
  timing_tips?: string[];
};

type RealityCheckData = {
  time_to_mvp?: { estimate: string; hours_per_week: string; total_hours: string; reality: string };
  skills_required?: Array<{ skill: string; level: string; learning_time: string }>;
  complexity_score?: { score: number; label: string; breakdown: string };
  hidden_work?: string[];
  financial_reality?: { minimum_budget: string; what_it_covers: string; hidden_costs: string[] };
  opportunity_cost?: { what_else_could_you_do: string; is_now_the_right_time: boolean; reasoning: string };
  red_flags?: string[];
  green_flags?: string[];
  bottom_line?: string;
};

type ProjectWithConversation = Project & { conversation?: Conversation };
type PRDFormat = "full" | "business" | "pitch";

const FORMAT_OPTIONS = [
  { id: "full" as PRDFormat, label: "Dev-Ready PRD", icon: Code, description: "Technical specs for developers" },
  { id: "business" as PRDFormat, label: "Business Plan", icon: Briefcase, description: "For investors & stakeholders" },
  { id: "pitch" as PRDFormat, label: "Pitch Summary", icon: Presentation, description: "One-page pitch deck" },
];

export default function PrdView() {
  const [matchApp, paramsApp] = useRoute("/app/prd/:id");
  const [matchLegacy, paramsLegacy] = useRoute("/prd/:id");
  const params = paramsApp || paramsLegacy;
  const [, setLocation] = useLocation();
  const [project, setProject] = useState<ProjectWithConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<PRDFormat>("full");
  const [isGeneratingLandingPage, setIsGeneratingLandingPage] = useState(false);
  const [isFindingCommunities, setIsFindingCommunities] = useState(false);
  const [communities, setCommunities] = useState<CommunityData | null>(null);
  const [isCheckingReality, setIsCheckingReality] = useState(false);
  const [realityCheck, setRealityCheck] = useState<RealityCheckData | null>(null);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [isPrdExpanded, setIsPrdExpanded] = useState(false);
  const { toast } = useToast();

  const projectId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      const data = await api.get<Project>(`/api/projects/${projectId}`);
      setProject(data);

      // If no PRD content yet, generate it
      if (!data.prdContent) {
        await generatePRD();
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load project",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePRD = async (format: PRDFormat = "full") => {
    if (!projectId) return;
    
    setIsGenerating(true);
    setCurrentFormat(format);
    try {
      const data = await api.post<{ prdContent: string }>(`/api/projects/${projectId}/generate-prd`, { format });
      setProject(prev => prev ? { ...prev, prdContent: data.prdContent } : null);

      const formatLabel = FORMAT_OPTIONS.find(f => f.id === format)?.label || "PRD";
      toast({
        title: `${formatLabel} Generated`,
        description: "Your document has been created successfully!",
      });
    } catch (error) {
      console.error("Error generating PRD:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PRD",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMarkdown = () => {
    if (!project?.prdContent) return;
    
    const blob = new Blob([project.prdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, "_")}_PRD.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "PRD exported as Markdown",
    });
  };

  const downloadJSON = () => {
    if (!project) return;
    
    const exportData = {
      title: project.title,
      description: project.description,
      type: project.type,
      rawIdea: project.rawIdea,
      prdContent: project.prdContent,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, "_")}_PRD.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "PRD exported as JSON",
    });
  };

  const copyToClipboard = async () => {
    if (!project?.prdContent) return;
    
    try {
      await navigator.clipboard.writeText(project.prdContent);
      toast({
        title: "Copied",
        description: "PRD copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const generateLandingPage = async () => {
    if (!projectId) return;

    setIsGeneratingLandingPage(true);
    try {
      const data = await api.post<{ html: string }>(`/api/projects/${projectId}/generate-landing-page`);

      // Download the HTML file
      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.title.replace(/[^a-z0-9]/gi, "_")}_landing_page.html`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Landing Page Generated",
        description: "Download started! Open the HTML file to preview.",
      });
    } catch (error) {
      console.error("Error generating landing page:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate landing page",
      });
    } finally {
      setIsGeneratingLandingPage(false);
    }
  };

  const findCommunities = async () => {
    if (!projectId) return;
    
    setIsFindingCommunities(true);
    try {
      const data = await api.post<CommunityData>(`/api/projects/${projectId}/find-communities`);
      setCommunities(data);
      
      toast({
        title: "Communities Found",
        description: "Scroll down to see where to share your idea!",
      });
    } catch (error) {
      console.error("Error finding communities:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to find communities",
      });
    } finally {
      setIsFindingCommunities(false);
    }
  };

  const checkReality = async () => {
    if (!projectId) return;

    setIsCheckingReality(true);
    try {
      const data = await api.post<RealityCheckData>(`/api/projects/${projectId}/reality-check`);
      setRealityCheck(data);
      
      toast({
        title: "Reality Check Complete",
        description: "Scroll down to see the honest assessment.",
      });
    } catch (error) {
      console.error("Error running reality check:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run reality check",
      });
    } finally {
      setIsCheckingReality(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={() => setLocation("/app")}>Go to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  if (isGenerating) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Generating Your PRD...</h2>
            <p className="text-muted-foreground">AI is crafting a comprehensive document from your conversation.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project.prdContent) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <FileText className="w-16 h-16 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">No PRD Generated Yet</h2>
            <p className="text-muted-foreground mb-4">Complete your conversation to generate a PRD</p>
            <Button onClick={() => setLocation("/app")}>Back to Dashboard</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/app")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">{project.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{project.type}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={copyToClipboard}
              data-testid="button-copy"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copy
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2" data-testid="button-export">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadMarkdown} data-testid="export-markdown">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadJSON} data-testid="export-json">
                  <FileText className="w-4 h-4 mr-2" />
                  Download JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {project.conversation && (
              <Button 
                onClick={() => project.conversation && setLocation(`/app/conversation/${project.conversation.id}`)}
                data-testid="button-continue-chat"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continue Chat
              </Button>
            )}
          </div>
        </div>

        {/* Validation Tools Section - Now First */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold mb-6">Validate Your Idea</h2>
          <p className="text-muted-foreground mb-6">Test market interest before you build. Generate a landing page and find communities to share it.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-6 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Landing Page Generator</h3>
                  <p className="text-xs text-muted-foreground">Create a "Coming Soon" page with email capture</p>
                </div>
              </div>
              <Button 
                onClick={generateLandingPage}
                disabled={isGeneratingLandingPage}
                className="w-full"
                data-testid="button-generate-landing-page"
              >
                {isGeneratingLandingPage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate & Download
                  </>
                )}
              </Button>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Community Finder</h3>
                  <p className="text-xs text-muted-foreground">Find Reddit, Discord, and Twitter communities</p>
                </div>
              </div>
              <Button 
                onClick={findCommunities}
                disabled={isFindingCommunities}
                variant="outline"
                className="w-full"
                data-testid="button-find-communities"
              >
                {isFindingCommunities ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Find Communities
                  </>
                )}
              </Button>
            </div>

            <div className="p-6 rounded-xl border bg-card md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Rabbit className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Rabbit Hole Reality Check</h3>
                  <p className="text-xs text-muted-foreground">Honest assessment of time, skills, and commitment required</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                For founders who know they chase shiny objects. Get a brutally honest assessment of whether this is worth your time right now.
              </p>
              <Button 
                onClick={checkReality}
                disabled={isCheckingReality}
                variant="outline"
                className="w-full border-amber-500/50 hover:bg-amber-500/10"
                data-testid="button-reality-check"
              >
                {isCheckingReality ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Run Reality Check
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Reality Check Results */}
          {realityCheck && (
            <div className="mb-8 p-6 rounded-xl border-2 border-amber-500/30 bg-amber-500/5" data-testid="reality-check-results">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Rabbit className="w-5 h-5 text-amber-500" />
                Reality Check Results
              </h3>

              {/* Bottom Line */}
              {realityCheck.bottom_line && (
                <div className="p-4 rounded-lg bg-card border mb-6" data-testid="text-reality-bottom-line">
                  <p className="text-lg font-medium">{realityCheck.bottom_line}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Complexity Score */}
                {realityCheck.complexity_score && (
                  <div className="p-4 rounded-lg bg-card border" data-testid="card-complexity-score">
                    <h4 className="font-semibold mb-2">Complexity Score</h4>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl font-bold text-amber-500" data-testid="text-complexity-score">{realityCheck.complexity_score.score}/10</div>
                      <div className="text-sm font-medium">{realityCheck.complexity_score.label}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">{realityCheck.complexity_score.breakdown}</p>
                  </div>
                )}

                {/* Time to MVP */}
                {realityCheck.time_to_mvp && (
                  <div className="p-4 rounded-lg bg-card border" data-testid="card-time-commitment">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time Commitment
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">To MVP:</span> {realityCheck.time_to_mvp.estimate}</p>
                      <p><span className="font-medium">Weekly:</span> {realityCheck.time_to_mvp.hours_per_week}</p>
                      <p><span className="font-medium">Total:</span> {realityCheck.time_to_mvp.total_hours}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{realityCheck.time_to_mvp.reality}</p>
                  </div>
                )}

                {/* Financial Reality */}
                {realityCheck.financial_reality && (
                  <div className="p-4 rounded-lg bg-card border" data-testid="card-financial-reality">
                    <h4 className="font-semibold mb-2">Financial Reality</h4>
                    <p className="text-lg font-bold text-primary mb-1">{realityCheck.financial_reality.minimum_budget}</p>
                    <p className="text-sm text-muted-foreground mb-2">{realityCheck.financial_reality.what_it_covers}</p>
                    {realityCheck.financial_reality.hidden_costs?.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium">Hidden costs: </span>
                        {realityCheck.financial_reality.hidden_costs.join(", ")}
                      </div>
                    )}
                  </div>
                )}

                {/* Opportunity Cost */}
                {realityCheck.opportunity_cost && (
                  <div className="p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold mb-2">Opportunity Cost</h4>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mb-2 ${realityCheck.opportunity_cost.is_now_the_right_time ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                      {realityCheck.opportunity_cost.is_now_the_right_time ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {realityCheck.opportunity_cost.is_now_the_right_time ? "Good timing" : "Consider waiting"}
                    </div>
                    <p className="text-sm">{realityCheck.opportunity_cost.what_else_could_you_do}</p>
                    <p className="text-xs text-muted-foreground mt-1">{realityCheck.opportunity_cost.reasoning}</p>
                  </div>
                )}
              </div>

              {/* Skills Required */}
              {realityCheck.skills_required && realityCheck.skills_required.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Skills Required</h4>
                  <div className="grid gap-2">
                    {realityCheck.skills_required.map((skill, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                        <div>
                          <span className="font-medium">{skill.skill}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${skill.level === "beginner" ? "bg-green-500/10 text-green-600" : skill.level === "intermediate" ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-600"}`}>
                            {skill.level}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{skill.learning_time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden Work */}
              {realityCheck.hidden_work && realityCheck.hidden_work.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Things People Forget About</h4>
                  <ul className="space-y-1">
                    {realityCheck.hidden_work.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags & Green Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {realityCheck.red_flags && realityCheck.red_flags.length > 0 && (
                  <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <h4 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Red Flags
                    </h4>
                    <ul className="space-y-1">
                      {realityCheck.red_flags.map((flag, i) => (
                        <li key={i} className="text-sm text-red-600/90">{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {realityCheck.green_flags && realityCheck.green_flags.length > 0 && (
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <h4 className="font-semibold mb-2 text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Green Flags
                    </h4>
                    <ul className="space-y-1">
                      {realityCheck.green_flags.map((flag, i) => (
                        <li key={i} className="text-sm text-green-600/90">{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Communities Results */}
          {communities && (
            <div className="space-y-6">
              {communities.reddit && communities.reddit.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-orange-500" />
                    Reddit Communities
                  </h3>
                  <div className="grid gap-2">
                    {communities.reddit.map((sub, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-card/50">
                        <div className="font-medium text-orange-500">{sub.name}</div>
                        <div className="text-xs text-muted-foreground">{sub.subscribers} subscribers</div>
                        <div className="text-sm mt-1">{sub.relevance}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communities.discord && communities.discord.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-indigo-500" />
                    Discord Servers
                  </h3>
                  <div className="grid gap-2">
                    {communities.discord.map((server, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-card/50">
                        <div className="font-medium text-indigo-500">{server.name}</div>
                        <div className="text-sm">{server.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{server.invite_hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communities.twitter && communities.twitter.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-sky-500" />
                    Twitter/X Hashtags
                  </h3>
                  <div className="grid gap-2">
                    {communities.twitter.map((tag, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-card/50">
                        <div className="font-medium text-sky-500">{tag.hashtag}</div>
                        <div className="text-sm">{tag.usage}</div>
                        <div className="text-xs text-muted-foreground mt-1">{tag.tip}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communities.other && communities.other.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    Other Communities
                  </h3>
                  <div className="grid gap-2">
                    {communities.other.map((community, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-card/50">
                        <div className="font-medium text-green-500">{community.platform}: {community.community}</div>
                        <div className="text-sm">{community.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communities.timing_tips && communities.timing_tips.length > 0 && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h3 className="font-semibold mb-2">Tips for Sharing</h3>
                  <ul className="space-y-1">
                    {communities.timing_tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible PRD Document Section */}
        <div className="mt-8 border rounded-xl overflow-hidden">
          <button
            onClick={() => setIsPrdExpanded(!isPrdExpanded)}
            className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors"
            data-testid="button-toggle-prd"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold">Full Document</h3>
                <p className="text-xs text-muted-foreground">View and export the complete PRD</p>
              </div>
            </div>
            {isPrdExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          {isPrdExpanded && (
            <div className="p-4 border-t">
              {/* Format Selection */}
              <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
                {FORMAT_OPTIONS.map((format) => {
                  const Icon = format.icon;
                  const isActive = currentFormat === format.id;
                  return (
                    <button
                      key={format.id}
                      onClick={() => generatePRD(format.id)}
                      disabled={isGenerating}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                        ${isActive 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border hover:border-primary/50 bg-card"}
                        ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                      data-testid={`format-${format.id}`}
                    >
                      {isGenerating && currentFormat === format.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      <span className="font-medium">{format.label}</span>
                    </button>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generatePRD(currentFormat)}
                  disabled={isGenerating}
                  className="ml-auto"
                  data-testid="button-regenerate"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setViewMode("formatted")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    viewMode === "formatted" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  data-testid="button-view-formatted"
                >
                  Formatted
                </button>
                <button
                  onClick={() => setViewMode("raw")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    viewMode === "raw" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  data-testid="button-view-raw"
                >
                  Raw Markdown
                </button>
              </div>

              {/* PRD Content */}
              {viewMode === "formatted" ? (
                <div className="prose prose-slate dark:prose-invert max-w-none break-words overflow-wrap-anywhere">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => <h1 className="text-4xl font-display font-bold mt-8 mb-4 text-foreground break-words" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-3xl font-display font-bold mt-6 mb-3 text-foreground break-words" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-2xl font-semibold mt-4 mb-2 text-foreground break-words" {...props} />,
                      p: ({ ...props }) => <p className="mb-4 leading-relaxed text-foreground/90 break-words whitespace-pre-wrap" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                      li: ({ ...props }) => <li className="text-foreground/90 break-words" {...props} />,
                      strong: ({ ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                      code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap break-words" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-words" {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ ...props }) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-words" {...props} />,
                    }}
                  >
                    {project.prdContent?.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "").trim()}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4 overflow-x-auto" data-testid="raw-markdown-view">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground/90">
                    {project.prdContent}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
