import type { Context, Next } from 'hono';
import { lucia } from '../lib/auth.js';
import type { ApiError } from '../../shared/types.js';

export async function authGuard(c: Context, next: Next): Promise<Response | void> {
  const sessionId = lucia.readSessionCookie(c.req.header('cookie') ?? '');

  if (!sessionId) {
    const response: ApiError = {
      success: false,
      error: 'Unauthorized — silakan login',
    };
    return c.json(response, 401);
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session) {
    // Clear invalid cookie
    const blankCookie = lucia.createBlankSessionCookie();
    c.header('Set-Cookie', blankCookie.serialize());

    const response: ApiError = {
      success: false,
      error: 'Session expired — silakan login kembali',
    };
    return c.json(response, 401);
  }

  // Set fresh cookie if session was rotated
  if (session.fresh) {
    const newCookie = lucia.createSessionCookie(session.id);
    c.header('Set-Cookie', newCookie.serialize());
  }

  // Attach user to context
  c.set('userId', user?.id as string);
  c.set('session', session);

  await next();
}
