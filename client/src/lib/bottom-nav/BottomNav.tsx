/**
 * BottomNav — reusable mobile bottom navigation bar.
 *
 * Synthesized from the best patterns across 5 apps:
 *  - scrap-sync: split primitive + container, matchPaths, badges, a11y
 *  - project-dashboard: ResizeObserver → CSS var height reporting
 *  - Playbook-Task-App: iOS PWA safe-area, center FAB slot
 *
 * Features:
 *  - Fixed bottom bar, hidden on md+ (md:hidden — no JS breakpoint, no flash)
 *  - Safe-area-inset-bottom padding for iPhone home indicator
 *  - ResizeObserver publishes --mobile-nav-h CSS var for full-screen surfaces
 *  - Optional center FAB slot (absolute positioned, elevated)
 *  - Router-agnostic: pass `navigate` and `currentPath` from any router
 *  - 44px+ touch targets, focus-visible rings, aria-current
 *  - Dark mode via Tailwind dark: classes
 *  - Backdrop blur for readability over scrolling content
 *
 * Usage:
 *  <BottomNav
 *    currentPath={location}
 *    navigate={(href) => (e) => { e.preventDefault(); setLocation(href); }}
 *    items={[
 *      { label: "Home", icon: <HomeIcon />, href: "/app", matchPaths: ["/app"] },
 *      { label: "New", icon: <PlusIcon />, href: "/app/new" },
 *    ]}
 *    actions={[
 *      { label: "Sign Out", icon: <LogOutIcon />, onClick: handleSignOut },
 *    ]}
 *  />
 */

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { BottomNavItem, type BottomNavItemProps } from "./BottomNavItem";

export interface BottomNavItemConfig extends Omit<BottomNavItemProps, "navigate" | "currentPath"> {}

export interface BottomNavProps {
  /** Current path for active-state matching. */
  currentPath: string;
  /** Navigate function — receives href, returns a click handler. */
  navigate: (href: string) => (e: React.MouseEvent) => void;
  /** Link items (Home, New, Settings, etc.). */
  items: BottomNavItemConfig[];
  /** Action buttons appended after link items (Sign Out, More, etc.). */
  actions?: BottomNavItemConfig[];
  /** Optional center FAB — rendered as an elevated button between items[1] and items[2]. */
  fab?: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    ariaLabel?: string;
  };
  /** Active color class (default: text-primary). */
  activeClass?: string;
  /** Inactive color class (default: text-muted-foreground). */
  inactiveClass?: string;
  /** Extra classes on the <nav> element. */
  className?: string;
}

export function BottomNav({
  currentPath,
  navigate,
  items,
  actions = [],
  fab,
  activeClass,
  inactiveClass,
  className = "",
}: BottomNavProps) {
  const navRef = useRef<HTMLElement>(null);

  // Publish nav height as --mobile-nav-h CSS var so full-screen surfaces
  // (modals, chat panels) can position above the nav. Cleared on unmount.
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--mobile-nav-h", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--mobile-nav-h");
    };
  }, []);

  // Split items around the FAB: [0,1] left, FAB center, [2+] right
  const leftItems = fab ? items.slice(0, 2) : items;
  const rightItems = fab ? items.slice(2) : [];

  return (
    <nav
      ref={navRef}
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm ${className}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary navigation"
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {leftItems.map((item, i) => (
          <BottomNavItem
            key={i}
            {...item}
            currentPath={currentPath}
            navigate={navigate}
            activeClass={activeClass}
            inactiveClass={inactiveClass}
          />
        ))}

        {fab && (
          <div className="flex items-center justify-center px-2" role="presentation">
            <button
              type="button"
              onClick={fab.onClick}
              aria-label={fab.ariaLabel ?? fab.label}
              className="flex flex-col items-center justify-center -mt-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {fab.icon}
              <span className="sr-only">{fab.label}</span>
            </button>
          </div>
        )}

        {rightItems.map((item, i) => (
          <BottomNavItem
            key={`r-${i}`}
            {...item}
            currentPath={currentPath}
            navigate={navigate}
            activeClass={activeClass}
            inactiveClass={inactiveClass}
          />
        ))}

        {actions.map((action, i) => (
          <BottomNavItem
            key={`a-${i}`}
            {...action}
            currentPath={currentPath}
            navigate={navigate}
            activeClass={activeClass}
            inactiveClass={inactiveClass}
          />
        ))}
      </div>
    </nav>
  );
}

export { BottomNavItem };
