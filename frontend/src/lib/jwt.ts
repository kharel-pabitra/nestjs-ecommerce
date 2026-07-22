import type { AuthUser } from './types';

/** Decodes the payload of a JWT without verifying it — fine for reading
 * userId/email/role client-side; the backend still verifies the signature
 * on every protected request. */
export function decodeUserFromToken(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (!json.userId || !json.email || !json.role) return null;
    return { userId: json.userId, email: json.email, role: json.role };
  } catch {
    return null;
  }
}
