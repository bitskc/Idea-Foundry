import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Settings, 
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard", label: "New Project", icon: MessageSquare }, // Simplified for mockup
    { href: "/dashboard", label: "Templates", icon: FileText },
    { href: "/dashboard", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card z-20 sticky top-0">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-primary">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-sm">
            V
          </div>
          VibePlan
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-0 z-10 bg-sidebar border-r border-sidebar-border transition-transform duration-300 md:translate-x-0 md:static md:w-64 md:h-screen md:sticky md:top-0",
        mobileMenuOpen ? "translate-x-0 pt-20" : "-translate-x-full md:pt-0"
      )}>
        <div className="p-6 hidden md:flex items-center gap-2 font-display font-bold text-2xl text-primary mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-sm">
            V
          </div>
          VibePlan
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.label} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
           <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/20">
             <p className="text-xs font-semibold text-primary mb-1">Free Plan</p>
             <p className="text-xs text-muted-foreground mb-3">2/3 projects used</p>
             <Button size="sm" className="w-full text-xs" variant="outline">Upgrade to Pro</Button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
