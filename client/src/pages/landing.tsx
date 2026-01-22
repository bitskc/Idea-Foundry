import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Lightbulb, 
  Target, 
  FileText, 
  TrendingUp, 
  Users, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Brain,
  Rocket
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Idea Foundry</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/app")}>
              Sign In
            </Button>
            <Button onClick={() => setLocation("/app")}>
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Shape Your Ideas Into Reality
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 max-w-4xl mx-auto leading-tight">
          From Raw Idea to{" "}
          <span className="text-primary">Dev-Ready PRD</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Capture ideas quickly, validate with AI-powered research, and generate comprehensive specs that any developer or AI can implement.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="gap-2 text-lg px-8" onClick={() => setLocation("/app")}>
            Start Free <ArrowRight className="w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
            Watch Demo
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-6">
          No credit card required. Free forever for personal use.
        </p>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Everything You Need to Validate Ideas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop second-guessing. Get AI-powered insights, competitor analysis, and actionable specs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Exploration</h3>
            <p className="text-muted-foreground">
              Have deep conversations with AI to refine your idea, challenge assumptions, and uncover blind spots.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Competitor Research</h3>
            <p className="text-muted-foreground">
              Automatically discover competitors, analyze their strengths and weaknesses, and find your unique angle.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Viability Scoring</h3>
            <p className="text-muted-foreground">
              Get honest assessments of market size, competition, effort required, and profit potential.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Quick Capture</h3>
            <p className="text-muted-foreground">
              Jot down ideas instantly without pressure. Let them marinate until you're ready to explore.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dev-Ready PRDs</h3>
            <p className="text-muted-foreground">
              Generate comprehensive specs with API definitions, database schemas, and implementation guides.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Ready Output</h3>
            <p className="text-muted-foreground">
              PRDs detailed enough that even free AI models like Haiku can implement your vision accurately.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps from idea to implementation-ready specs
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Capture</h3>
            <p className="text-muted-foreground">
              Quickly jot down your idea or dive into an AI conversation to explore it deeper.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Validate</h3>
            <p className="text-muted-foreground">
              Get competitor research, viability scores, and key insights to make informed decisions.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Build</h3>
            <p className="text-muted-foreground">
              Generate a comprehensive PRD and hand it off to developers or AI coding assistants.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-20 border-t border-border/40" id="pricing">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you need more
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 rounded-2xl border border-border bg-card">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <p className="text-muted-foreground mb-4">Perfect for getting started</p>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Up to 5 ideas</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Basic AI conversations</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Quick PRD generation</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Community support</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/app")}>
              Get Started
            </Button>
          </div>
          
          {/* Pro Plan */}
          <div className="p-8 rounded-2xl border-2 border-primary bg-card relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-muted-foreground mb-4">For serious founders</p>
            <div className="text-4xl font-bold mb-6">$19<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Unlimited ideas</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Advanced AI exploration</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Competitor research</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Production-level PRDs</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Priority support</span>
              </li>
            </ul>
            <Button className="w-full" onClick={() => setLocation("/app")}>
              Start Pro Trial
            </Button>
          </div>
          
          {/* Team Plan */}
          <div className="p-8 rounded-2xl border border-border bg-card">
            <h3 className="text-xl font-semibold mb-2">Team</h3>
            <p className="text-muted-foreground mb-4">For growing teams</p>
            <div className="text-4xl font-bold mb-6">$49<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Up to 5 team members</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Shared idea workspace</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Team collaboration</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Dedicated support</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/app")}>
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Shape Your Next Big Idea?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of founders who've turned rough ideas into validated, buildable products.
          </p>
          <Button size="lg" className="gap-2 text-lg px-8" onClick={() => setLocation("/app")}>
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl">Idea Foundry</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Shape your ideas into reality with AI-powered validation and dev-ready specs.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Changelog</a></li>
                <li><a href="#" className="hover:text-foreground">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Idea Foundry. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Users className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Zap className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
