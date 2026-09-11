/**
 * Centralized role-based redirect and access-control logic.
 *
 * SCOPE / THREAT MODEL — read before relying on anything here.
 *
 * The helpers below read the role out of the JWT *payload* without verifying the
 * token's signature. Signature verification needs the signing key, which lives in
 * the API service, not in this app. That means a user can hand-craft a token whose
 * payload claims `userType: "admin"` and this code will believe it.
 *
 * So: treat every check here as UX routing and defense-in-depth, NOT as a security
 * boundary. The only real boundary is the API enforcing authorization on each
 * request. If a page can leak data, the endpoint behind it must be the thing that
 * says no.
 */

export type UserRole =
  | 'admin'
  | 'admin_property'
  | 'admin_services'
  | 'agent'
  | 'real_estate_agency'
  | 'landlord'
  | 'service_provider'
  | 'home_seeker';

/** Roles permitted to reach admin-only areas of the dashboard. */
const ADMIN_ROLES: ReadonlySet<string> = new Set<string>([
  'admin',
  'admin_property',
  'admin_services',
]);

/** Get the post-login redirect path for a given user role. */
export function getRoleRedirectPath(role: UserRole | string): string {
  const redirects: Record<string, string> = {
    admin: '/dashboard',
    admin_property: '/dashboard',
    admin_services: '/dashboard',
    agent: '/properties?view=mine',
    real_estate_agency: '/properties?view=mine',
    landlord: '/properties?view=mine',
    service_provider: '/services?view=mine',
    home_seeker: '/properties?tab=active',
  };

  return redirects[role] || '/properties';
}

/** Check if a user role has access to the dashboard (overview) route. */
export function canAccessDashboard(role: UserRole | string): boolean {
  return ADMIN_ROLES.has(role);
}

/** Decoded JWT claims we care about. */
export interface TokenClaims {
  role: UserRole | string;
  /** Expiry as a UNIX timestamp in seconds, when the token carries one. */
  exp?: number;
}

/**
 * Base64url-decode a JWT segment. `atob` only understands standard base64, so the
 * URL-safe alphabet and stripped padding have to be restored first — otherwise
 * tokens containing '-' or '_' throw and get silently downgraded to home_seeker.
 */
function decodeSegment(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
}

/**
 * Parse a JWT's claims. Returns null if the token is malformed or expired.
 *
 * Reminder: this does not verify the signature. See the file header.
 */
export function parseTokenClaims(token: string): TokenClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(decodeSegment(parts[1]));

    // Reject expired tokens. Without this an old token keeps satisfying the
    // "is there a token?" check forever, so the app renders as if signed in.
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return {
      role: payload.userType || payload.role || 'home_seeker',
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  } catch {
    // Deliberately not logging the token or the error detail — this runs on paths
    // where the value is attacker-supplied and logs get shipped elsewhere.
    return null;
  }
}

/**
 * Extract user role from a JWT.
 * Handles both 'userType' and 'role' fields for backwards compatibility.
 * Falls back to the least-privileged role when the token can't be read.
 */
export function getUserRoleFromToken(token: string): UserRole | string {
  return parseTokenClaims(token)?.role ?? 'home_seeker';
}
