import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  FileText,
  Sparkles,
  ExternalLink,
  Building,
  Zap,
  Rocket,
  Crown,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  Server,
  Database,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { Project, Conversation as ConversationType, Message } from "@shared/schema";

type IdeaStatus = "exploring" | "active" | "backburner" | "archived";

const STATUS_CONFIG: Record<IdeaStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
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
  const [notesList, setNotesList] = useState<Array<{ id: number; content: string; createdAt: string }>>([]);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isGeneratingResearch, setIsGeneratingResearch] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [prdTrack, setPrdTrack] = useState<"quick" | "standard" | "production">("standard");
  const [userRequirements, setUserRequirements] = useState("");
  const [isGeneratingPrd, setIsGeneratingPrd] = useState(false);
  const [isGeneratingStack, setIsGeneratingStack] = useState(false);
  const [isSavingStack, setIsSavingStack] = useState(false);
  const [stackRecommendation, setStackRecommendation] = useState<any>(null);
  const [savedTechStack, setSavedTechStack] = useState<any>(null);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadProjectData();
  }, [params.id]);

  const loadProjectData = async () => {
    try {
      const response = await api.get<any>(`/api/projects/${params.id}`);
      setProject(response);
      // Load cached tech stack data
      if (response.techStack) {
        setSavedTechStack(response.techStack);
      }
      if (response.techStackRecommendation) {
        setStackRecommendation(response.techStackRecommendation);
      }
      // Fetch notes for this project
      try {
        const notes = await api.get(`/api/projects/${params.id}/notes`);
        setNotesList(notes as any[]);
      } catch { /* ignore */ }
      if (response.conversation) {
        setConversation(response.conversation);
        try {
          const msgs = await api.get(`/api/conversations/${response.conversation.id}/messages`);
          setMessages(msgs as any[]);
        } catch { /* ignore */ }
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

  const addNote = async () => {
    if (!project || !newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const note = await api.post(`/api/projects/${project.id}/notes`, { content: newNote });
      setNotesList([note as any, ...notesList]);
      setNewNote("");
      toast({ title: "Note added" });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note",
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  const deleteNote = async (noteId: number) => {
    try {
      await api.delete(`/api/notes/${noteId}`);
      setNotesList(notesList.filter(n => n.id !== noteId));
      toast({ title: "Note deleted" });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note",
      });
    }
  };

  const generateResearch = async () => {
    if (!project) return;
    setIsGeneratingResearch(true);
    try {
      const data = await api.post(`/api/projects/${project.id}/research`);
      setProject(prev => prev ? { ...prev, ...(data as object) } : null);
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
      const data = await api.post<{ id: number }>(`/api/projects/${project.id}/start-conversation`, { conversationMode: "supportive" });
      setLocation(`/app/conversation/${data.id}`);
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
      const data = await api.post<{ prdContent: string }>(`/api/projects/${project.id}/generate-prd`, {
        track: prdTrack,
        userRequirements: userRequirements.trim() || undefined
      });
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

  const generateStackRecommendation = async () => {
    if (!project) return;
    setIsGeneratingStack(true);
    try {
      const data = await api.post(`/api/projects/${project.id}/recommend-stack`);
      setStackRecommendation(data);
      toast({ title: "Tech Stack Ready!", description: "We've analyzed your idea and recommended a tech stack." });
    } catch (error) {
      console.error("Error getting stack recommendation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate tech stack recommendation",
      });
    } finally {
      setIsGeneratingStack(false);
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
        <div className="container mx-auto p-6 text-center">
          <p className="text-muted-foreground">Idea not found</p>
          <Button onClick={() => setLocation("/app")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[(project.ideaStatus as IdeaStatus) || "exploring"];
  const StatusIcon = statusConfig.icon;
  const viability = project.viabilityBreakdown as ViabilityBreakdown | null;
  const competitors = project.competitors as Competitor[] | null;
  const insights = project.keyInsights as string[] | null;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 md:p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/app")}
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
                <div className={`text-4xl font-bold ${project.viabilityScore >= 7 ? 'text-green-600' :
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
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setNotesExpanded(!notesExpanded)}
                data-testid="button-toggle-notes"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Notes
                      {notesList.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{notesList.length}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Jot down thoughts, questions, or next steps</CardDescription>
                  </div>
                  {notesExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {notesExpanded && (
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[60px]"
                      data-testid="input-new-note"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          addNote();
                        }
                      }}
                    />
                    <Button
                      onClick={addNote}
                      disabled={isAddingNote || !newNote.trim()}
                      size="sm"
                      className="shrink-0"
                      data-testid="button-add-note"
                    >
                      {isAddingNote ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {notesList.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet. Add your first note above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {notesList.map((note) => {
                        const isExpanded = expandedNotes.has(note.id);
                        const isLongNote = note.content.length > 100 || note.content.includes('\n');
                        const toggleNote = () => {
                          setExpandedNotes(prev => {
                            const next = new Set(prev);
                            if (next.has(note.id)) {
                              next.delete(note.id);
                            } else {
                              next.add(note.id);
                            }
                            return next;
                          });
                        };
                        return (
                          <div
                            key={note.id}
                            className="group p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            data-testid={`note-${note.id}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                {isLongNote ? (
                                  <button
                                    onClick={toggleNote}
                                    className="text-left w-full"
                                    data-testid={`button-toggle-note-${note.id}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                                      )}
                                      <p className={`text-sm whitespace-pre-wrap ${!isExpanded ? 'line-clamp-1' : ''}`}>
                                        {note.content}
                                      </p>
                                    </div>
                                  </button>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                )}
                              </div>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all shrink-0"
                                data-testid={`button-delete-note-${note.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(note.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
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
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                          }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => setLocation(`/app/conversation/${conversation.id}`)}
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
                        onClick={() => setLocation(`/app/prd/${project.id}`)}
                        data-testid="button-view-prd"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View PRD
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          await api.patch(`/api/projects/${project.id}`, { prdContent: null });
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
                          className={`p-4 rounded-lg border-2 text-left transition-all ${prdTrack === "quick"
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
                          className={`p-4 rounded-lg border-2 text-left transition-all ${prdTrack === "standard"
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
                          className={`p-4 rounded-lg border-2 text-left transition-all ${prdTrack === "production"
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

            {/* Tech Stack Advisor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Tech Stack Advisor
                </CardTitle>
                <CardDescription>Get AI-recommended technology stack optimized for your idea</CardDescription>
              </CardHeader>
              <CardContent>
                {!stackRecommendation ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Our AI will analyze your idea and recommend the best tech stack for speed to MVP,
                      AI coding assistant compatibility, and cost efficiency.
                    </p>
                    <Button
                      onClick={generateStackRecommendation}
                      disabled={isGeneratingStack}
                      className="w-full"
                      data-testid="button-get-stack-recommendation"
                    >
                      {isGeneratingStack ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing your idea...
                        </>
                      ) : (
                        <>
                          <Layers className="w-4 h-4 mr-2" />
                          Get Stack Recommendation
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6" data-testid="stack-recommendation-results">
                    {/* Recommended Stack */}
                    {stackRecommendation.recommended && (
                      <div data-testid="section-recommended-stack">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Recommended Stack
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {stackRecommendation.recommended.frontend && (
                            <div className="p-3 border rounded-lg" data-testid="card-stack-frontend">
                              <div className="flex items-center gap-2 mb-1">
                                <Building className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-sm">Frontend</span>
                              </div>
                              <p className="text-sm font-semibold" data-testid="text-stack-frontend-name">{stackRecommendation.recommended.frontend.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{stackRecommendation.recommended.frontend.reason}</p>
                            </div>
                          )}
                          {stackRecommendation.recommended.backend && (
                            <div className="p-3 border rounded-lg" data-testid="card-stack-backend">
                              <div className="flex items-center gap-2 mb-1">
                                <Server className="w-4 h-4 text-green-500" />
                                <span className="font-medium text-sm">Backend</span>
                              </div>
                              <p className="text-sm font-semibold" data-testid="text-stack-backend-name">{stackRecommendation.recommended.backend.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{stackRecommendation.recommended.backend.reason}</p>
                            </div>
                          )}
                          {stackRecommendation.recommended.database && (
                            <div className="p-3 border rounded-lg" data-testid="card-stack-database">
                              <div className="flex items-center gap-2 mb-1">
                                <Database className="w-4 h-4 text-purple-500" />
                                <span className="font-medium text-sm">Database</span>
                              </div>
                              <p className="text-sm font-semibold" data-testid="text-stack-database-name">{stackRecommendation.recommended.database.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{stackRecommendation.recommended.database.reason}</p>
                            </div>
                          )}
                          {stackRecommendation.recommended.hosting && (
                            <div className="p-3 border rounded-lg" data-testid="card-stack-hosting">
                              <div className="flex items-center gap-2 mb-1">
                                <ExternalLink className="w-4 h-4 text-orange-500" />
                                <span className="font-medium text-sm">Hosting</span>
                              </div>
                              <p className="text-sm font-semibold" data-testid="text-stack-hosting-name">{stackRecommendation.recommended.hosting.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{stackRecommendation.recommended.hosting.reason}</p>
                            </div>
                          )}
                          {stackRecommendation.recommended.auth && (
                            <div className="p-3 border rounded-lg" data-testid="card-stack-auth">
                              <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-cyan-500" />
                                <span className="font-medium text-sm">Auth</span>
                              </div>
                              <p className="text-sm font-semibold" data-testid="text-stack-auth-name">{stackRecommendation.recommended.auth.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{stackRecommendation.recommended.auth.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Full-Stack Option */}
                    {stackRecommendation.fullStack?.name && (
                      <div data-testid="section-fullstack-alternative">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Rocket className="w-4 h-4 text-primary" />
                          Full-Stack Alternative
                        </h4>
                        <div className="p-3 border rounded-lg bg-primary/5" data-testid="card-fullstack">
                          <p className="font-semibold" data-testid="text-fullstack-name">{stackRecommendation.fullStack.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{stackRecommendation.fullStack.reason}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Assistants */}
                    {stackRecommendation.aiAssistants?.length > 0 && (
                      <div data-testid="section-ai-assistants">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-500" />
                          AI Coding Assistants
                        </h4>
                        <div className="space-y-2">
                          {stackRecommendation.aiAssistants.map((ai: any, idx: number) => (
                            <div key={idx} className="p-2 border rounded-lg text-sm" data-testid={`card-ai-assistant-${idx}`}>
                              <span className="font-medium">{ai.name}</span>
                              <span className="text-muted-foreground"> - {ai.bestFor}</span>
                              {ai.tip && <p className="text-xs text-muted-foreground mt-1">{ai.tip}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline & Cost */}
                    <div className="grid grid-cols-2 gap-4" data-testid="section-timeline-cost">
                      {stackRecommendation.mvpTimeline && (
                        <div className="p-3 border rounded-lg text-center" data-testid="card-mvp-timeline">
                          <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                          <p className="text-xs text-muted-foreground">MVP Timeline</p>
                          <p className="font-medium text-sm" data-testid="text-mvp-timeline">{stackRecommendation.mvpTimeline}</p>
                        </div>
                      )}
                      {stackRecommendation.costEstimate && (
                        <div className="p-3 border rounded-lg text-center" data-testid="card-cost-estimate">
                          <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-500" />
                          <p className="text-xs text-muted-foreground">Infrastructure Cost</p>
                          <p className="font-medium text-sm" data-testid="text-cost-estimate">{stackRecommendation.costEstimate}</p>
                        </div>
                      )}
                    </div>

                    {/* Warnings */}
                    {stackRecommendation.warnings?.length > 0 && (
                      <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50" data-testid="section-warnings">
                        <h4 className="font-medium mb-2 flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="w-4 h-4" />
                          Things to Watch Out For
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {stackRecommendation.warnings.map((warning: string, idx: number) => (
                            <li key={idx} data-testid={`text-warning-${idx}`}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Regenerate Button */}
                    <Button
                      variant="outline"
                      onClick={() => setStackRecommendation(null)}
                      className="w-full"
                      data-testid="button-reset-stack"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Get New Recommendation
                    </Button>
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

    </AppLayout>
  );
}
