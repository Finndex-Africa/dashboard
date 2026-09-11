/**
 * Canonical route → allowed-roles table for the dashboard.
 *
 * This is the single source of truth consumed by both the routing middleware
 * (src/middleware.ts) and the sidebar nav (app/(dashboard)/layout.tsx). They used
 * to carry separate copies of this knowledge, which is how /users, /verifications
 * and /user-reports ended up hidden from the nav but still reachable by URL.
 *
 * NOTE ON ENFORCEMENT: matching here gates *navigation only*. The JWT signature is
 * not verified client-side or in middleware (the signing key lives in the API), so
 * these checks stop honest users, not forged tokens. Every endpoint behind these
 * pages must enforce its own authorization.
 */

import type { UserRole } from './role-redirects';

export const ALL_ROLES: readonly UserRole[] = [
    'admin',
    'admin_property',
    'admin_services',
    'agent',
    'real_estate_agency',
    'landlord',
    'service_provider',
    'home_seeker',
];

const ADMIN_TIER: readonly UserRole[] = ['admin', 'admin_property', 'admin_services'];

/**
 * Every route prefix in the app and who may open it. A request matches a prefix
 * when it equals it or is nested beneath it, so '/users' also covers
 * '/users/agents' and '/properties' covers '/properties/create'.
 *
 * Longest prefix wins, so a more specific entry can override a broader one.
 */
export const ROUTE_ROLES: Readonly<Record<string, readonly UserRole[]>> = {
    '/dashboard': ADMIN_TIER,

    // Full admins only.
    '/advertisements': ['admin'],
    '/users': ['admin'],
    '/verifications': ['admin'],
    '/service-requests': ['admin'],
    '/buy-sell': ['admin'],
    // Exchange-rate controls; GET/PATCH /currency/settings is @Roles(ADMIN).
    '/settings': ['admin'],

    // Scoped admins included.
    '/user-reports': ADMIN_TIER,

    // Domain pages, split by which admin scope owns them.
    '/properties': [
        'home_seeker',
        'landlord',
        'agent',
        'real_estate_agency',
        'admin',
        'admin_property',
    ],
    '/services': ['home_seeker', 'service_provider', 'admin', 'admin_services'],
    '/bookings': [
        'home_seeker',
        'landlord',
        'agent',
        'real_estate_agency',
        'service_provider',
        'admin',
    ],

    // Open to every signed-in role.
    '/notifications': ALL_ROLES,
    '/messages': ALL_ROLES,
    '/chat': ALL_ROLES,
    '/profile': ALL_ROLES,
};

/** Normalize a pathname for prefix matching (drops a trailing slash). */
function normalize(path: string): string {
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Find the most specific ROUTE_ROLES entry covering `path`, or null when the path
 * isn't in the table at all.
 */
export function matchRoute(path: string): { prefix: string; roles: readonly UserRole[] } | null {
    const normalized = normalize(path);
    let best: { prefix: string; roles: readonly UserRole[] } | null = null;

    for (const [prefix, roles] of Object.entries(ROUTE_ROLES)) {
        if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
            // Longest prefix wins so specific entries beat general ones.
            if (!best || prefix.length > best.prefix.length) {
                best = { prefix, roles };
            }
        }
    }

    return best;
}

/**
 * Whether `role` may open `path`.
 *
 * Unlisted paths are denied. This is deliberate: the table above enumerates every
 * page the app ships, so an unmatched path is either a typo or a new page whose
 * access hasn't been decided yet — and defaulting those open is how the original
 * gap appeared. Adding a page means adding it here.
 */
export function canAccessRoute(role: UserRole | string, path: string): boolean {
    const match = matchRoute(path);
    if (!match) return false;
    return (match.roles as readonly string[]).includes(role);
}
