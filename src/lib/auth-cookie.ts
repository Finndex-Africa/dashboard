/**
 * Helpers for the `token` cookie that middleware reads.
 *
 * LIMITATION — the important one. This cookie is written by client-side JS, which
 * means it cannot be HttpOnly. Any XSS on this origin can read both it and the
 * copy in localStorage. The real fix is for the API to issue the session as an
 * HttpOnly; Secure; SameSite cookie in its own Set-Cookie response header, so the
 * token never touches JS. Until that lands, treat the CSP in next.config.js as the
 * primary defense and keep this cookie short-lived.
 */

const TOKEN_COOKIE = 'token';

/** One day, matching the previous max-age. */
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24;

/**
 * Write the session cookie with the strongest flags available to JS.
 *
 * Secure is added only on HTTPS so that local http://localhost development keeps
 * working — browsers drop Secure cookies on insecure origins.
 *
 * SameSite stays Lax rather than Strict on purpose: users arrive here by
 * cross-site navigation from the main website, and Strict would withhold the
 * cookie on that first hop, so middleware would bounce them straight back out.
 */
export function setAuthCookie(token: string, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS): void {
    if (typeof document === 'undefined') return;

    const isSecure = window.location.protocol === 'https:';
    const parts = [
        `${TOKEN_COOKIE}=${encodeURIComponent(token)}`,
        'path=/',
        `max-age=${maxAgeSeconds}`,
        'SameSite=Lax',
    ];
    if (isSecure) parts.push('Secure');

    document.cookie = parts.join('; ');
}

/** Clear the session cookie. Mirrors the flags used when setting it. */
export function clearAuthCookie(): void {
    if (typeof document === 'undefined') return;

    const isSecure = window.location.protocol === 'https:';
    const parts = [`${TOKEN_COOKIE}=`, 'path=/', 'max-age=0', 'SameSite=Lax'];
    if (isSecure) parts.push('Secure');

    document.cookie = parts.join('; ');
}

/** Remove every client-side trace of the session. */
export function clearAuthStorage(): void {
    if (typeof window === 'undefined') return;

    ['token', 'authToken', 'user', 'refreshToken'].forEach((key) => {
        window.localStorage.removeItem(key);
    });
    clearAuthCookie();
}
