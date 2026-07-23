/**
 * BottomNavItem — reusable primitive for a mobile bottom navigation slot.
 *
 * Supports both link navigation (via render prop) and action buttons (onClick).
 * Router-agnostic: pass a `renderLink` function that wraps your router's <Link>.
 *
 * Active-state matching:
 *  - If `matchPaths` is given, active iff current path exactly equals one of them.
 *    This prevents Home from lighting up on every nested route.
 *  - Else if `href` is given, active iff path equals href OR starts with href + "/".
 *    This handles /items/123 lighting up the Items tab.
 *
 * A11y:
 *  - aria-label includes badge count + noun ("Cases, 3 urgent") so SR users
 *    hear context. Visible badge is aria-hidden.
 *  - Active items expose aria-current="page".
 *  - Touch target >= 44px (WCAG 2.5.8) — parent nav is h-16 (64px).
 */

import { forwardRef, type ReactNode } from "react";

export interface BottomNavItemProps {
  /** Destination path. Omit for non-link items (FAB, More, Sign Out). */
  href?: string;
  /** Click handler. Used when href is omitted (action buttons). */
  onClick?: () => void;
  /** Visible label text. */
  label: string;
  /** Icon element (rendered above label). Should be ~24px. */
  icon: ReactNode;
  /** Exact paths that mark this item active (e.g. Home: ["/app", "/dashboard"]). */
  matchPaths?: string[];
  /** Navigate function — receives href, returns a click handler. */
  navigate?: (href: string) => (e: React.MouseEvent) => void;
  /** Current path for active-state matching. */
  currentPath?: string;
  /** Numeric badge — shows a pill when > 0. */
  badgeCount?: number;
  /** Dot badge — shows a small indicator when true (no number). */
  badgeDot?: boolean;
  /** SR noun for badge context: "Cases, 3 urgent". */
  badgeNoun?: string;
  /** Override the accessible name (e.g. "More menu" instead of "More"). */
  ariaLabel?: string;
  /** DOM id (for focus-return targets). */
  id?: string;
  /** For popup triggers — sets aria-expanded. */
  ariaExpanded?: boolean;
  /** Pairs with ariaExpanded — sets aria-controls. */
  ariaControls?: string;
  /** Extra classes for the button/link element. */
  className?: string;
  /** Active color class (default: text-primary). */
  activeClass?: string;
  /** Inactive color class (default: text-muted-foreground). */
  inactiveClass?: string;
}

export const BottomNavItem = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  BottomNavItemProps
>(function BottomNavItem(props, ref) {
  const {
    href,
    onClick,
    label,
    icon,
    matchPaths,
    navigate,
    currentPath = "",
    badgeCount,
    badgeDot,
    badgeNoun,
    ariaLabel,
    id,
    ariaExpanded,
    ariaControls,
    className = "",
    activeClass = "text-primary",
    inactiveClass = "text-muted-foreground",
  } = props;

  const active = matchPaths
    ? matchPaths.some((p) => currentPath === p)
    : href
      ? currentPath === href || currentPath.startsWith(href + "/")
      : false;

  const hasNumericBadge = typeof badgeCount === "number" && badgeCount > 0;
  const hasDotBadge = !hasNumericBadge && badgeDot;

  const baseLabel = ariaLabel ?? label;
  const accessibleName = hasNumericBadge
    ? `${baseLabel}, ${badgeCount} ${badgeNoun ?? "items"}`
    : hasDotBadge
      ? `${baseLabel}, has updates`
      : baseLabel;

  const inner = (
    <>
      <span className="relative">
        {icon}
        {hasNumericBadge && (
          <span
            className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
            aria-hidden="true"
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
        {hasDotBadge && (
          <span
            className="absolute top-0 right-0 w-2 h-2 rounded-full bg-destructive"
            aria-hidden="true"
          />
        )}
      </span>
      <span>{label}</span>
    </>
  );

  const sharedClassName = `relative flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px] font-medium transition-colors active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring min-w-[60px] ${
    active ? activeClass : `${inactiveClass} hover:text-foreground`
  } ${className}`;

  // Link mode: only when href + navigate are provided AND no custom onClick
  if (href && navigate && !onClick) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={navigate(href)}
        aria-label={accessibleName}
        aria-current={active ? "page" : undefined}
        className={sharedClassName}
      >
        {inner}
      </a>
    );
  }

  // Button mode (action items: FAB, More, Sign Out)
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      id={id}
      onClick={onClick}
      aria-label={accessibleName}
      aria-current={active ? "page" : undefined}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      className={sharedClassName}
    >
      {inner}
    </button>
  );
});
