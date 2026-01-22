import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Calendar, ArrowRight, Loader2, Trash2, Flame, Lightbulb, Archive, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-10 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">My Ideas</h1>
            <p className="text-muted-foreground">Your ideas, refined and ready to build.</p>
          </div>
          <Button onClick={() => setLocation("/")} className="gap-2" data-testid="button-new-idea">
            <Plus className="w-4 h-4" /> New Idea
          </Button>
        </div>

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
            onClick={() => setLocation("/")}
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
            return (
              <Card key={project.id} className="group hover:shadow-lg transition-all border-border/60" data-testid={`card-idea-${project.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary">{project.type}</Badge>
                      <Badge variant="outline" className={`${statusConfig.color} gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
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
                    onClick={() => setLocation(`/idea/${project.id}`)}
                    data-testid={`title-idea-${project.id}`}
                  >
                    {project.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {project.description}
                  </CardDescription>
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
                      // Navigate to the new idea detail page (Overview tab)
                      setLocation(`/idea/${project.id}`);
                    }}
                    data-testid={`button-view-${project.id}`}
                  >
                    View Idea <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredProjects.length === 0 && projects.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No ideas in this category.</p>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No ideas yet. Let's start exploring!</p>
            <Button onClick={() => setLocation("/")} className="gap-2">
              <Plus className="w-4 h-4" /> Start Your First Idea
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
