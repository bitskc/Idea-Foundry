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
  Target
} from "lucide-react";
import { api } from "@/lib/api";

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
      const data = await api.post<{ id: number }>("/api/projects/quick", { 
        rawIdea: idea, 
        type: selectedType, 
        notes: idea,
        targetAvatar: avatar.role ? avatar : null,
      });
      toast({ title: "Idea captured!", description: "You can explore it whenever you're ready." });
      setLocation(`/app/ideas/${data.id}`);
    } catch (error) {
      console.error("Error saving idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your idea. Please try again.",
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
      const data = await api.post<{ conversation: { id: number } }>("/api/projects", { 
        rawIdea: idea, 
        type: selectedType, 
        startMode,
        conversationMode: "supportive",
        targetAvatar: avatar,
        ideaPurpose,
        discoveryPath,
      });
      setLocation(`/app/conversation/${data.conversation.id}`);
    } catch (error) {
      console.error("Error creating idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create your idea. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const isB2B = selectedType === "B2B SaaS" || selectedType === "Marketplace";

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
                onClick={handleTypeSelected}
                disabled={!selectedType || isCreating}
                className="w-full"
                size="lg"
              >
                {startMode === "quick" ? (
                  isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <StickyNote className="w-4 h-4 mr-2" />
                      Capture Idea
                    </>
                  )
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === "purpose" && (
            <motion.div
              key="purpose-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Button variant="ghost" onClick={() => setStep("type")} className="mb-4 -ml-2">
                Back
              </Button>

              <h2 className="text-2xl font-display font-bold mb-2">What's the purpose?</h2>
              <p className="text-muted-foreground mb-6">This helps us focus on what matters most for your situation.</p>

              <div className="space-y-3">
                <button
                  onClick={() => handlePurposeSelected("monetize")}
                  className="group w-full p-5 rounded-xl border-2 border-border bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-all text-left"
                  data-testid="purpose-monetize"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">💰</div>
                    <div>
                      <h3 className="font-semibold mb-1">Build a business</h3>
                      <p className="text-sm text-muted-foreground">
                        I want to make money from this - sell it to customers
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePurposeSelected("internal")}
                  className="group w-full p-5 rounded-xl border-2 border-border bg-card hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
                  data-testid="purpose-internal"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">🏢</div>
                    <div>
                      <h3 className="font-semibold mb-1">Internal tool or feature</h3>
                      <p className="text-sm text-muted-foreground">
                        For my team, company, or an existing product
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePurposeSelected("personal")}
                  className="group w-full p-5 rounded-xl border-2 border-border bg-card hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left"
                  data-testid="purpose-personal"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">🧪</div>
                    <div>
                      <h3 className="font-semibold mb-1">Personal project</h3>
                      <p className="text-sm text-muted-foreground">
                        Just for me, learning, or experimenting
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "discovery" && (
            <motion.div
              key="discovery-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Button variant="ghost" onClick={() => setStep("purpose")} className="mb-4 -ml-2">
                Back
              </Button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium mb-4">
                <Sparkles className="w-3 h-3" />
                Building a Business
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Where do you want to start?</h2>
              <p className="text-muted-foreground mb-6">
                Choose your approach to finding product-market fit.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleDiscoverySelected("audience_first")}
                  className="group w-full p-6 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  data-testid="discovery-audience"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">I have an existing audience</h3>
                      <p className="text-sm text-muted-foreground">
                        Email list, social following, community, or existing customers. Let's build something they'll buy.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDiscoverySelected("idea_first")}
                  className="group w-full p-6 rounded-xl border-2 border-border bg-card hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left"
                  data-testid="discovery-idea"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <Lightbulb className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">I'm starting with the idea</h3>
                      <p className="text-sm text-muted-foreground">
                        Let's figure out who would pay for this and how to position it for maximum impact.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "avatar" && (
            <motion.div
              key="avatar-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Button variant="ghost" onClick={() => setStep(ideaPurpose === "monetize" ? "discovery" : "purpose")} className="mb-4 -ml-2">
                Back
              </Button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-medium mb-4">
                <Target className="w-3 h-3" />
                Define Your Customer
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Who are you building for?</h2>
              <p className="text-muted-foreground mb-6">
                The more specific your target customer, the better your MVP and marketing will be.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Who is your ideal customer? <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder={isB2B 
                      ? "e.g., Marketing managers at mid-sized e-commerce companies" 
                      : "e.g., Busy parents who meal prep on weekends"
                    }
                    value={avatar.role}
                    onChange={(e) => setAvatar({ ...avatar, role: e.target.value })}
                    data-testid="input-avatar-role"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Be specific: job title, life situation, or defining characteristic
                  </p>
                </div>

                {isB2B && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        What industry are they in?
                      </label>
                      <Input
                        placeholder="e.g., E-commerce, Healthcare, Construction"
                        value={avatar.industry}
                        onChange={(e) => setAvatar({ ...avatar, industry: e.target.value })}
                        data-testid="input-avatar-industry"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Company size
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {COMPANY_SIZES.filter(s => s.id !== "consumer").map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setAvatar({ ...avatar, companySize: size.id })}
                            className={`p-2 text-sm rounded-lg border transition-all ${
                              avatar.companySize === size.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`size-${size.id}`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    What's their biggest pain point? <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder={isB2B 
                      ? "e.g., They spend 10+ hours/week manually updating spreadsheets and can't get real-time data"
                      : "e.g., They don't have time to plan healthy meals and end up ordering takeout"
                    }
                    value={avatar.painPoints}
                    onChange={(e) => setAvatar({ ...avatar, painPoints: e.target.value })}
                    className="min-h-[80px]"
                    data-testid="input-avatar-pain"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    What does success look like for them?
                  </label>
                  <Textarea
                    placeholder={isB2B 
                      ? "e.g., Save 5+ hours/week, reduce errors by 90%, impress their boss with real-time dashboards"
                      : "e.g., Eat healthier, save money on food, spend more time with family"
                    }
                    value={avatar.goals}
                    onChange={(e) => setAvatar({ ...avatar, goals: e.target.value })}
                    className="min-h-[80px]"
                    data-testid="input-avatar-goals"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    How do they solve this problem today?
                  </label>
                  <Input
                    placeholder="e.g., Excel spreadsheets, a competitor product, or doing it manually"
                    value={avatar.currentSolution}
                    onChange={(e) => setAvatar({ ...avatar, currentSolution: e.target.value })}
                    data-testid="input-avatar-current"
                  />
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={!avatar.role || !avatar.painPoints || isCreating}
                className="w-full mt-8"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
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
