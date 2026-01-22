import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Download, FileText, Share2, Edit, Loader2, ArrowLeft, RefreshCw, Briefcase, Presentation, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import type { Project, Conversation } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProjectWithConversation = Project & { conversation?: Conversation };
type PRDFormat = "full" | "business" | "pitch";

const FORMAT_OPTIONS = [
  { id: "full" as PRDFormat, label: "Dev-Ready PRD", icon: Code, description: "Technical specs for developers" },
  { id: "business" as PRDFormat, label: "Business Plan", icon: Briefcase, description: "For investors & stakeholders" },
  { id: "pitch" as PRDFormat, label: "Pitch Summary", icon: Presentation, description: "One-page pitch deck" },
];

export default function PrdView() {
  const [, params] = useRoute("/prd/:id");
  const [, setLocation] = useLocation();
  const [project, setProject] = useState<ProjectWithConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<PRDFormat>("full");
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
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to load project");
      
      const data = await response.json();
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
      const response = await fetch(`/api/projects/${projectId}/generate-prd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      
      if (!response.ok) throw new Error("Failed to generate PRD");
      
      const data = await response.json();
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
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  if (isGenerating) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Generating Your PRD...</h2>
            <p className="text-muted-foreground">AI is crafting a comprehensive document from your conversation.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project.prdContent) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <FileText className="w-16 h-16 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">No PRD Generated Yet</h2>
            <p className="text-muted-foreground mb-4">Complete your conversation to generate a PRD</p>
            <Button onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/dashboard")}
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
                variant="outline"
                onClick={() => setLocation(`/conversation/${project.conversation.id}`)}
                data-testid="button-edit"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Format Selection */}
        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b">
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

        {/* PRD Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => <h1 className="text-4xl font-display font-bold mt-8 mb-4 text-foreground" {...props} />,
              h2: ({ ...props }) => <h2 className="text-3xl font-display font-bold mt-6 mb-3 text-foreground" {...props} />,
              h3: ({ ...props }) => <h3 className="text-2xl font-semibold mt-4 mb-2 text-foreground" {...props} />,
              p: ({ ...props }) => <p className="mb-4 leading-relaxed text-foreground/90" {...props} />,
              ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
              ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
              li: ({ ...props }) => <li className="text-foreground/90" {...props} />,
              strong: ({ ...props }) => <strong className="font-semibold text-foreground" {...props} />,
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {project.prdContent}
          </ReactMarkdown>
        </div>
      </div>
    </Layout>
  );
}
