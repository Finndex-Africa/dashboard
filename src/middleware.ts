import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRoleRedirectPath, parseTokenClaims } from '@/lib/role-redirects';
import { canAccessRoute } from '@/lib/route-access';
import { verifyToken, isVerificationEnabled } from '@/lib/verify-token';

/**
 * Route guard for the dashboard.
 *
 * Strength depends on configuration:
 *
 *  - JWT_SECRET set  -> the token's HS256 signature is verified, so the role claim
 *                       is trustworthy and this IS an access-control boundary.
 *  - JWT_SECRET unset -> the payload is decoded without verification, so a forged
 *                       token can pass. Routing aid only.
 *
 * Either way the API independently authorizes every request (confirmed: forged
 * tokens get 401, scoped admins get 403 on user management), so this is never the
 * only thing standing between a user and data. See lib/verify-token.ts for the
 * symmetric-key trade-off involved in enabling verification here.
 */

const PUBLIC_PATHS = new Set([
    '/login',
    '/signup',
    '/forgot-password',
    '/auth-transfer',
]);

/**
 * Where unauthenticated users get sent. Validated so a missing or malformed env
 * var can't turn into a redirect to the literal string "undefined", and so the
 * value can't be pointed at an off-site host by a bad deploy config.
 */
function loginUrl(): string | null {
    const configured = process.env.NEXT_PUBLIC_WEBSITE_URL;
    if (!configured) return null;
    try {
        const url = new URL(configured);
        if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null;
        return url.toString();
    } catch {
        return null;
    }
}

/** Send the user to sign in and drop the stale cookie on the way out. */
function redirectToLogin(request: NextRequest): NextResponse {
    const target = loginUrl();
    const response = target
        ? NextResponse.redirect(target)
        // No usable website URL configured: fail closed with a plain 401 rather
        // than throwing or, worse, letting the request through.
        : new NextResponse('Unauthorized', { status: 401 });

    response.cookies.set('token', '', { path: '/', maxAge: 0 });
    return response;
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isPublicPath = PUBLIC_PATHS.has(path);
    const token = request.cookies.get('token')?.value;
    const url = request.nextUrl.clone();

    // Parse once. Returns null for malformed *and* expired tokens, so an expired
    // session no longer counts as signed in. When JWT_SECRET is configured the
    // signature is checked too, and a bad signature yields null.
    const claims = token
        ? isVerificationEnabled()
            ? await verifyToken(token)
            : parseTokenClaims(token)
        : null;

    // /auth-transfer is where a fresh token arrives, so never bounce it.
    if (path === '/auth-transfer') {
        return NextResponse.next();
    }

    // Signed-in users shouldn't sit on the login/signup pages.
    if (isPublicPath) {
        if (claims) {
            url.pathname = getRoleRedirectPath(claims.role);
            url.search = '';
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // Everything below is a protected path.

    // A cookie that's present but unusable (expired or malformed) is treated as
    // signed out, and the dead cookie is cleared so it stops being re-sent.
    if (!claims) {
        return redirectToLogin(request);
    }

    // Per-route authorization. Previously only /dashboard was checked, which left
    // /users, /verifications, /user-reports, /advertisements, /service-requests,
    // /buy-sell and /settings reachable by URL from any signed-in account.
    if (!canAccessRoute(claims.role, path)) {
        const redirect = getRoleRedirectPath(claims.role);
        const [redirectPath] = redirect.split('?');

        // If this role can't reach its own landing page either, stop rather than
        // bounce the browser between two redirects forever.
        if (redirectPath === path || !canAccessRoute(claims.role, redirectPath)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        return NextResponse.redirect(new URL(redirect, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except api routes, static files, images, and .well-known
        '/((?!api|_next/static|_next/image|favicon.ico|\\.well-known).*)',
    ],
};
