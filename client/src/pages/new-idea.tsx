import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb,
  StickyNote,
  AlertCircle,
  MessageSquare,
  Loader2,
  ArrowRight,
  Sparkles
} from "lucide-react";

type StartMode = "idea" | "quick" | "problem";

const AUDIENCE_TYPES = [
  { id: "B2B SaaS", label: "B2B SaaS", icon: "💼", description: "Software for businesses" },
  { id: "B2C App", label: "Consumer App", icon: "📱", description: "Apps for end users" },
  { id: "Marketplace", label: "Marketplace", icon: "🏪", description: "Two-sided platforms" },
  { id: "Creator Tool", label: "Creator Tool", icon: "🎨", description: "For content creators" },
  { id: "AI/ML", label: "AI Product", icon: "🤖", description: "AI-powered solutions" },
  { id: "Other", label: "Other", icon: "✨", description: "Something else" },
];

export default function NewIdea() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"mode" | "input" | "type">("mode");
  const [startMode, setStartMode] = useState<StartMode>("idea");
  const [idea, setIdea] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectMode = (mode: StartMode) => {
    setStartMode(mode);
    setStep("input");
  };

  const handleContinue = () => {
    if (idea.length < 10) {
      toast({
        variant: "destructive",
        title: "Too short",
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

      if (!response.ok) throw new Error("Failed to save idea");
      const data = await response.json();
      toast({ title: "Idea captured!", description: "You can explore it whenever you're ready." });
      setLocation(`/app/ideas/${data.id}`);
    } catch (error) {
      console.error("Error saving idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your idea. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
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
        body: JSON.stringify({ 
          rawIdea: idea, 
          type: selectedType, 
          startMode,
          conversationMode: "supportive"
        }),
      });

      if (!response.ok) throw new Error("Failed to create idea");
      const data = await response.json();
      setLocation(`/app/conversation/${data.conversation.id}`);
    } catch (error) {
      console.error("Error creating idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create your idea. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppLayout showBackButton backTo="/app">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          {step === "mode" && (
            <motion.div
              key="mode-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-display font-bold mb-2">
                Start a New Idea
              </h1>
              <p className="text-muted-foreground mb-8">
                Choose how you want to begin
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleSelectMode("idea")}
                  className="group w-full p-6 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  data-testid="mode-idea"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Explore with AI</h3>
                      <p className="text-sm text-muted-foreground">
                        Have a conversation to develop your idea, get feedback, and build a PRD
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectMode("quick")}
                  className="group w-full p-6 rounded-xl border-2 border-border bg-card hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all text-left"
                  data-testid="mode-quick"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                      <StickyNote className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Quick Capture</h3>
                      <p className="text-sm text-muted-foreground">
                        Jot it down for later. No AI conversation - marinate on it first
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectMode("problem")}
                  className="group w-full p-6 rounded-xl border-2 border-border bg-card hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left"
                  data-testid="mode-problem"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <AlertCircle className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Start with a Problem</h3>
                      <p className="text-sm text-muted-foreground">
                        Spotted a pain point? Brainstorm solutions together
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "input" && (
            <motion.div
              key="input-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Button variant="ghost" onClick={() => setStep("mode")} className="mb-4 -ml-2">
                Back
              </Button>

              {startMode === "idea" ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                    <Lightbulb className="w-3 h-3" />
                    Explore with AI
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">What's your product idea?</h2>
                  <p className="text-muted-foreground mb-6">Describe your vision and we'll explore it together.</p>
                </>
              ) : startMode === "quick" ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium mb-4">
                    <StickyNote className="w-3 h-3" />
                    Quick Capture
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">Capture your idea</h2>
                  <p className="text-muted-foreground mb-6">Jot it down quickly. Explore with AI whenever you're ready.</p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-medium mb-4">
                    <AlertCircle className="w-3 h-3" />
                    Start with a Problem
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">What problem have you spotted?</h2>
                  <p className="text-muted-foreground mb-6">Describe the pain point and we'll brainstorm solutions.</p>
                </>
              )}

              <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <Textarea
                  placeholder={
                    startMode === "idea"
                      ? "e.g., A mobile app that helps contractors manage schedules and get paid faster..."
                      : startMode === "quick"
                      ? "e.g., SaaS for meal prep planning with AI-generated shopping lists..."
                      : "e.g., Small business owners waste 10+ hours a week on invoicing..."
                  }
                  className="resize-none border-none shadow-none focus-visible:ring-0 text-base min-h-[120px] bg-transparent p-0"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  disabled={isCreating}
                  data-testid="input-idea"
                />
                <div className="text-xs text-muted-foreground mt-2">
                  {idea.length}/10 min characters
                </div>
              </div>

              <Button 
                onClick={handleContinue}
                disabled={idea.length < 10}
                className="w-full"
                size="lg"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === "type" && (
            <motion.div
              key="type-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Button variant="ghost" onClick={() => setStep("input")} className="mb-4 -ml-2">
                Back
              </Button>

              <h2 className="text-2xl font-display font-bold mb-2">What type of product?</h2>
              <p className="text-muted-foreground mb-6">This helps us ask the right questions.</p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {AUDIENCE_TYPES.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`type-${type.id}`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={startMode === "quick" ? handleQuickStart : handleStart}
                disabled={!selectedType || isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {startMode === "quick" ? "Saving..." : "Creating..."}
                  </>
                ) : startMode === "quick" ? (
                  <>
                    <StickyNote className="w-4 h-4 mr-2" />
                    Capture Idea
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Exploring
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
