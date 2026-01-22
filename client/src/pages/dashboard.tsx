import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Calendar, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-500/10 text-green-600 border-green-200";
    if (status === "in_progress") return "bg-blue-500/10 text-blue-600 border-blue-200";
    return "bg-gray-500/10 text-gray-600 border-gray-200";
  };

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">My Ideas</h1>
            <p className="text-muted-foreground">Your ideas, refined and ready to build.</p>
          </div>
          <Button onClick={() => setLocation("/")} className="gap-2" data-testid="button-new-idea">
            <Plus className="w-4 h-4" /> New Idea
          </Button>
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
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-all border-border/60" data-testid={`card-idea-${project.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="mb-2">{project.type}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                <CardTitle className="leading-tight group-hover:text-primary transition-colors">
                  {project.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
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
                    if (project.status === "completed") {
                      setLocation(`/prd/${project.id}`);
                    } else {
                      // Need to get conversation ID
                      fetch(`/api/projects/${project.id}`)
                        .then(r => r.json())
                        .then(data => {
                          if (data.conversation) {
                            setLocation(`/conversation/${data.conversation.id}`);
                          }
                        });
                    }
                  }}
                  data-testid={`button-view-${project.id}`}
                >
                  {project.status === "completed" ? "View Idea" : "Continue"} <ArrowRight className="w-3 h-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

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
