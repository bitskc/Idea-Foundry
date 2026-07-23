import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  ChevronLeft,
  Crown,
} from "lucide-react";
import { signOut } from "@/lib/auth";

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

  // Bottom nav items (mobile only)
  const bottomNavItems = [
    { path: "/app", label: "Home", icon: LayoutDashboard },
    { path: "/app/new", label: "New", icon: Plus },
    { path: "/app/settings", label: "Settings", icon: Settings },
    { path: "/app/upgrade", label: "Pro", icon: Crown },
  ];

  const isActive = (path: string) => {
    if (path === "/app") return location === "/app";
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Desktop Sidebar */}
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
            const active = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
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
        {/* Mobile Header — simplified, no hamburger */}
        <header className="md:hidden border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base">Idea Foundry</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/app/new")}>
            <Plus className="w-4 h-4" />
          </Button>
        </header>

        {/* Page Content — bottom padding on mobile for nav bar */}
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
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

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-pb">
          <div className="flex items-center justify-around h-16 px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[60px] ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
            {/* Sign Out — 5th action */}
            <button
              onClick={() => {
                signOut();
                setLocation("/auth");
              }}
              className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[60px] text-muted-foreground hover:text-foreground"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-medium">Sign Out</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
