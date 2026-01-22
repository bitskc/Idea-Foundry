import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Calendar, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const projects = [
    {
      id: 1,
      title: "TaskMaster AI",
      description: "A productivity app that auto-schedules your day based on energy levels.",
      status: "Draft",
      progress: 35,
      date: "2 days ago",
      type: "B2C Mobile App"
    },
    {
      id: 2,
      title: "PlantPals Marketplace",
      description: "Marketplace for rare houseplant trading with verification.",
      status: "Completed",
      progress: 100,
      date: "1 week ago",
      type: "Marketplace"
    },
    {
      id: 3,
      title: "DevTool Analytics",
      description: "Analytics for CLI tools usage.",
      status: "In Progress",
      progress: 75,
      date: "3 weeks ago",
      type: "B2B SaaS"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">Manage your ideas and PRDs.</p>
          </div>
          <Button onClick={() => setLocation("/conversation/new")} className="gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Project Card (Quick Action) */}
          <div 
            onClick={() => setLocation("/conversation/new")}
            className="group border-2 border-dashed border-muted hover:border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-card/50 hover:bg-card"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Create New PRD</h3>
            <p className="text-sm text-muted-foreground">Start a fresh conversation with VibePlan AI</p>
          </div>

          {/* Project Cards */}
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-all border-border/60">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="mb-2">{project.type}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
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
                  {project.date}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 gap-1 hover:text-primary p-0 hover:bg-transparent"
                  onClick={() => setLocation(project.status === "Completed" ? `/prd/${project.id}` : `/conversation/${project.id}`)}
                >
                  {project.status === "Completed" ? "View PRD" : "Continue"} <ArrowRight className="w-3 h-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
