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

import { BottomNav } from "@/lib/bottom-nav";

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

  const navigate = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(href);
  };

  const handleSignOut = () => {
    signOut();
    setLocation("/auth");
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

        {/* Mobile Bottom Navigation — reusable library */}
        <BottomNav
          currentPath={location}
          navigate={navigate}
          items={[
            {
              label: "Home",
              icon: <LayoutDashboard className="w-5 h-5" />,
              href: "/app",
              matchPaths: ["/app"],
            },
            {
              label: "New",
              icon: <Plus className="w-5 h-5" />,
              href: "/app/new",
            },
            {
              label: "Settings",
              icon: <Settings className="w-5 h-5" />,
              href: "/app/settings",
            },
            {
              label: "Pro",
              icon: <Crown className="w-5 h-5" />,
              href: "/app/upgrade",
            },
          ]}
          actions={[
            {
              label: "Sign Out",
              icon: <LogOut className="w-5 h-5" />,
              onClick: handleSignOut,
            },
          ]}
        />
      </div>
    </div>
  );
}
