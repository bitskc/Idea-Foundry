import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Calendar, ArrowRight, Loader2, Trash2, Flame, Lightbulb, Archive, Clock, Pencil, Check, X, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Project } from "@shared/schema";
import { api } from "@/lib/api";
import { computeVelocity, computeStreak } from "@/lib/velocity";

type IdeaStatus = "exploring" | "active" | "backburner" | "archived";

const STATUS_CONFIG: Record<IdeaStatus, { label: string; icon: React.ComponentType<{className?: string}>; color: string }> = {
  exploring: { label: "Exploring", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  active: { label: "Active", icon: Flame, color: "bg-green-500/10 text-green-600 border-green-200" },
  backburner: { label: "Backburner", icon: Clock, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  archived: { label: "Archived", icon: Archive, color: "bg-gray-500/10 text-gray-600 border-gray-200" },
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
      const data = await api.get<Project[]>("/api/projects");
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
      await api.delete(`/api/projects/${id}`);
      
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
      await api.patch(`/api/projects/${id}`, { ideaStatus: newStatus });
      
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
      await api.patch(`/api/projects/${id}`, { description: editingDescription });
      
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
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 md:p-10 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-display font-bold mb-2 break-words">My Ideas</h1>
            <p className="text-muted-foreground">Your ideas, refined and ready to build.</p>
          </div>
          <Button onClick={() => setLocation("/app/new")} className="gap-2 hidden md:flex" data-testid="button-new-idea">
            <Plus className="w-4 h-4" /> New Idea
          </Button>
        </div>

        {/* Velocity Streak Strip */}
        {projects.length > 0 && (() => {
          const streak = computeStreak(projects);
          const activeProjects = projects.filter(p => (p.ideaStatus || "exploring") !== "archived");
          const avgVelocity = activeProjects.length > 0
            ? Math.round(activeProjects.reduce((sum, p) => sum + computeVelocity(p).velocityScore, 0) / activeProjects.length)
            : 0;
          const staleCount = activeProjects.filter(p => computeVelocity(p).isStale).length;
          return (
            <div className="mb-6 p-4 rounded-xl border bg-card/50" data-testid="velocity-strip">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Idea Velocity</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">{streak.currentStreak}d</span>
                    <span className="text-muted-foreground text-xs">streak</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">Avg velocity</span>
                    <span className="font-semibold">{avgVelocity}/10</span>
                  </div>
                  {staleCount > 0 && (
                    <div className="flex items-center gap-1.5" data-testid="stale-count">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-yellow-600">{staleCount}</span>
                      <span className="text-muted-foreground text-xs">stale</span>
                    </div>
                  )}
                </div>
              </div>
              {/* 30-day activity heatmap */}
              <div className="flex gap-1" data-testid="activity-heatmap">
                {streak.activityMap.map((active, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-sm transition-colors ${
                      active ? "bg-primary" : "bg-muted"
                    }`}
                    title={`Day ${i + 1}: ${active ? "Active" : "No activity"}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          );
        })()}

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" data-testid="status-filters">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className="shrink-0"
            data-testid="filter-all"
          >
            All Ideas
            <Badge variant="secondary" className="ml-2 bg-background/50">
              {projects.filter(p => (p.ideaStatus || "exploring") !== "archived").length}
            </Badge>
          </Button>
          {(Object.entries(STATUS_CONFIG) as [IdeaStatus, typeof STATUS_CONFIG[IdeaStatus]][]).map(([key, config]) => {
            const StatusIcon = config.icon;
            const count = projects.filter(p => (p.ideaStatus || "exploring") === key).length;
            return (
              <Button
                key={key}
                variant={activeFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(key)}
                className="shrink-0 gap-1"
                data-testid={`filter-${key}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {config.label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-background/50">
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Idea Card (Quick Action) */}
          <div 
            onClick={() => setLocation("/app/new")}
            className="group border-2 border-dashed border-muted hover:border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-card/50 hover:bg-card"
            data-testid="card-new-idea"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Explore New Idea</h3>
            <p className="text-sm text-muted-foreground">Start brainstorming with your AI sparring partner</p>
          </div>

          {/* Idea Cards */}
          {filteredProjects.map((project) => {
            const statusConfig = getIdeaStatusConfig(project.ideaStatus || "exploring");
            const StatusIcon = statusConfig.icon;
            const velocity = computeVelocity(project);
            return (
              <ContextMenu key={project.id}>
                <ContextMenuTrigger asChild>
              <Card className={`group hover:shadow-lg transition-all border-border/60 ${velocity.isStale ? "border-yellow-300/50" : ""}`} data-testid={`card-idea-${project.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{project.type}</Badge>
                      <Badge variant="outline" className={`${statusConfig.color} gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                      {velocity.isStale && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-500/10 gap-1" data-testid={`badge-stale-${project.id}`}>
                          <AlertCircle className="w-3 h-3" />
                          Stale
                        </Badge>
                      )}
                      <Badge variant="outline" className={`${velocity.velocityColor} gap-1`} data-testid={`badge-velocity-${project.id}`}>
                        <Zap className="w-3 h-3" />
                        {velocity.velocityLabel}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateIdeaStatus(project.id, "active")}>
                          <Flame className="w-4 h-4 mr-2 text-green-600" />
                          Move to Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateIdeaStatus(project.id, "exploring")}>
                          <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
                          Move to Exploring
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateIdeaStatus(project.id, "backburner")}>
                          <Clock className="w-4 h-4 mr-2 text-blue-600" />
                          Move to Backburner
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateIdeaStatus(project.id, "archived")}>
                          <Archive className="w-4 h-4 mr-2 text-gray-600" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteProject(project.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle 
                    className="leading-tight group-hover:text-primary transition-colors cursor-pointer hover:underline"
                    onClick={() => setLocation(`/app/ideas/${project.id}`)}
                    data-testid={`title-idea-${project.id}`}
                  >
                    {project.title}
                  </CardTitle>
                  {editingId === project.id ? (
                    <div className="mt-1 flex gap-2 items-start">
                      <Input
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="text-sm"
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
                        className="h-8 w-8 shrink-0"
                        onClick={() => saveDescription(project.id)}
                        data-testid={`button-save-description-${project.id}`}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 shrink-0"
                        onClick={cancelEditing}
                        data-testid={`button-cancel-edit-${project.id}`}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <div className="group/desc flex items-start gap-1 mt-1">
                      <CardDescription className="line-clamp-2 flex-1">
                        {project.description || "No summary yet"}
                      </CardDescription>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(project);
                        }}
                        className="opacity-100 md:opacity-0 md:group-hover/desc:opacity-100 p-1 text-muted-foreground hover:text-primary transition-all shrink-0"
                        data-testid={`button-edit-description-${project.id}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pb-3">
                  {project.viabilityScore && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">Viability</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            project.viabilityScore >= 7 ? 'bg-green-500' : 
                            project.viabilityScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${project.viabilityScore * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{project.viabilityScore}/10</span>
                    </div>
                  )}
                  {(project.difficultyRoiRatio as any) && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">ROI Ratio</span>
                      <Badge variant="outline" className={`text-xs ${(project.difficultyRoiRatio as any).verdict === 'strong' ? 'border-green-500 text-green-600' : (project.difficultyRoiRatio as any).verdict === 'balanced' ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                        {(project.difficultyRoiRatio as any).ratio.toFixed(1)} ({(project.difficultyRoiRatio as any).verdict})
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.updatedAt)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 gap-1 hover:text-primary p-0 hover:bg-transparent"
                    onClick={() => {
                      setLocation(`/app/ideas/${project.id}`);
                    }}
                    data-testid={`button-view-${project.id}`}
                  >
                    View Idea <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardFooter>
              </Card>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48" data-testid={`context-menu-${project.id}`}>
                  <ContextMenuItem onClick={() => updateIdeaStatus(project.id, "active")}>
                    <Flame className="w-4 h-4 mr-2 text-green-600" />
                    Move to Active
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => updateIdeaStatus(project.id, "exploring")}>
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
                    Move to Exploring
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => updateIdeaStatus(project.id, "backburner")}>
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    Move to Backburner
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => updateIdeaStatus(project.id, "archived")}>
                    <Archive className="w-4 h-4 mr-2 text-gray-600" />
                    Archive
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => setLocation(`/app/ideas/${project.id}`)}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    View Idea
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => deleteProject(project.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>

        {filteredProjects.length === 0 && projects.length > 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              {activeFilter === "archived" ? (
                <Archive className="w-8 h-8 text-muted-foreground" />
              ) : activeFilter === "active" ? (
                <Flame className="w-8 h-8 text-muted-foreground" />
              ) : activeFilter === "backburner" ? (
                <Clock className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Lightbulb className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">No {STATUS_CONFIG[activeFilter as IdeaStatus]?.label || ""} ideas</h3>
            <p className="text-muted-foreground mb-4">
              {activeFilter === "archived" 
                ? "Archive ideas you want to keep but aren't actively working on."
                : `Move ideas here when they're ${activeFilter === "active" ? "ready to build" : activeFilter === "backburner" ? "on hold" : "being explored"}.`
              }
            </p>
            <Button variant="outline" onClick={() => setActiveFilter("all")}>
              View All Ideas
            </Button>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">Capture your first idea</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Every great product starts with an idea. Use our AI-powered brainstorming partner to refine yours into something buildable.
            </p>
            <Button size="lg" onClick={() => setLocation("/app/new")} className="gap-2">
              <Plus className="w-5 h-5" /> Start Your First Idea
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
