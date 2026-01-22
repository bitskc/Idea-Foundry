import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, CheckCircle2, Loader2, Building2, Smartphone, Store, Bot, Globe, Cpu, Wand2, X, Lightbulb, AlertCircle, Shield, Swords, StickyNote, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type NameSuggestion = {
  name: string;
  tagline: string;
  style: string;
};

type StartMode = "idea" | "problem" | "quick";
type ConversationMode = "supportive" | "challenger";

const AUDIENCE_TYPES = [
  { id: "b2b_saas", label: "B2B SaaS", icon: Building2, description: "Enterprise software, tools for businesses" },
  { id: "b2c_mobile", label: "B2C Mobile App", icon: Smartphone, description: "Consumer apps, fitness, productivity" },
  { id: "marketplace", label: "Marketplace", icon: Store, description: "Two-sided platforms, gig economy" },
  { id: "ai_agent", label: "AI Agent / Automation", icon: Bot, description: "Custom GPTs, workflow automation" },
  { id: "consumer_web", label: "Consumer Web App", icon: Globe, description: "Social, news, entertainment" },
  { id: "hardware", label: "Hardware + Software", icon: Cpu, description: "IoT, connected devices" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [idea, setIdea] = useState("");
  const [startMode, setStartMode] = useState<StartMode>("idea");
  const [conversationMode, setConversationMode] = useState<ConversationMode>("supportive");
  const [step, setStep] = useState<"mode" | "input" | "type">("mode");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);
  const [showNamePanel, setShowNamePanel] = useState(false);
  const { toast } = useToast();

  const generateNames = async () => {
    if (idea.length < 10) {
      toast({
        variant: "destructive",
        title: "Need more details",
        description: "Please describe your idea first (at least 10 characters).",
      });
      return;
    }

    setIsGeneratingNames(true);
    setShowNamePanel(true);
    try {
      const response = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, type: selectedType }),
      });

      if (!response.ok) throw new Error("Failed to generate names");

      const data = await response.json();
      setNameSuggestions(data.names || []);
    } catch (error) {
      console.error("Error generating names:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate name suggestions.",
      });
    } finally {
      setIsGeneratingNames(false);
    }
  };

  const handleSelectMode = (mode: StartMode) => {
    setStartMode(mode);
    setStep("input");
  };

  const handleQuickCapture = async () => {
    if (idea.length < 10) {
      toast({
        variant: "destructive",
        title: "Idea too short",
        description: "Please describe your idea in at least 10 characters.",
      });
      return;
    }
    setStep("type");
  };

  const handleQuickStart = async () => {
    if (!selectedType) {
      toast({
        variant: "destructive",
        title: "Select a type",
        description: "Please select what type of product you're building.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/projects/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawIdea: idea, type: selectedType, notes: idea }),
      });

      if (!response.ok) throw new Error("Failed to capture idea");

      const project = await response.json();
      setLocation(`/idea/${project.id}`);
    } catch (error) {
      console.error("Error capturing idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to capture your idea. Please try again.",
      });
      setIsCreating(false);
    }
  };

  const handleContinue = () => {
    if (idea.length < 10) {
      toast({
        variant: "destructive",
        title: startMode === "idea" ? "Idea too short" : "Problem too short",
        description: `Please describe your ${startMode} in at least 10 characters.`,
      });
      return;
    }
    setStep("type");
  };

  const handleStart = async () => {
    if (!selectedType) {
      toast({
        variant: "destructive",
        title: "Select a type",
        description: "Please select what type of product you're building.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawIdea: idea, type: selectedType, startMode, conversationMode }),
      });

      if (!response.ok) throw new Error("Failed to start idea session");

      const project = await response.json();
      setLocation(`/conversation/${project.conversation.id}`);
    } catch (error) {
      console.error("Error starting idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start your idea session. Please try again.",
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
            IF
          </div>
          Idea Foundry
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>My Ideas</Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 container mx-auto px-6 flex flex-col md:flex-row items-center gap-12 relative z-10">
        <div className="flex-1 max-w-2xl pt-10 md:pt-0">
          <AnimatePresence mode="wait">
            {step === "mode" ? (
              <motion.div
                key="mode-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered Product Manager
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6">
                  Turn your <span className="text-gradient">Vision</span> into a <span className="text-primary">Plan</span>.
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Whether you have a solution in mind or just see a problem worth solving—Idea Foundry helps you vet, refine, and transform ideas into actionable plans.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={() => handleSelectMode("idea")}
                    className="group p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    data-testid="mode-idea"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">Explore with AI</h3>
                    <p className="text-sm text-muted-foreground">
                      Start a conversation to explore, refine, and validate your idea with AI guidance.
                    </p>
                  </button>

                  <button
                    onClick={() => handleSelectMode("quick")}
                    className="group p-6 rounded-2xl border-2 border-border bg-card hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all text-left"
                    data-testid="mode-quick"
                  >
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
                      <StickyNote className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">Quick Capture</h3>
                    <p className="text-sm text-muted-foreground">
                      Just jot down your idea for later. No AI conversation - marinate on it first.
                    </p>
                  </button>
                </div>

                <button
                  onClick={() => handleSelectMode("problem")}
                  className="group w-full p-4 rounded-xl border-2 border-border bg-card hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left flex items-center gap-4"
                  data-testid="mode-problem"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors shrink-0">
                    <AlertCircle className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold">Start with a Problem</h3>
                    <p className="text-sm text-muted-foreground">
                      Spotted a pain point? Brainstorm solutions together.
                    </p>
                  </div>
                </button>

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
              </motion.div>
            ) : step === "input" ? (
              <motion.div
                key="input-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Button 
                  variant="ghost" 
                  onClick={() => setStep("mode")} 
                  className="mb-4 -ml-2"
                  data-testid="button-back-to-mode"
                >
                  Back
                </Button>

                {startMode === "idea" ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                      <Lightbulb className="w-3 h-3" />
                      Starting with an Idea
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                      What's your product idea?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Describe your vision. We'll help you turn it into a complete PRD.
                    </p>
                  </>
                ) : startMode === "quick" ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium mb-4">
                      <StickyNote className="w-3 h-3" />
                      Quick Capture
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                      Capture your idea
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Jot it down quickly. You can explore it with AI later when you're ready.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-medium mb-4">
                      <AlertCircle className="w-3 h-3" />
                      Starting with a Problem
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                      What problem have you spotted?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Describe the pain point. We'll brainstorm solutions and explore profitable opportunities.
                    </p>
                  </>
                )}

                <div className="bg-card border border-border/50 shadow-xl rounded-2xl p-2 relative overflow-hidden group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                  <Textarea 
                    placeholder={startMode === "idea" 
                      ? "Describe your idea... (e.g., 'A mobile app that helps contractors manage schedules and get paid faster')"
                      : startMode === "quick"
                      ? "Jot down your idea... (e.g., 'SaaS for meal prep planning with AI-generated shopping lists')"
                      : "Describe the problem... (e.g., 'Small business owners waste 10+ hours a week on invoicing and chasing payments')"
                    }
                    className="resize-none border-none shadow-none focus-visible:ring-0 text-lg min-h-[120px] bg-transparent p-4"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    disabled={isCreating}
                    data-testid="input-idea"
                  />
                  <div className="flex justify-between items-center px-2 pb-2 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground px-2">
                        {idea.length}/10 min chars
                      </span>
                      {startMode === "idea" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateNames}
                          disabled={idea.length < 10 || isGeneratingNames}
                          className="text-xs gap-1 h-7"
                          data-testid="button-generate-names"
                        >
                          {isGeneratingNames ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3" />
                          )}
                          Suggest Names
                        </Button>
                      )}
                    </div>
                    <Button 
                      size="lg" 
                      className="gap-2 rounded-xl transition-all"
                      disabled={idea.length < 10}
                      onClick={handleContinue}
                      data-testid="button-continue"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Name Suggestions Panel */}
                <AnimatePresence>
                  {showNamePanel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 bg-card border border-border/50 rounded-xl p-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Wand2 className="w-4 h-4 text-primary" />
                          Name Suggestions
                        </h3>
                        <button 
                          onClick={() => setShowNamePanel(false)}
                          className="text-muted-foreground hover:text-foreground"
                          data-testid="button-close-names"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {isGeneratingNames ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="ml-2 text-muted-foreground">Generating creative names...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {nameSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                navigator.clipboard.writeText(suggestion.name);
                                toast({
                                  title: "Copied!",
                                  description: `"${suggestion.name}" copied to clipboard`,
                                });
                              }}
                              className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                              data-testid={`name-suggestion-${index}`}
                            >
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {suggestion.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {suggestion.tagline}
                              </div>
                              <div className="text-[10px] text-muted-foreground/60 mt-1 capitalize">
                                {suggestion.style}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {!isGeneratingNames && nameSuggestions.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          Click a name to copy it
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

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
              </motion.div>
            ) : (
              <motion.div
                key="type-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Button 
                  variant="ghost" 
                  onClick={() => setStep("input")} 
                  className="mb-4 -ml-2"
                  data-testid="button-back"
                >
                  Back
                </Button>
                
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                  What are you building?
                </h2>
                <p className="text-muted-foreground mb-8">
                  This helps Idea Foundry ask the right questions for your product type.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {AUDIENCE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`
                          flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                          ${isSelected 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50 bg-card"}
                        `}
                        data-testid={`type-${type.id}`}
                      >
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                          ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Conversation Mode Toggle - only for AI exploration modes */}
                {startMode !== "quick" && (
                <div className="mb-8 p-4 rounded-xl bg-card border border-border">
                  <div className="text-sm font-medium mb-3">Choose your AI personality:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConversationMode("supportive")}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all
                        ${conversationMode === "supportive" 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/30"}
                      `}
                      data-testid="mode-supportive"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${conversationMode === "supportive" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Supportive</div>
                        <div className="text-xs text-muted-foreground">Build & refine together</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setConversationMode("challenger")}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all
                        ${conversationMode === "challenger" 
                          ? "border-orange-500 bg-orange-500/10" 
                          : "border-border hover:border-orange-500/30"}
                      `}
                      data-testid="mode-challenger"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${conversationMode === "challenger" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>
                        <Swords className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Challenger</div>
                        <div className="text-xs text-muted-foreground">Devil's advocate mode</div>
                      </div>
                    </button>
                  </div>
                  {conversationMode === "challenger" && (
                    <p className="text-xs text-orange-500/80 mt-3">
                      Challenger mode will push back on your ideas, surface competition, and stress-test your thinking.
                    </p>
                  )}
                </div>
                )}

                <Button 
                  size="lg" 
                  className="gap-2 rounded-xl w-full sm:w-auto"
                  disabled={!selectedType || isCreating}
                  onClick={startMode === "quick" ? handleQuickStart : handleStart}
                  data-testid="button-start"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {startMode === "quick" ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {startMode === "quick" ? (
                        <>
                          <StickyNote className="w-4 h-4" /> Capture Idea
                        </>
                      ) : (
                        <>
                          Start Exploring <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
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
