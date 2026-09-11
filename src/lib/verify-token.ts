import { jwtVerify } from 'jose';
import type { UserRole } from './role-redirects';

/**
 * Cryptographic verification of the session JWT, for use in middleware.
 *
 * The API signs tokens with HS256 using JWT_SECRET. When the same secret is
 * present here, middleware can verify the signature and the role claim becomes
 * trustworthy — a forged token claiming `userType: "admin"` is rejected instead
 * of being believed.
 *
 * TRADE-OFF worth understanding before enabling: HS256 is symmetric, so the
 * verifying key IS the signing key. Setting JWT_SECRET here copies the API's
 * signing secret into a second deployment, widening the blast radius if this app
 * is compromised. Two ways to avoid that:
 *
 *   1. Move the API to RS256 and give this app only the public key.
 *   2. Leave JWT_SECRET unset here and rely on the API, which independently
 *      authorizes every request (verified: forged tokens get 401, scoped admins
 *      get 403 on user management).
 *
 * With JWT_SECRET unset this falls back to unverified decoding, which is the
 * historical behaviour: good enough to route honest users, not a boundary.
 */

export interface VerifiedClaims {
  role: UserRole | string;
  exp?: number;
  /** True only when the signature was cryptographically checked. */
  verified: boolean;
}

/** Cached encoded key so we don't re-encode on every request. */
let cachedKey: Uint8Array | null = null;
let cachedSecret: string | null = null;

function secretKey(secret: string): Uint8Array {
  if (cachedSecret !== secret) {
    cachedKey = new TextEncoder().encode(secret);
    cachedSecret = secret;
  }
  return cachedKey as Uint8Array;
}

/** Whether signature verification is configured. */
export function isVerificationEnabled(): boolean {
  const s = process.env.JWT_SECRET;
  return typeof s === 'string' && s.trim().length >= 32;
}

/**
 * Verify a token's signature and expiry.
 *
 * Returns null when the token is forged, expired, malformed, or signed with a
 * different key. `alg` is pinned to HS256 so a token can't request `none` or
 * downgrade the algorithm.
 */
export async function verifyToken(token: string): Promise<VerifiedClaims | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      algorithms: ['HS256'],
    });

    return {
      role: (payload.userType as string) || (payload.role as string) || 'home_seeker',
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      verified: true,
    };
  } catch {
    // Covers bad signature, expired token, wrong algorithm and malformed input.
    return null;
  }
}
