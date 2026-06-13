import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Calendar, ArrowRight, Loader2, Trash2, Flame, Lightbulb, Archive, Clock, Pencil, Check, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@shared/schema";

type IdeaStatus = "exploring" | "active" | "backburner" | "archived";

const STATUS_CONFIG: Record<IdeaStatus, { label: string; icon: React.ComponentType<{className?: string}>; color: string }> = {
  exploring: { label: "Exploring", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-600 border-yellow-200/20" },
  active: { label: "Active", icon: Flame, color: "bg-green-500/10 text-green-600 border-green-200/20" },
  backburner: { label: "Backburner", icon: Clock, color: "bg-blue-500/10 text-blue-600 border-blue-200/20" },
  archived: { label: "Archived", icon: Archive, color: "bg-gray-500/10 text-gray-500 border-gray-200/20" },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<IdeaStatus | "all">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to load ideas");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error loading ideas:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your ideas",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete idea");
      
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Idea deleted",
        description: "The idea has been removed.",
      });
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete idea",
      });
    }
  };

  const updateIdeaStatus = async (id: number, newStatus: IdeaStatus) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaStatus: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      
      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ideaStatus: newStatus } : p
      ));
      toast({
        title: "Status updated",
        description: `Idea moved to ${STATUS_CONFIG[newStatus].label}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditingDescription(project.description || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingDescription("");
  };

  const saveDescription = async (id: number) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editingDescription }),
      });
      if (!response.ok) throw new Error("Failed to update description");
      
      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, description: editingDescription } : p
      ));
      setEditingId(null);
      setEditingDescription("");
      toast({
        title: "Summary updated",
        description: "Your idea summary has been saved.",
      });
    } catch (error) {
      console.error("Error updating description:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update summary",
      });
    }
  };

  const getIdeaStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as IdeaStatus] || STATUS_CONFIG.exploring;
  };

  const filteredProjects = activeFilter === "all" 
    ? projects.filter(p => (p.ideaStatus || "exploring") !== "archived")
    : projects.filter(p => (p.ideaStatus || "exploring") === activeFilter);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading your forge...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 md:p-10 max-w-7xl relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-black mb-3 tracking-tight">My Foundry</h1>
            <p className="text-lg text-muted-foreground">Your ideas, refined and ready to build.</p>
          </div>
          <Button onClick={() => setLocation("/app/new")} className="gap-2 h-12 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-base font-semibold shrink-0" data-testid="button-new-idea">
            <Plus className="w-5 h-5" /> New Idea
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none" data-testid="status-filters">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className={`shrink-0 rounded-full font-semibold transition-all ${activeFilter === "all" ? "shadow-md shadow-primary/20" : ""}`}
            data-testid="filter-all"
          >
            All Ideas
            <Badge variant="secondary" className="ml-2 bg-background/50 rounded-full">
              {projects.filter(p => (p.ideaStatus || "exploring") !== "archived").length}
            </Badge>
          </Button>
          {(Object.entries(STATUS_CONFIG) as [IdeaStatus, typeof STATUS_CONFIG[IdeaStatus]][]).map(([key, config]) => {
            const StatusIcon = config.icon;
            const count = projects.filter(p => (p.ideaStatus || "exploring") === key).length;
            const isActive = activeFilter === key;
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(key)}
                className={`shrink-0 gap-1.5 rounded-full font-semibold transition-all ${isActive ? "shadow-md shadow-primary/20" : ""}`}
                data-testid={`filter-${key}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {config.label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1.5 bg-background/50 rounded-full">
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* New Idea Card (Quick Action) */}
          <motion.div variants={fadeIn} data-testid="card-new-idea">
            <div 
              onClick={() => setLocation("/app/new")}
              className="h-full group border-2 border-dashed border-border/60 hover:border-primary/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-card/30 hover:bg-primary/5 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 tracking-tight">Strike the Anvil</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Start brainstorming a new concept with your AI sparring partner</p>
            </div>
          </motion.div>

          {/* Idea Cards */}
          {filteredProjects.map((project) => {
            const statusConfig = getIdeaStatusConfig(project.ideaStatus || "exploring");
            const StatusIcon = statusConfig.icon;
            return (
              <motion.div key={project.id} variants={fadeIn}>
                <Card className="h-full group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/40 bg-card/80 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col" data-testid={`card-idea-${project.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="rounded-full bg-secondary/50 font-semibold">{project.type}</Badge>
                        <Badge variant="outline" className={`rounded-full ${statusConfig.color} gap-1.5 border font-semibold backdrop-blur-md`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:bg-muted/50 rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border/40 shadow-xl">
                          <DropdownMenuItem onClick={() => updateIdeaStatus(project.id, "active")} className="rounded-lg cursor-pointer">
                            <Flame className="w-4 h-4 mr-2 text-green-500" />
                            Move to Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateIdeaStatus(project.id, "exploring")} className="rounded-lg cursor-pointer">
                            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                            Move to Exploring
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateIdeaStatus(project.id, "backburner")} className="rounded-lg cursor-pointer">
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            Move to Backburner
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateIdeaStatus(project.id, "archived")} className="rounded-lg cursor-pointer">
                            <Archive className="w-4 h-4 mr-2 text-gray-500" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteProject(project.id)}
                            className="text-destructive rounded-lg cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle 
                      className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => setLocation(`/app/ideas/${project.id}`)}
                      data-testid={`title-idea-${project.id}`}
                    >
                      {project.title}
                    </CardTitle>
                    {editingId === project.id ? (
                      <div className="mt-3 flex gap-2 items-start">
                        <Input
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          className="text-sm rounded-lg bg-background/50 border-primary/30 focus-visible:ring-primary/30"
                          autoFocus
                          data-testid={`input-edit-description-${project.id}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveDescription(project.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-9 w-9 shrink-0 rounded-lg hover:bg-green-500/10 hover:text-green-500 transition-colors"
                          onClick={() => saveDescription(project.id)}
                          data-testid={`button-save-description-${project.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-9 w-9 shrink-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={cancelEditing}
                          data-testid={`button-cancel-edit-${project.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="group/desc flex items-start gap-1 mt-2">
                        <CardDescription className="line-clamp-2 flex-1 text-sm leading-relaxed">
                          {project.description || "No summary yet. Add a brief description to remember the core concept."}
                        </CardDescription>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(project);
                          }}
                          className="opacity-0 group-hover/desc:opacity-100 p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all shrink-0"
                          data-testid={`button-edit-description-${project.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pb-5 mt-auto">
                    {project.viabilityScore && (
                      <div className="flex items-center gap-3 mb-4 bg-muted/30 p-2.5 rounded-xl border border-border/30">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Viability</span>
                        <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ease-out ${
                              project.viabilityScore >= 7 ? 'bg-green-500' : 
                              project.viabilityScore >= 4 ? 'bg-yellow-500' : 'bg-destructive'
                            }`} 
                            style={{ width: `${project.viabilityScore * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-6 text-right">{project.viabilityScore}<span className="text-muted-foreground/50">/10</span></span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      <span>Progress</span>
                      <span className="text-foreground">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-700 ease-out" 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 pb-4 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground bg-muted/10">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(project.updatedAt)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-1.5 hover:text-primary p-0 hover:bg-transparent font-bold"
                      onClick={() => {
                        setLocation(`/app/ideas/${project.id}`);
                      }}
                      data-testid={`button-view-${project.id}`}
                    >
                      View details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredProjects.length === 0 && projects.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 bg-card/30 rounded-3xl border border-border/40 mt-8 backdrop-blur-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Archive className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">No ideas here</h3>
            <p className="text-muted-foreground">Try changing your filter to see other projects.</p>
          </motion.div>
        )}

        {projects.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 bg-card/30 rounded-3xl border border-border/40 mt-8 backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3 tracking-tight">Your forge is empty</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">Every great product starts as a raw idea. Strike the anvil and see what takes shape.</p>
            <Button onClick={() => setLocation("/app/new")} className="gap-2 h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-base font-semibold">
              <Plus className="w-5 h-5" /> Start Forging
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
