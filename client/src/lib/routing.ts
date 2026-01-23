/**
 * Routing utilities for navigation
 * For now, all routes are on the same domain
 * Future: Can split www.ideafoundry.app (landing) and plan.ideafoundry.app (app)
 */

export function getAppUrl(): string {
  // For now, just use /auth on the same domain
  return '/auth';
}

export function getHomeUrl(): string {
  return '/';
}

export function isAppSubdomain(): boolean {
  // Not using subdomains yet
  return true;
}

export function shouldShowLanding(): boolean {
  const pathname = window.location.pathname;
  // Show landing only on root path
  return pathname === '/';
}
