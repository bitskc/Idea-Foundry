import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronUp,
  Bot
} from "lucide-react";
import type { Project, Conversation as ConversationType, Message } from "@shared/schema";

type IdeaStatus = "exploring" | "active" | "backburner" | "archived";

const STATUS_CONFIG: Record<IdeaStatus, { label: string; icon: React.ComponentType<{className?: string}>; color: string }> = {
  exploring: { label: "Exploring", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900" },
  active: { label: "Active", icon: Flame, color: "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900" },
  backburner: { label: "Backburner", icon: Clock, color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900" },
  archived: { label: "Archived", icon: Archive, color: "bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-800" },
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

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

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
  const [stackRecommendation, setStackRecommendation] = useState<any>(null);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadProjectData();
  }, [params.id]);

  const loadProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) throw new Error("Failed to load idea");
      const data = await response.json();
      setProject(data);
      // Fetch notes for this project
      const notesRes = await fetch(`/api/projects/${params.id}/notes`);
      if (notesRes.ok) {
        setNotesList(await notesRes.json());
      }
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

  const addNote = async () => {
    if (!project || !newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (!response.ok) throw new Error("Failed to add note");
      const note = await response.json();
      setNotesList([note, ...notesList]);
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
      const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete note");
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

  const generateStackRecommendation = async () => {
    if (!project) return;
    setIsGeneratingStack(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/recommend-stack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to get stack recommendation");
      const data = await response.json();
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
        <div className="flex items-center justify-center h-full min-h-[50vh]">
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
      <div className="container mx-auto px-4 py-8 md:px-8 max-w-5xl">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="mb-8">
          <motion.div variants={fadeIn}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/app")}
              className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Foundry
            </Button>
          </motion.div>
          
          <motion.div variants={fadeIn} className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold">{project.type}</Badge>
                <Badge variant="outline" className={`${statusConfig.color} gap-1.5 px-2.5 py-0.5 text-xs font-semibold`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusConfig.label}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-3 text-foreground">{project.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">{project.description}</p>
            </div>
            
            {project.viabilityScore && (
              <div className="shrink-0 bg-card border shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px]">
                <div className={`text-4xl font-display font-black tracking-tighter ${
                  project.viabilityScore >= 7 ? 'text-green-500' : 
                  project.viabilityScore >= 4 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {project.viabilityScore}
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Viability</div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold gap-2 transition-all" data-testid="tab-overview">
              <Eye className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="think" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold gap-2 transition-all" data-testid="tab-think">
              <MessageSquare className="w-4 h-4" /> Think
            </TabsTrigger>
            <TabsTrigger value="make" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold gap-2 transition-all" data-testid="tab-make">
              <Hammer className="w-4 h-4" /> Make
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 m-0 focus-visible:outline-none">
            {/* Viability Score Placeholder */}
            {!project.viabilityScore && (
              <Card className="border-dashed bg-primary/5 border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles className="w-32 h-32 text-primary" />
                </div>
                <CardContent className="py-12 text-center relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-3 tracking-tight">Generate Deep Research</h3>
                  <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
                    Let the Foundry analyze your idea, scout competitors, extract insights, and calculate a realistic viability score in seconds.
                  </p>
                  <Button 
                    size="lg"
                    onClick={generateResearch} 
                    disabled={isGeneratingResearch}
                    className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold rounded-xl h-12 px-8"
                    data-testid="button-generate-research"
                  >
                    {isGeneratingResearch ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Forging Research...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Run AI Analysis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {project.viabilityScore && viability && (
              <Card className="overflow-hidden border-border/50 shadow-md">
                <CardHeader className="bg-muted/20 border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-display">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Market Viability Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-3xl font-bold tracking-tight mb-1">{viability.marketSize}<span className="text-muted-foreground text-lg font-medium">/10</span></div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Size</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
                        <Target className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="text-3xl font-bold tracking-tight mb-1">{viability.competition}<span className="text-muted-foreground text-lg font-medium">/10</span></div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Competition</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="text-3xl font-bold tracking-tight mb-1">{viability.effort}<span className="text-muted-foreground text-lg font-medium">/10</span></div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Build Effort</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                        <DollarSign className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-3xl font-bold tracking-tight mb-1">{viability.profitPotential}<span className="text-muted-foreground text-lg font-medium">/10</span></div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profit Potential</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competitors */}
            {competitors && competitors.length > 0 && (
              <Card className="overflow-hidden border-border/50 shadow-md">
                <CardHeader className="bg-muted/20 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl font-display">
                        <Building className="w-5 h-5 text-primary" />
                        Competitor Landscape
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm font-medium">Key players identified in your space</CardDescription>
                    </div>
                    <Badge variant="secondary" className="px-2.5 py-0.5 text-sm">{competitors.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {competitors.map((competitor, idx) => (
                      <div key={idx} className="p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg">{competitor.name}</h4>
                          {competitor.url && (
                            <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1">
                              Visit <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-5 h-10 line-clamp-2">{competitor.description}</p>
                        <div className="space-y-4">
                          <div className="bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                            <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-2 flex items-center gap-1.5"><Plus className="w-3 h-3" /> Strengths</p>
                            <ul className="text-sm text-foreground/80 space-y-1.5">
                              {competitor.strengths.map((s, i) => <li key={i} className="flex items-start gap-2"><span className="text-green-500 mt-0.5 text-xs">•</span><span className="leading-snug">{s}</span></li>)}
                            </ul>
                          </div>
                          <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                            <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Weaknesses</p>
                            <ul className="text-sm text-foreground/80 space-y-1.5">
                              {competitor.weaknesses.map((w, i) => <li key={i} className="flex items-start gap-2"><span className="text-red-500 mt-0.5 text-xs">•</span><span className="leading-snug">{w}</span></li>)}
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
              <Card className="overflow-hidden border-border/50 shadow-md">
                <CardHeader className="bg-muted/20 border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-display">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Strategic Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-3">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-card border hover:border-primary/30 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <p className="text-foreground leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card className="overflow-hidden border-border/50 shadow-md">
              <CardHeader 
                className="bg-muted/20 border-b pb-4 cursor-pointer select-none hover:bg-muted/30 transition-colors" 
                onClick={() => setNotesExpanded(!notesExpanded)}
                data-testid="button-toggle-notes"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-display">
                      <FileText className="w-5 h-5 text-primary" />
                      Scratchpad Notes
                      {notesList.length > 0 && (
                        <Badge variant="secondary" className="ml-2 font-mono">{notesList.length}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 font-medium text-sm">Jot down thoughts, questions, or next steps</CardDescription>
                  </div>
                  <div className="w-8 h-8 rounded-full hover:bg-background/50 flex items-center justify-center transition-colors">
                    {notesExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {notesExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <Textarea
                          placeholder="Type your thought here..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="min-h-[80px] rounded-xl resize-none focus-visible:ring-primary/20"
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
                          className="shrink-0 sm:h-auto sm:self-stretch rounded-xl gap-2 font-semibold"
                          data-testid="button-add-note"
                        >
                          {isAddingNote ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add Note
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {notesList.length === 0 ? (
                        <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
                          <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm font-medium text-muted-foreground">
                            No notes yet. Capture your thoughts above.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {notesList.map((note) => {
                            const isExpanded = expandedNotes.has(note.id);
                            const isLongNote = note.content.length > 150 || note.content.includes('\n');
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
                                className="group p-4 rounded-xl border bg-card hover:border-primary/20 transition-colors shadow-sm"
                                data-testid={`note-${note.id}`}
                              >
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    {isLongNote ? (
                                      <button
                                        onClick={toggleNote}
                                        className="text-left w-full block focus:outline-none"
                                        data-testid={`button-toggle-note-${note.id}`}
                                      >
                                        <div className="flex items-start gap-2">
                                          <p className={`text-sm text-foreground/90 whitespace-pre-wrap ${!isExpanded && "line-clamp-2"}`}>
                                            {note.content}
                                          </p>
                                        </div>
                                      </button>
                                    ) : (
                                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{note.content}</p>
                                    )}
                                    <div className="mt-2 text-xs font-medium text-muted-foreground">
                                      {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg shrink-0"
                                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                    data-testid={`button-delete-note-${note.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </TabsContent>

          {/* Think Tab */}
          <TabsContent value="think" className="space-y-6 m-0 focus-visible:outline-none">
            <Card className="overflow-hidden border-border/50 shadow-md">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  AI Interview
                </CardTitle>
                <CardDescription className="text-sm font-medium">Refine your idea through guided questioning</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!conversation ? (
                  <div className="text-center py-10 max-w-lg mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-3">Start the Interview</h3>
                    <p className="text-muted-foreground mb-8 text-lg">
                      Have a dynamic conversation with our AI strategist to flesh out assumptions, target audience, and core features.
                    </p>
                    <Button 
                      size="lg"
                      onClick={startConversation} 
                      disabled={isStartingConversation}
                      className="gap-2 font-semibold px-8 h-12 rounded-xl shadow-lg shadow-primary/20"
                      data-testid="button-start-conversation"
                    >
                      {isStartingConversation ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-5 h-5" />
                          Start Conversation
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-muted/30 border rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Interview in Progress</h4>
                        <p className="text-sm font-medium text-muted-foreground">
                          {messages.length} messages exchanged
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="lg"
                      onClick={() => setLocation(`/app/conversation/${conversation!.id}`)}
                      className="w-full sm:w-auto gap-2 font-semibold rounded-xl"
                      data-testid="button-continue-conversation"
                    >
                      Continue Interview
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/50 shadow-md">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Product Requirements Document (PRD)
                </CardTitle>
                <CardDescription className="text-sm font-medium">Generate structured specs based on your interview</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {project.prdContent ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">PRD Generated</h4>
                        <p className="text-sm font-medium text-muted-foreground">Ready for development</p>
                      </div>
                    </div>
                    <Button 
                      size="lg"
                      onClick={() => setLocation(`/app/prd/${project.id}`)}
                      className="w-full sm:w-auto gap-2 font-semibold rounded-xl"
                      data-testid="button-view-prd"
                    >
                      View & Export PRD
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setPrdTrack("quick")}
                        className={`p-4 text-left rounded-xl border-2 transition-all ${prdTrack === "quick" ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/50 hover:bg-muted"}`}
                      >
                        <Zap className={`w-5 h-5 mb-2 ${prdTrack === "quick" ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="font-bold mb-1">Quick</div>
                        <div className="text-xs text-muted-foreground">Basic summary & features</div>
                      </button>
                      <button
                        onClick={() => setPrdTrack("standard")}
                        className={`p-4 text-left rounded-xl border-2 transition-all ${prdTrack === "standard" ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/50 hover:bg-muted"}`}
                      >
                        <FileText className={`w-5 h-5 mb-2 ${prdTrack === "standard" ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="font-bold mb-1">Standard</div>
                        <div className="text-xs text-muted-foreground">Full specs & technical details</div>
                      </button>
                      <button
                        onClick={() => setPrdTrack("production")}
                        className={`p-4 text-left rounded-xl border-2 transition-all ${prdTrack === "production" ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/50 hover:bg-muted"}`}
                      >
                        <Crown className={`w-5 h-5 mb-2 ${prdTrack === "production" ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="font-bold mb-1">Production</div>
                        <div className="text-xs text-muted-foreground">Investor-ready documentation</div>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-foreground">Additional Requirements (Optional)</label>
                      <Textarea 
                        placeholder="E.g., Must use React and Node.js. Target audience is specifically enterprise..."
                        value={userRequirements}
                        onChange={(e) => setUserRequirements(e.target.value)}
                        className="rounded-xl min-h-[100px] resize-none focus-visible:ring-primary/20"
                        data-testid="input-prd-requirements"
                      />
                    </div>

                    <Button 
                      size="lg"
                      onClick={generatePrd}
                      disabled={isGeneratingPrd || (!conversation && !userRequirements)}
                      className="w-full gap-2 font-semibold rounded-xl h-12 shadow-lg shadow-primary/20"
                      data-testid="button-generate-prd"
                    >
                      {isGeneratingPrd ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Forging PRD...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Generate PRD
                        </>
                      )}
                    </Button>
                    {!conversation && !userRequirements && (
                      <p className="text-xs text-center text-muted-foreground font-medium">
                        Complete the interview or provide requirements first.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Make Tab */}
          <TabsContent value="make" className="space-y-6 m-0 focus-visible:outline-none">
            {/* Tech Stack Generator */}
            <Card className="overflow-hidden border-border/50 shadow-md">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Tech Stack Recommendation
                </CardTitle>
                <CardDescription className="text-sm font-medium">Get the optimal architecture for your specific product</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!stackRecommendation ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Server className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                      Based on your idea's complexity, AI will recommend the fastest path to MVP.
                    </p>
                    <Button 
                      size="lg"
                      onClick={generateStackRecommendation}
                      disabled={isGeneratingStack}
                      className="gap-2 font-semibold px-8 rounded-xl h-12 shadow-lg shadow-primary/20"
                      data-testid="button-generate-stack"
                    >
                      {isGeneratingStack ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing Architecture...
                        </>
                      ) : (
                        <>
                          <Database className="w-5 h-5" />
                          Generate Tech Stack
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8" data-testid="stack-recommendation-results">
                    {/* Primary Stack */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3" data-testid="section-frontend">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-primary">
                          <Eye className="w-5 h-5" />
                          Frontend
                        </h4>
                        <div className="p-5 border rounded-xl bg-card shadow-sm hover:border-primary/20 transition-colors">
                          <p className="font-bold text-lg mb-2">{stackRecommendation.frontend.name}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{stackRecommendation.frontend.reason}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3" data-testid="section-backend">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-blue-500">
                          <Server className="w-5 h-5" />
                          Backend / DB
                        </h4>
                        <div className="p-5 border rounded-xl bg-card shadow-sm hover:border-blue-500/20 transition-colors">
                          <p className="font-bold text-lg mb-2">{stackRecommendation.backend.name}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{stackRecommendation.backend.reason}</p>
                        </div>
                      </div>
                    </div>

                    {/* Full-Stack Option */}
                    {stackRecommendation.fullStack && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <Rocket className="w-5 h-5 text-orange-500" />
                          Full-Stack Alternative
                        </h4>
                        <div className="p-6 border rounded-xl bg-orange-500/5 border-orange-500/20" data-testid="card-fullstack">
                          <p className="font-bold text-lg text-orange-700 dark:text-orange-400 mb-2" data-testid="text-fullstack-name">{stackRecommendation.fullStack.name}</p>
                          <p className="text-sm text-foreground/80 leading-relaxed" data-testid="text-fullstack-reason">{stackRecommendation.fullStack.reason}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Assistants */}
                    {stackRecommendation.aiAssistants?.length > 0 && (
                      <div className="space-y-3" data-testid="section-ai-assistants">
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                          AI Coding Assistants
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {stackRecommendation.aiAssistants.map((ai: any, idx: number) => (
                            <div key={idx} className="p-5 border rounded-xl bg-card shadow-sm" data-testid={`card-ai-assistant-${idx}`}>
                              <p className="font-bold mb-1">{ai.name}</p>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{ai.bestFor}</p>
                              {ai.tip && <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border">{ai.tip}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline & Cost */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="section-timeline-cost">
                      {stackRecommendation.mvpTimeline && (
                        <div className="flex items-center gap-4 p-5 border rounded-xl bg-card shadow-sm" data-testid="card-mvp-timeline">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Clock className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">MVP Timeline</p>
                            <p className="font-bold text-xl" data-testid="text-mvp-timeline">{stackRecommendation.mvpTimeline}</p>
                          </div>
                        </div>
                      )}
                      {stackRecommendation.costEstimate && (
                        <div className="flex items-center gap-4 p-5 border rounded-xl bg-card shadow-sm" data-testid="card-cost-estimate">
                          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                            <DollarSign className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Infrastructure Cost</p>
                            <p className="font-bold text-xl" data-testid="text-cost-estimate">{stackRecommendation.costEstimate}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Warnings */}
                    {stackRecommendation.warnings?.length > 0 && (
                      <div className="p-5 border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50 dark:bg-red-900/10" data-testid="section-warnings">
                        <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-5 h-5" />
                          Things to Watch Out For
                        </h4>
                        <ul className="text-sm text-red-800 dark:text-red-300 space-y-2">
                          {stackRecommendation.warnings.map((warning: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2" data-testid={`text-warning-${idx}`}>
                              <span className="text-red-500 mt-0.5 font-bold">•</span>
                              <span className="leading-relaxed">{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      onClick={() => setStackRecommendation(null)}
                      className="w-full gap-2 font-semibold h-12 rounded-xl border-2 hover:bg-muted/50"
                      data-testid="button-reset-stack"
                    >
                      <Layers className="w-5 h-5" />
                      Get New Recommendation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Tools */}
            <Card className="overflow-hidden border-border/50 shadow-md">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Validation Tools
                </CardTitle>
                <CardDescription className="text-sm font-medium">Quick ways to test market interest before building</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 flex-col gap-3 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all" 
                    onClick={() => setLocation(`/app/prd/${project.id}`)}
                    data-testid="button-landing-page"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                      <ExternalLink className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-bold text-lg">Landing Page Generator</span>
                    <span className="text-sm text-muted-foreground whitespace-normal text-center max-w-[250px]">Create a quick "Coming Soon" page to capture emails and test interest</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 flex-col gap-3 rounded-xl border-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all" 
                    onClick={() => setLocation(`/app/prd/${project.id}`)}
                    data-testid="button-communities"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-1">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="font-bold text-lg">Find Communities</span>
                    <span className="text-sm text-muted-foreground whitespace-normal text-center max-w-[250px]">Discover niche Reddit, Discord, and Twitter communities for your product</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>

    </AppLayout>
  );
}