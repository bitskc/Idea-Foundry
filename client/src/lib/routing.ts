/**
 * Routing utilities for subdomain-based navigation
 * - www.ideafoundry.app -> Landing page only
 * - plan.ideafoundry.app -> Auth + App only
 */

export function getSubdomain(): 'www' | 'plan' | 'local' | 'other' {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }
  
  // Check subdomain
  if (hostname.startsWith('www.')) {
    return 'www';
  }
  
  if (hostname.startsWith('plan.')) {
    return 'plan';
  }
  
  // Apex domain (ideafoundry.app) or preview URLs
  return 'other';
}

export function getAppUrl(): string {
  const subdomain = getSubdomain();
  const protocol = window.location.protocol;
  
  // Already on plan subdomain
  if (subdomain === 'plan') {
    return '/auth';
  }
  
  // Local development
  if (subdomain === 'local') {
    return '/auth';
  }
  
  // On www or apex - redirect to plan subdomain
  return `${protocol}//plan.ideafoundry.app/auth`;
}

export function getHomeUrl(): string {
  const subdomain = getSubdomain();
  const protocol = window.location.protocol;
  
  // Already on www subdomain
  if (subdomain === 'www') {
    return '/';
  }
  
  // Local development
  if (subdomain === 'local') {
    return '/';
  }
  
  // On plan or apex - redirect to www subdomain
  return `${protocol}//www.ideafoundry.app/`;
}

export function shouldShowLandingOnly(): boolean {
  const subdomain = getSubdomain();
  
  // On www, only show landing
  return subdomain === 'www';
}

export function shouldShowAppOnly(): boolean {
  const subdomain = getSubdomain();
  
  // On plan, only show app/auth
  return subdomain === 'plan';
}

export function isLocalDevelopment(): boolean {
  const subdomain = getSubdomain();
  return subdomain === 'local';
}
