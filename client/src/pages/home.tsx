import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [idea, setIdea] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleStart = async () => {
    if (idea.length < 10) {
      toast({
        variant: "destructive",
        title: "Idea too short",
        description: "Please describe your idea in at least 10 characters.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawIdea: idea }),
      });

      if (!response.ok) throw new Error("Failed to create project");

      const project = await response.json();
      setLocation(`/conversation/${project.conversation.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Nav */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 font-display font-bold text-2xl text-primary">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-sm">
            V
          </div>
          VibePlan
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>Dashboard</Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 container mx-auto px-6 flex flex-col md:flex-row items-center gap-12 relative z-10">
        <div className="flex-1 max-w-2xl pt-10 md:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              AI-Powered Product Manager
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6">
              Turn your <span className="text-gradient">Idea</span> into a <span className="text-primary">Plan</span>.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Don't let your ideas die in the notes app. VibePlan interviews you to create a comprehensive, dev-ready PRD in minutes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card border border-border/50 shadow-xl rounded-2xl p-2 relative overflow-hidden group focus-within:ring-2 focus-within:ring-primary/50 transition-all"
          >
            <Textarea 
              placeholder="Describe your idea... (e.g., 'A mobile app that helps contractors manage schedules and get paid faster')" 
              className="resize-none border-none shadow-none focus-visible:ring-0 text-lg min-h-[120px] bg-transparent p-4"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={isCreating}
              data-testid="input-idea"
            />
            <div className="flex justify-between items-center px-2 pb-2 mt-2">
              <span className="text-xs text-muted-foreground px-2">
                {idea.length}/10 min chars
              </span>
              <Button 
                size="lg" 
                className="gap-2 rounded-xl transition-all"
                disabled={idea.length < 10 || isCreating}
                onClick={handleStart}
                data-testid="button-start"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Start Building <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Dev-Ready Specs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Market Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Free to Start</span>
            </div>
          </div>
        </div>

        {/* Hero Image/Graphic */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="flex-1 relative hidden md:block"
        >
          <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 aspect-square">
             <img 
               src="/assets/hero-graphic.png" 
               alt="AI Planning Visualization" 
               className="w-full h-full object-cover opacity-90"
             />
             {/* Floating UI Elements Overlay */}
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
               className="absolute top-10 right-10 bg-background/90 backdrop-blur border shadow-lg p-4 rounded-xl max-w-[200px]"
             >
                <div className="h-2 w-12 bg-primary/20 rounded mb-2" />
                <div className="h-2 w-full bg-muted rounded mb-1" />
                <div className="h-2 w-2/3 bg-muted rounded" />
             </motion.div>
             <motion.div 
               animate={{ y: [0, 15, 0] }}
               transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
               className="absolute bottom-20 left-10 bg-background/90 backdrop-blur border shadow-lg p-4 rounded-xl flex items-center gap-3"
             >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Market Validated</div>
                  <div className="text-[10px] text-muted-foreground">Score: 94/100</div>
                </div>
             </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
