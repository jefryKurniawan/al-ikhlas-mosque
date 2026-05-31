import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { lucia } from '../lib/auth.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { isStrongPassword } from '../lib/sanitize.js';
import { rateLimit } from '../middleware/rate-limiter.js';
import db from '../db/index.js';
import { users } from '../db/schema.js';
import type { User } from '../../shared/types.js';
import { toUserId } from '../../shared/types.js';

const authRoutes = new Hono();

// Rate limit: 5 attempts per 15 minutes on login
authRoutes.use('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));

// --- Login with username/password ---
authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return c.json({ success: false, error: 'Username dan password wajib diisi' }, 400);
  }

  const { username, password } = body as { username: string; password: string };

  if (!isStrongPassword(password)) {
    return c.json({ success: false, error: 'Password minimal 8 karakter, harus ada huruf dan angka' }, 400);
  }

  // Find user by username
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.username, username), eq(users.provider, 'credentials')));

  if (!row || !row.passwordHash) {
    return c.json({ success: false, error: 'Username atau password salah' }, 401);
  }

  const valid = await verifyPassword(password, row.passwordHash);
  if (!valid) {
    return c.json({ success: false, error: 'Username atau password salah' }, 401);
  }

  // Create session
  const session = await lucia.createSession(row.id, {});
  const cookie = lucia.createSessionCookie(session.id);
  c.header('Set-Cookie', cookie.serialize());

  return c.json({
    success: true,
    data: {
      userId: row.id,
      username: row.username,
      role: row.role,
    },
  });
});

// --- Logout ---
authRoutes.post('/logout', async (c) => {
  const sessionId = lucia.readSessionCookie(c.req.header('cookie') ?? '');

  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const blankCookie = lucia.createBlankSessionCookie();
  c.header('Set-Cookie', blankCookie.serialize());

  return c.json({ success: true, data: { message: 'Logout berhasil' } });
});

// --- Get current user ---
authRoutes.get('/me', async (c) => {
  const sessionId = lucia.readSessionCookie(c.req.header('cookie') ?? '');

  if (!sessionId) {
    return c.json({ success: false, error: 'Tidak login' }, 401);
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session) {
    return c.json({ success: false, error: 'Session expired' }, 401);
  }

  return c.json({
    success: true,
    data: {
      userId: user?.id,
      username: user?.username,
      email: user?.email,
      role: user?.role,
    },
  });
});

export default authRoutes;
