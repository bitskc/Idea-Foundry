import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getAppUrl } from "@/lib/routing";
import {
  Lightbulb,
  Target,
  FileText,
  TrendingUp,
  Zap,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Brain,
  Rocket,
  Twitter,
  Linkedin,
  Mail,
  Github
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleGetStarted = () => {
    const appUrl = getAppUrl();
    if (appUrl.startsWith('http')) {
      window.location.href = appUrl;
    } else {
      setLocation(appUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4" aria-label="Main navigation">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center gap-2" aria-label="Idea Foundry Home">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="font-display font-bold text-xl">Idea Foundry</span>
            </a>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/bitskc/Idea-Foundry" target="_blank" rel="noopener noreferrer" aria-label="View source on GitHub" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" aria-hidden="true" />
              </a>
              <Button variant="ghost" onClick={handleGetStarted} data-testid="button-signin">
                Sign In
              </Button>
              <Button onClick={handleGetStarted} data-testid="button-get-started">
                Get Started Free
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-6 py-20 md:py-32 text-center" aria-labelledby="hero-heading">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            AI-Powered Idea Validation for Founders
          </div>
          <h1 id="hero-heading" className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 max-w-4xl mx-auto leading-tight">
            From Raw Idea to{" "}
            <span className="text-primary">Dev-Ready PRD</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Capture ideas quickly, validate with AI-powered competitor research, and generate comprehensive product specs that any developer or AI can implement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2 text-lg px-8" onClick={handleGetStarted} data-testid="button-cta-primary">
              Start Free <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-lg px-8" data-testid="button-watch-demo">
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required. Free forever for personal use.
          </p>
        </section>

        <section id="features" className="container mx-auto px-6 py-20 border-t border-border/40" aria-labelledby="features-heading">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need to Validate Startup Ideas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop second-guessing. Get AI-powered market insights, competitor analysis, and actionable product specifications.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <article className="p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Exploration</h3>
              <p className="text-muted-foreground">
                Have deep conversations with AI to refine your idea, challenge assumptions, and uncover blind spots before you build.
              </p>
            </article>
            
            <article className="p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-green-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Competitor Research</h3>
              <p className="text-muted-foreground">
                Automatically discover competitors, analyze their strengths and weaknesses, and find your unique market angle.
              </p>
            </article>
            
            <article className="p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Viability Scoring</h3>
              <p className="text-muted-foreground">
                Get honest assessments of market size, competition intensity, effort required, and profit potential with a 1-10 score.
              </p>
            </article>
            
            <article className="p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Capture</h3>
              <p className="text-muted-foreground">
                Jot down ideas instantly without pressure. Let them marinate until you're ready to explore with AI assistance.
              </p>
            </article>
            
            <article className="p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dev-Ready PRDs</h3>
              <p className="text-muted-foreground">
                Generate comprehensive product specs with API definitions, database schemas, and implementation guides.
              </p>
            </article>
            
            <article className="p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-orange-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Ready Output</h3>
              <p className="text-muted-foreground">
                PRDs detailed enough that even free AI coding assistants like Claude Haiku can implement your vision accurately.
              </p>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="container mx-auto px-6 py-20 border-t border-border/40" aria-labelledby="how-it-works-heading">
          <div className="text-center mb-16">
            <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-display font-bold mb-4">
              How Idea Foundry Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps from raw idea to implementation-ready specifications
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary" aria-hidden="true">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Capture Your Idea</h3>
              <p className="text-muted-foreground">
                Quickly jot down your startup idea or dive into an AI conversation to explore and develop it further.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary" aria-hidden="true">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Validate the Market</h3>
              <p className="text-muted-foreground">
                Get automated competitor research, viability scores, and key insights to make informed business decisions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary" aria-hidden="true">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Build with Confidence</h3>
              <p className="text-muted-foreground">
                Generate a comprehensive PRD and hand it off to developers or AI coding assistants to start building.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="container mx-auto px-6 py-20 border-t border-border/40" aria-labelledby="pricing-heading">
          <div className="text-center mb-16">
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-display font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, upgrade when you need more power
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <article className="p-8 rounded-2xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-muted-foreground mb-4">Bring your own AI key</p>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8" role="list">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>2 ideas per month</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Use your own Claude API key</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>AI-powered conversations</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Basic PRD generation</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="w-4 h-4 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                  <span>Competitor market analysis</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="w-4 h-4 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                  <span>Viability scoring</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="w-4 h-4 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                  <span>Production-level PRDs</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={handleGetStarted} data-testid="button-pricing-free">
                Get Started Free
              </Button>
            </article>
            
            <article className="p-8 rounded-2xl border-2 border-primary bg-card relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                Best Value
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-muted-foreground mb-4">For serious founders</p>
              <div className="text-4xl font-bold mb-6">$15<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8" role="list">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Unlimited ideas</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Included AI credits each month</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>BYOK option for extra usage</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Competitor market analysis (CMA)</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Viability scoring</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Production-level PRDs</span>
                </li>
              </ul>
              <Button className="w-full" onClick={handleGetStarted} data-testid="button-pricing-pro">
                Start 7-Day Free Trial
              </Button>
            </article>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20" aria-labelledby="cta-heading">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-12 text-center">
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Validate Your Next Big Idea?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of founders who've turned rough ideas into validated, buildable products.
            </p>
            <Button size="lg" className="gap-2 text-lg px-8" onClick={handleGetStarted} data-testid="button-cta-final">
              Get Started Free <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-12" role="contentinfo">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <a href="/" className="flex items-center gap-2 mb-4" aria-label="Idea Foundry Home">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <span className="font-display font-bold text-xl">Idea Foundry</span>
              </a>
              <p className="text-sm text-muted-foreground">
                AI-powered idea validation platform for founders. Turn raw ideas into dev-ready product specs.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Idea Foundry. All rights reserved.
            </p>
            <div className="flex items-center gap-4" aria-label="Social media links">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="mailto:hello@ideafoundry.app" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Email">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
