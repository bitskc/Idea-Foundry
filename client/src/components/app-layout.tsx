import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  LayoutDashboard, 
  Plus, 
  Settings,
  LogOut,
  ChevronLeft,
  Flame
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
}

export default function AppLayout({ children, showBackButton, backTo }: AppLayoutProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/app", label: "Dashboard", icon: LayoutDashboard },
    { path: "/app/new", label: "New Idea", icon: Plus },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border/40 bg-sidebar/50 backdrop-blur-xl hidden md:flex flex-col z-20">
        <div className="p-6 border-b border-border/40">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setLocation("/app")}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight">Idea Foundry</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/40 space-y-2">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button
            onClick={() => setLocation("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-[100dvh] relative overflow-x-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b border-border/40 bg-background/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setLocation("/app")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-md group-hover:shadow-primary/20 transition-all">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-extrabold tracking-tight">Idea Foundry</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/app/new")} className="font-semibold shadow-sm">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 flex flex-col relative">
          {showBackButton && (
            <div className="container mx-auto px-6 pt-8 pb-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation(backTo || "/app")}
                className="gap-2 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          )}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
