import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
  Flame
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4" aria-label="Main navigation">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center gap-3 group" aria-label="Idea Foundry Home">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                <Flame className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight">Idea Foundry</span>
            </a>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="hidden sm:flex font-semibold" onClick={() => setLocation("/app")} data-testid="button-signin">
                Sign In
              </Button>
              <Button className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" onClick={() => setLocation("/app")} data-testid="button-get-started">
                Get Started Free
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden" aria-labelledby="hero-heading">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full opacity-50" />
            <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-orange-500/10 blur-[100px] rounded-full opacity-30" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="text-left"
              >
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-bold tracking-wide uppercase mb-8">
                  <Flame className="w-4 h-4" aria-hidden="true" />
                  Forge your next big thing
                </motion.div>
                <motion.h1 variants={fadeIn} id="hero-heading" className="text-5xl md:text-7xl lg:text-8xl font-display font-black mb-8 leading-[1.05] tracking-tight">
                  From Raw Idea to <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Dev-Ready PRD</span>
                </motion.h1>
                <motion.p variants={fadeIn} className="text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                  A founder's workshop for forging half-formed ideas into validated, buildable plans. Pressure-test with AI, analyze competitors, and ship faster.
                </motion.p>
                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="h-14 gap-2 text-lg px-8 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all" onClick={() => setLocation("/app")} data-testid="button-cta-primary">
                    Start Forging Free <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 gap-2 text-lg px-8 border-2 hover:bg-muted/50 transition-all" data-testid="button-watch-demo">
                    Watch Demo
                  </Button>
                </motion.div>
                <motion.p variants={fadeIn} className="text-sm text-muted-foreground mt-6 font-medium">
                  No credit card required. Free forever for personal use.
                </motion.p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl blur-3xl" />
                <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl glass-panel">
                  <img 
                    src="/assets/hero-graphic.png" 
                    alt="Conceptual forge with flying sparks" 
                    className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-6 py-24 md:py-32 border-t border-border/40" aria-labelledby="features-heading">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2 variants={fadeIn} id="features-heading" className="text-4xl md:text-5xl font-display font-black mb-6 tracking-tight">
              The Founder's Toolkit
            </motion.h2>
            <motion.p variants={fadeIn} className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Stop second-guessing. Get AI-powered market insights, competitor analysis, and actionable product specifications in minutes.
            </motion.p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: Brain, color: "text-primary", bg: "bg-primary/10", title: "Pressure-Test with AI", desc: "Have deep, challenging conversations with an AI strategist to refine your idea and uncover blind spots before writing a line of code." },
              { icon: Target, color: "text-orange-500", bg: "bg-orange-500/10", title: "Competitor Research", desc: "Automatically discover market players, analyze their strengths and weaknesses, and carve out your unique positioning." },
              { icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10", title: "Viability Scoring", desc: "Get brutally honest assessments of market size, competition intensity, effort required, and realistic profit potential." },
              { icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-500/10", title: "Quick Capture", desc: "Jot down sparks of inspiration instantly without pressure. Let them marinate in your foundry until you're ready to explore." },
              { icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10", title: "Dev-Ready PRDs", desc: "Generate comprehensive, structured product specs complete with API definitions, database schemas, and implementation steps." },
              { icon: Rocket, color: "text-rose-500", bg: "bg-rose-500/10", title: "Validation Tools", desc: "Generate instant 'coming soon' landing pages and find the exact Reddit and Discord communities where your users hang out." }
            ].map((feature, idx) => (
              <motion.article key={idx} variants={fadeIn} className="p-8 rounded-3xl border border-border bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section id="how-it-works" className="py-24 md:py-32 border-t border-border/40 bg-muted/30" aria-labelledby="how-it-works-heading">
          <div className="container mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-20"
            >
              <motion.h2 variants={fadeIn} id="how-it-works-heading" className="text-4xl md:text-5xl font-display font-black mb-6 tracking-tight">
                The Forging Process
              </motion.h2>
              <motion.p variants={fadeIn} className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Three steps from a fleeting thought to an actionable execution plan.
              </motion.p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-border z-0" />
              
              {[
                { step: "1", title: "Drop in the raw ore", desc: "Quickly capture your startup idea or dive straight into an AI conversation to explore the problem space." },
                { step: "2", title: "Apply heat & pressure", desc: "Get automated competitor research, viability scores, and key insights to challenge your assumptions." },
                { step: "3", title: "Extract the forged plan", desc: "Generate a comprehensive PRD, launch a landing page, and find your first users in niche communities." }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="text-center relative z-10"
                >
                  <div className="w-24 h-24 rounded-3xl bg-background border-4 border-primary shadow-xl shadow-primary/20 flex items-center justify-center mx-auto mb-8 text-4xl font-display font-black text-primary transform rotate-3 hover:rotate-0 transition-transform duration-300" aria-hidden="true">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-24 md:py-32" aria-labelledby="cta-heading">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] overflow-hidden p-12 md:p-20 text-center shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-orange-500/20 z-0" />
            <div className="absolute inset-0 border border-white/10 rounded-[3rem] z-0 pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 id="cta-heading" className="text-4xl md:text-6xl font-display font-black mb-8 tracking-tight">
                Ready to Forge Your <br />Next Big Idea?
              </h2>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                Join founders who use Idea Foundry to turn rough concepts into validated, buildable products with unprecedented clarity.
              </p>
              <Button size="lg" className="h-16 gap-3 text-xl px-10 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all rounded-2xl" onClick={() => setLocation("/app")} data-testid="button-cta-final">
                Start Forging Now <ArrowRight className="w-6 h-6" aria-hidden="true" />
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-16 bg-muted/20" role="contentinfo">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <a href="/" className="flex items-center gap-2 mb-6 group" aria-label="Idea Foundry Home">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-md">
                  <Flame className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight">Idea Foundry</span>
              </a>
              <p className="text-muted-foreground leading-relaxed mb-6">
                The ultimate workshop for founders to validate, pressure-test, and specify their next product ideas.
              </p>
              <div className="flex items-center gap-4" aria-label="Social media links">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors shadow-sm" aria-label="Twitter">
                  <Twitter className="w-4 h-4" aria-hidden="true" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors shadow-sm" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            
            <div className="lg:ml-auto">
              <h4 className="font-bold mb-6 tracking-tight">Product</h4>
              <ul className="space-y-4 text-sm font-medium text-muted-foreground" role="list">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div className="lg:ml-auto">
              <h4 className="font-bold mb-6 tracking-tight">Resources</h4>
              <ul className="space-y-4 text-sm font-medium text-muted-foreground" role="list">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Founder Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">PRD Templates</a></li>
              </ul>
            </div>
            
            <div className="lg:ml-auto">
              <h4 className="font-bold mb-6 tracking-tight">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-muted-foreground" role="list">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/60 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              &copy; {new Date().getFullYear()} Idea Foundry. All rights reserved.
            </p>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              Forged with <Flame className="w-3 h-3 text-primary" /> for founders
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}