/**
 * mobile-bottom-nav — Reusable mobile bottom navigation bar for React apps.
 *
 * Synthesized from patterns across 5 production apps (scrap-sync, project-dashboard,
 * Playbook-Task-App, Haven, idea-foundry). Router-agnostic, Tailwind-based.
 *
 * @example
 * import { BottomNav } from "mobile-bottom-nav";
 *
 * <BottomNav
 *   currentPath={location}
 *   navigate={(href) => (e) => { e.preventDefault(); setLocation(href); }}
 *   items={[
 *     { label: "Home", icon: <Home />, href: "/app", matchPaths: ["/app"] },
 *     { label: "New", icon: <Plus />, href: "/app/new" },
 *     { label: "Settings", icon: <Settings />, href: "/app/settings" },
 *   ]}
 *   actions={[
 *     { label: "Sign Out", icon: <LogOut />, onClick: handleSignOut },
 *   ]}
 * />
 */

export { BottomNav } from "./BottomNav";
export { BottomNavItem } from "./BottomNavItem";
export type { BottomNavProps, BottomNavItemConfig } from "./BottomNav";
export type { BottomNavItemProps } from "./BottomNavItem";

/**
 * CSS utilities required in your app's global CSS:
 *
 * .safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }
 *
 * The component publishes --mobile-nav-h (px) on <html> via ResizeObserver
 * so full-screen surfaces can offset above the nav:
 *   bottom: var(--mobile-nav-h, 0px);
 */
