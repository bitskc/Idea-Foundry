import { Button } from "@/components/ui/button";
import { Flame, ArrowRight, Ghost } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full opacity-70 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center z-10 px-6 max-w-lg"
      >
        <div className="w-24 h-24 rounded-3xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-8 shadow-inner relative">
          <Ghost className="w-12 h-12 text-muted-foreground" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm border border-primary/20">
            <Flame className="w-5 h-5 text-primary" />
          </div>
        </div>
        
        <h1 className="text-7xl font-display font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/50">404</h1>
        <h2 className="text-2xl font-bold mb-4">Uncharted Territory</h2>
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          The idea you're looking for hasn't been forged yet, or the page has been lost to the fires.
        </p>
        
        <Link href="/app" className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all gap-2">
          Return to Foundry <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
}
