/**
 * Routing utilities for subdomain-based navigation
 * - www.ideafoundry.app -> Landing page
 * - plan.ideafoundry.app -> Auth + App
 */

export function getAppUrl(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '/auth';
  }
  
  // Production: redirect to plan subdomain
  if (hostname.includes('ideafoundry.app')) {
    return `${protocol}//plan.ideafoundry.app/auth`;
  }
  
  // Fallback for other domains (like Vercel preview URLs)
  return '/auth';
}

export function getHomeUrl(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '/';
  }
  
  // Production: redirect to www subdomain
  if (hostname.includes('ideafoundry.app')) {
    return `${protocol}//www.ideafoundry.app/`;
  }
  
  // Fallback
  return '/';
}

export function isAppSubdomain(): boolean {
  const hostname = window.location.hostname;
  
  // Local development always shows app
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }
  
  // Check if we're on plan subdomain
  return hostname.startsWith('plan.');
}

export function shouldShowLanding(): boolean {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // Local: show landing only on root path
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return pathname === '/';
  }
  
  // Production: show landing only on www subdomain
  return hostname.startsWith('www.') || hostname === 'ideafoundry.app';
}
