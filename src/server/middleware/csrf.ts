import type { Context, Next } from 'hono';
import { randomBytes } from 'node:crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * CSRF protection using Double Submit Cookie pattern.
 *
 * - Safe methods (GET, HEAD, OPTIONS) are exempt.
 * - On every request, a CSRF cookie is set (if missing).
 * - State-changing requests (POST, PUT, DELETE, PATCH) require
 *   the `X-CSRF-Token` header to match the cookie value.
 *
 * The cookie is NOT httpOnly so the SPA can read it and
 * attach it as a header on subsequent requests.
 */
export async function csrfProtection(c: Context, next: Next): Promise<Response | void> {
  const method = c.req.method.toUpperCase();

  // Ensure CSRF cookie exists on every response
  const existing = getCookieValue(c, CSRF_COOKIE);
  if (!existing) {
    const token = generateToken();
    c.header('Set-Cookie', `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=86400${process.env['NODE_ENV'] === 'production' ? '; Secure' : ''}`);
  }

  // Skip validation for safe methods
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    await next();
    return;
  }

  // Validate token on state-changing requests
  const cookieToken = getCookieValue(c, CSRF_COOKIE);
  const headerToken = c.req.header(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return c.json({ success: false, error: 'CSRF token tidak valid' }, 403);
  }

  await next();
}

/**
 * Endpoint to get the current CSRF token (for SPA initialization).
 * Returns the token from the cookie so the SPA can include it in headers.
 */
export function csrfTokenRoute(c: Context) {
  const token = getCookieValue(c, CSRF_COOKIE) ?? generateToken();

  // Ensure cookie is set
  if (!getCookieValue(c, CSRF_COOKIE)) {
    c.header('Set-Cookie', `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=86400${process.env['NODE_ENV'] === 'production' ? '; Secure' : ''}`);
  }

  return c.json({ success: true, data: { token } });
}

function getCookieValue(c: Context, name: string): string | undefined {
  const cookie = c.req.header('cookie') ?? '';
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1];
}
