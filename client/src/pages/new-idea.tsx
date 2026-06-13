import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb,
  StickyNote,
  AlertCircle,
  MessageSquare,
  Loader2,
  ArrowRight,
  Sparkles,
  Users,
  Target,
  Flame,
  ChevronLeft
} from "lucide-react";

type StartMode = "idea" | "quick" | "problem";
type DiscoveryPath = "idea_first" | "audience_first";
type IdeaPurpose = "monetize" | "internal" | "personal";

interface TargetAvatar {
  role: string;
  industry: string;
  companySize: string;
  painPoints: string;
  goals: string;
  currentSolution: string;
}

const AUDIENCE_TYPES = [
  { id: "B2B SaaS", label: "B2B SaaS", icon: "💼", description: "Software for businesses" },
  { id: "B2C App", label: "Consumer App", icon: "📱", description: "Apps for end users" },
  { id: "Marketplace", label: "Marketplace", icon: "🏪", description: "Two-sided platforms" },
  { id: "Creator Tool", label: "Creator Tool", icon: "🎨", description: "For content creators" },
  { id: "AI/ML", label: "AI Product", icon: "🤖", description: "AI-powered solutions" },
  { id: "Other", label: "Other", icon: "✨", description: "Something else" },
];

const COMPANY_SIZES = [
  { id: "solo", label: "Solo / Freelancer" },
  { id: "small", label: "Small (2-10)" },
  { id: "medium", label: "Medium (11-50)" },
  { id: "large", label: "Large (51-200)" },
  { id: "enterprise", label: "Enterprise (200+)" },
  { id: "consumer", label: "Individual Consumer" },
];

const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: "easeOut" as const }
};

export default function NewIdea() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"mode" | "input" | "type" | "purpose" | "discovery" | "avatar">("mode");
  const [startMode, setStartMode] = useState<StartMode>("idea");
  const [idea, setIdea] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [ideaPurpose, setIdeaPurpose] = useState<IdeaPurpose>("monetize");
  const [discoveryPath, setDiscoveryPath] = useState<DiscoveryPath>("idea_first");
  
  const [avatar, setAvatar] = useState<TargetAvatar>({
    role: "",
    industry: "",
    companySize: "",
    painPoints: "",
    goals: "",
    currentSolution: "",
  });

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

  const handleTypeSelected = () => {
    if (!selectedType) {
      toast({
        variant: "destructive",
        title: "Select a type",
        description: "Please select what type of product you're building.",
      });
      return;
    }
    
    if (startMode === "quick") {
      handleQuickStart();
    } else {
      setStep("purpose");
    }
  };

  const handlePurposeSelected = (purpose: IdeaPurpose) => {
    setIdeaPurpose(purpose);
    if (purpose === "monetize") {
      setStep("discovery");
    } else {
      setStep("avatar");
    }
  };

  const handleDiscoverySelected = (path: DiscoveryPath) => {
    setDiscoveryPath(path);
    setStep("avatar");
  };

  const handleQuickStart = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/projects/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawIdea: idea, 
          type: selectedType, 
          notes: idea,
          targetAvatar: avatar.role ? avatar : null,
        }),
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
    if (!avatar.role || !avatar.painPoints) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please describe who you're building for and their main pain point.",
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
          conversationMode: "supportive",
          targetAvatar: avatar,
          ideaPurpose,
          discoveryPath,
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

  const isB2B = selectedType === "B2B SaaS" || selectedType === "Marketplace";

  return (
    <AppLayout showBackButton backTo="/app">
      <div className="container mx-auto px-6 py-10 max-w-3xl relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10" />
        
        <AnimatePresence mode="wait">
          {step === "mode" && (
            <motion.div {...slideUp} key="mode-step">
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-black mb-4 tracking-tight">
                  Start Forging
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                  Choose your approach to shape your next concept into reality.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleSelectMode("idea")}
                  className="group w-full p-6 md:p-8 rounded-3xl border-2 border-border/60 bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/10 hover:bg-primary/5 transition-all duration-300 text-left relative overflow-hidden"
                  data-testid="mode-idea"
                >
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
                      <MessageSquare className="w-7 h-7 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div className="pr-8">
                      <h3 className="text-xl font-display font-bold mb-2">Explore with AI Strategist</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Have a deep conversation to pressure-test your idea, get instant feedback, and output a dev-ready PRD.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectMode("problem")}
                  className="group w-full p-6 md:p-8 rounded-3xl border-2 border-border/60 bg-card hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 hover:bg-cyan-500/5 transition-all duration-300 text-left relative overflow-hidden"
                  data-testid="mode-problem"
                >
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                    <ArrowRight className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300 shrink-0">
                      <AlertCircle className="w-7 h-7 text-cyan-500 group-hover:text-white" />
                    </div>
                    <div className="pr-8">
                      <h3 className="text-xl font-display font-bold mb-2">Start with a Problem</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Spotted a pain point but no solution yet? We'll brainstorm together to find the right angle.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectMode("quick")}
                  className="group w-full p-6 md:p-8 rounded-3xl border-2 border-border/60 bg-card hover:border-yellow-500 hover:shadow-xl hover:shadow-yellow-500/10 hover:bg-yellow-500/5 transition-all duration-300 text-left relative overflow-hidden"
                  data-testid="mode-quick"
                >
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                    <ArrowRight className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-500 group-hover:text-white transition-all duration-300 shrink-0">
                      <StickyNote className="w-7 h-7 text-yellow-600 group-hover:text-white" />
                    </div>
                    <div className="pr-8">
                      <h3 className="text-xl font-display font-bold mb-2">Quick Capture</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Just jot down the spark of inspiration. Save it to your foundry and expand on it when you have more time.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "input" && (
            <motion.div {...slideUp} key="input-step">
              <Button variant="ghost" onClick={() => setStep("mode")} className="mb-6 -ml-3 font-semibold text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to choices
              </Button>

              <div className="mb-8">
                {startMode === "idea" ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wide uppercase mb-4">
                      <Lightbulb className="w-4 h-4" />
                      Explore with AI
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-black mb-3 tracking-tight">What's your product idea?</h2>
                    <p className="text-lg text-muted-foreground">Describe your vision and we'll forge it together.</p>
                  </>
                ) : startMode === "quick" ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 text-sm font-bold tracking-wide uppercase mb-4">
                      <StickyNote className="w-4 h-4" />
                      Quick Capture
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-black mb-3 tracking-tight">Capture the spark</h2>
                    <p className="text-lg text-muted-foreground">Jot it down quickly before you lose it.</p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 text-sm font-bold tracking-wide uppercase mb-4">
                      <AlertCircle className="w-4 h-4" />
                      Problem First
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-black mb-3 tracking-tight">What problem have you spotted?</h2>
                    <p className="text-lg text-muted-foreground">Describe the pain point and we'll brainstorm solutions.</p>
                  </>
                )}
              </div>

              <div className="bg-card/50 backdrop-blur-sm border-2 border-border/60 rounded-3xl p-6 mb-8 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
                <Textarea
                  placeholder={
                    startMode === "idea"
                      ? "e.g., A mobile app that helps contractors manage schedules and get paid faster..."
                      : startMode === "quick"
                      ? "e.g., SaaS for meal prep planning with AI-generated shopping lists..."
                      : "e.g., Small business owners waste 10+ hours a week on invoicing..."
                  }
                  className="resize-none border-none shadow-none focus-visible:ring-0 text-lg min-h-[200px] bg-transparent p-0 placeholder:text-muted-foreground/60 leading-relaxed"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  disabled={isCreating}
                  data-testid="input-idea"
                  autoFocus
                />
                <div className="flex justify-between items-center text-sm mt-4 pt-4 border-t border-border/40">
                  <span className="text-muted-foreground font-medium">Be as rough or detailed as you want.</span>
                  <span className={`font-semibold ${idea.length >= 10 ? "text-green-500" : "text-muted-foreground"}`}>
                    {idea.length}/10 min chars
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleContinue}
                disabled={idea.length < 10}
                className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all font-semibold"
                size="lg"
              >
                Continue <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === "type" && (
            <motion.div {...slideUp} key="type-step">
              <Button variant="ghost" onClick={() => setStep("input")} className="mb-6 -ml-3 font-semibold text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              <h2 className="text-3xl md:text-4xl font-display font-black mb-3 tracking-tight">What type of product?</h2>
              <p className="text-lg text-muted-foreground mb-8">This helps shape the market analysis and PRD structure.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {AUDIENCE_TYPES.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-6 rounded-3xl border-2 text-left transition-all duration-200 flex items-start gap-4 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]"
                          : "border-border/60 bg-card/50 hover:border-primary/50 hover:bg-card hover:shadow-md"
                      }`}
                      data-testid={`type-${type.id}`}
                    >
                      <div className="text-3xl mt-1">{type.icon}</div>
                      <div>
                        <div className="font-bold text-lg mb-1">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleTypeSelected}
                disabled={!selectedType || isCreating}
                className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all font-semibold"
                size="lg"
              >
                {startMode === "quick" ? (
                  isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Forging...
                    </>
                  ) : (
                    <>
                      <StickyNote className="w-5 h-5 mr-2" />
                      Save to Foundry
                    </>
                  )
                ) : (
                  <>
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === "purpose" && (
            <motion.div {...slideUp} key="purpose-step">
              <Button variant="ghost" onClick={() => setStep("type")} className="mb-6 -ml-3 font-semibold text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              <h2 className="text-3xl md:text-4xl font-display font-black mb-3 tracking-tight">What's the goal?</h2>
              <p className="text-lg text-muted-foreground mb-8">This focuses the AI on what matters most for your situation.</p>

              <div className="space-y-4">
                <button
                  onClick={() => handlePurposeSelected("monetize")}
                  className="group w-full p-6 md:p-8 rounded-3xl border-2 border-border/60 bg-card hover:border-green-500 hover:shadow-xl hover:shadow-green-500/10 hover:bg-green-500/5 transition-all duration-300 text-left relative overflow-hidden"
                  data-testid="purpose-monetize"
                >
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                    <ArrowRight className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-all duration-300 shrink-0">
                      💰
                    </div>
                    <div className="pr-8">
                      <h3 className="text-xl font-display font-bold mb-2">Build a Business</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        I want to validate market demand, analyze competitors, and build a profitable product.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePurposeSelected("internal")}
                  className="group w-full p-6 md:p-8 rounded-3xl border-2 border-border/60 bg-card hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 hover:bg-blue-500/5 transition-all duration-300 text-left relative overflow-hidden"
                  data-testid="purpose-internal"
                >
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                    <ArrowRight className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-all duration-300 shrink-0">
                      🏢
                    </div>
                    <div className="pr-8">
                      <h3 className="text-xl font-display font-bold mb-2">Internal Tool / Feature</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        I'm building this for an existing team, company, or as a feature for an existing product.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePurposeSelected("personal")}
                  className="group w-full p-6 md:p-8 rounded-3xl border-2 border-border/60 bg-card hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 hover:bg-purple-500/5 transition-all duration-300 text-left relative overflow-hidden"
                  data-testid="purpose-personal"
                >
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                    <ArrowRight className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-all duration-300 shrink-0">
                      🧪
                    </div>
                    <div className="pr-8">
                      <h3 className="text-xl font-display font-bold mb-2">Personal Project</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        I'm building this for myself, to learn a new technology, or just for fun.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "discovery" && (
            <motion.div {...slideUp} key="discovery-step">
              <Button variant="ghost" onClick={() => setStep("purpose")} className="mb-6 -ml-3 font-semibold text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-bold tracking-wide uppercase mb-4">
                <Sparkles className="w-4 h-4" />
                Business Focus
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black mb-3 tracking-tight">Your starting point?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                How are you approaching product-market fit?
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleDiscoverySelected("audience_first")}
                  className="group w-full p-6 md:p-8 rounded-3xl border-2 border-border/60 bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/10 hover:bg-primary/5 transition-all duration-300 text-left relative overflow-hidden"
                  data-testid="discovery-audience"
                >
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
                      <Users className="w-7 h-7 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div className="pr-8">
                      <h3 className="text-xl font-display font-bold mb-2">Audience First</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        I already have access to an audience (email list, community, existing customers) and want to build what they need.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDiscoverySelected("idea_first")}
                  className="group w-full p-6 md:p-8 rounded-3xl border-2 border-border/60 bg-card hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 hover:bg-cyan-500/5 transition-all duration-300 text-left relative overflow-hidden"
                  data-testid="discovery-idea"
                >
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                    <ArrowRight className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300 shrink-0">
                      <Lightbulb className="w-7 h-7 text-cyan-600 group-hover:text-white" />
                    </div>
                    <div className="pr-8">
                      <h3 className="text-xl font-display font-bold mb-2">Idea First</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        I have a specific concept or solution in mind, and need to figure out who needs it most and how to position it.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "avatar" && (
            <motion.div {...slideUp} key="avatar-step">
              <Button variant="ghost" onClick={() => setStep(ideaPurpose === "monetize" ? "discovery" : "purpose")} className="mb-6 -ml-3 font-semibold text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 text-sm font-bold tracking-wide uppercase mb-4">
                <Target className="w-4 h-4" />
                Target Customer
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black mb-3 tracking-tight">Who is this for?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                A sharp focus on the user makes the Forge much more accurate.
              </p>

              <div className="space-y-6 bg-card/50 backdrop-blur-sm border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm">
                <div>
                  <label className="block text-sm font-bold mb-2 tracking-tight">
                    <Users className="w-4 h-4 inline mr-2 text-primary" />
                    Who is your ideal customer? <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder={isB2B 
                      ? "e.g., Marketing managers at mid-sized e-commerce companies" 
                      : "e.g., Busy parents looking for healthy dinner options"
                    }
                    value={avatar.role}
                    onChange={(e) => setAvatar({ ...avatar, role: e.target.value })}
                    className="h-12 bg-background/50 border-border/60 text-base rounded-xl focus-visible:ring-primary/30"
                    data-testid="input-avatar-role"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 tracking-tight">
                    <AlertCircle className="w-4 h-4 inline mr-2 text-primary" />
                    What is their primary pain point? <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="What problem are they struggling with that your idea solves?"
                    value={avatar.painPoints}
                    onChange={(e) => setAvatar({ ...avatar, painPoints: e.target.value })}
                    className="min-h-[100px] resize-none bg-background/50 border-border/60 text-base rounded-xl focus-visible:ring-primary/30"
                    data-testid="input-avatar-pain"
                  />
                </div>

                <div className="pt-4 border-t border-border/40">
                  <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">Optional Details</p>
                  
                  {isB2B && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-muted-foreground">Industry</label>
                        <Input
                          placeholder="e.g., Healthcare, E-commerce"
                          value={avatar.industry}
                          onChange={(e) => setAvatar({ ...avatar, industry: e.target.value })}
                          className="bg-background/50 rounded-xl focus-visible:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-muted-foreground">Company Size</label>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={avatar.companySize}
                          onChange={(e) => setAvatar({ ...avatar, companySize: e.target.value })}
                        >
                          <option value="">Select size...</option>
                          {COMPANY_SIZES.map(size => (
                            <option key={size.id} value={size.id}>{size.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-muted-foreground">How do they solve this today?</label>
                    <Input
                      placeholder="e.g., Using messy Excel spreadsheets, hiring expensive agencies"
                      value={avatar.currentSolution}
                      onChange={(e) => setAvatar({ ...avatar, currentSolution: e.target.value })}
                      className="bg-background/50 rounded-xl focus-visible:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={handleStart}
                    disabled={isCreating || !avatar.role || !avatar.painPoints}
                    className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all font-semibold"
                    size="lg"
                    data-testid="button-start-forge"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Firing up the Forge...
                      </>
                    ) : (
                      <>
                        <Flame className="w-5 h-5 mr-2" />
                        Enter the Forge
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
