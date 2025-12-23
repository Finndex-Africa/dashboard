/**
 * Centralized role-based redirect logic
 *
 * Phase 1: Dashboard removal for non-admins
 * - Only admin users land on /dashboard (renamed to /admin in future phases)
 * - All other users go directly to task-based pages
 */

export type UserRole = 'admin' | 'agent' | 'landlord' | 'service_provider' | 'home_seeker';

/**
 * Get the post-login redirect path for a given user role
 */
export function getRoleRedirectPath(role: UserRole | string): string {
  const redirects: Record<string, string> = {
    admin: '/dashboard',                    // Phase 1: Keep as /dashboard, will become /admin later
    agent: '/properties?view=mine',         // Phase 2: Direct to "My Listings"
    landlord: '/properties?view=mine',      // Phase 2: Direct to "My Listings"
    service_provider: '/services?view=mine', // Phase 2+: Will implement in Phase 3
    home_seeker: '/properties?tab=active',   // Phase 2: Direct to "Browse Properties"
  };

  return redirects[role] || '/properties'; // Default fallback
}

/**
 * Check if a user role has access to the /dashboard route
 * Phase 1: Only admin can access /dashboard
 */
export function canAccessDashboard(role: UserRole | string): boolean {
  return role === 'admin';
}

/**
 * Extract user role from JWT token
 * Handles both 'userType' and 'role' fields for backwards compatibility
 */
export function getUserRoleFromToken(token: string): UserRole | string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userType || payload.role || 'home_seeker';
  } catch (error) {
    console.error('Failed to decode token:', error);
    return 'home_seeker'; // Safe fallback
  }
}
