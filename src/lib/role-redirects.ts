/**
 * Centralized role-based redirect logic
 *
 * Phase 1: Dashboard removal for non-admins
 * - Only admin users land on /dashboard (renamed to /admin in future phases)
 * - All other users go directly to task-based pages
 */

export type UserRole = 'admin' | 'admin_property' | 'admin_services' | 'agent' | 'landlord' | 'service_provider' | 'home_seeker';

/**
 * Get the post-login redirect path for a given user role
 */
export function getRoleRedirectPath(role: UserRole | string): string {
  const redirects: Record<string, string> = {
    admin: '/dashboard',
    admin_property: '/dashboard',
    admin_services: '/dashboard',
    agent: '/properties?view=mine',
    landlord: '/properties?view=mine',
    service_provider: '/services?view=mine',
    home_seeker: '/properties?tab=active',
  };

  return redirects[role] || '/properties';
}

/**
 * Check if a user role has access to the dashboard (overview) route
 */
export function canAccessDashboard(role: UserRole | string): boolean {
  return role === 'admin' || role === 'admin_property' || role === 'admin_services';
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
