import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  LayoutDashboard, 
  Plus, 
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X
} from "lucide-react";
import { signOut } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
}

export default function AppLayout({ children, showBackButton, backTo }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/app", label: "Dashboard", icon: LayoutDashboard },
    { path: "/app/new", label: "New Idea", icon: Plus },
  ];
  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setLocation("/app")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg">Idea Foundry</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border space-y-1">
          <button
            onClick={() => setLocation("/app/settings")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location === "/app/settings"
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => {
              signOut();
              setLocation("/auth");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="md:hidden border-b border-border p-4 flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold">Idea Foundry</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/app/new")}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>

          {/* Mobile Menu Panel */}
          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 top-0 left-0 z-40 bg-black/50 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 z-50 md:hidden bg-card border-b border-border shadow-lg">
                <nav className="p-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          setLocation(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setLocation("/app/settings");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location === "/app/settings"
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setLocation("/auth");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </nav>
              </div>
            </>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          {showBackButton && (
            <div className="container mx-auto px-6 pt-6">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation(backTo || "/app")}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
