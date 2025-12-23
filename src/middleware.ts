import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRoleRedirectPath, getUserRoleFromToken, canAccessDashboard } from '@/lib/role-redirects';

export function middleware(request: NextRequest) {
    // Get the pathname of the request (e.g. /, /protected, /admin)
    const path = request.nextUrl.pathname;

    // Public paths that don't require authentication
    const isPublicPath = path === '/login' || path === '/signup' || path === '/forgot-password' || path === '/auth-transfer';

    // Get the token from the cookies
    const token = request.cookies.get('token')?.value;

    // Get the current path
    const url = request.nextUrl.clone();

    // If the path is public and user is logged in, redirect based on role
    if (isPublicPath && token && path !== '/auth-transfer') {
        const role = getUserRoleFromToken(token);
        url.pathname = getRoleRedirectPath(role);
        return NextResponse.redirect(url);
    }

    // Block non-admin users from accessing /dashboard
    if (path === '/dashboard' && token) {
        const role = getUserRoleFromToken(token);
        if (!canAccessDashboard(role)) {
            url.pathname = getRoleRedirectPath(role);
            return NextResponse.redirect(url);
        }
    }

    // If the path is protected and user is not logged in, redirect to website login
    if (!isPublicPath && !token) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_WEBSITE_URL}`);
    }

    // Continue with the request
    return NextResponse.next();
}

// Configure the paths that should trigger this middleware
export const config = {
    matcher: [
        // Match all paths except api routes, static files, images, and .well-known
        '/((?!api|_next/static|_next/image|favicon.ico|\\.well-known).*)',
    ],
};