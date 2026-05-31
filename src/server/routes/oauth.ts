import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { lucia, generateId } from '../lib/auth.js';
import db from '../db/index.js';
import { users } from '../db/schema.js';
import type { User } from '../../shared/types.js';

const oauthRoutes = new Hono();

// ============================================================
// Google OAuth
// ============================================================

oauthRoutes.get('/login/google', async (c) => {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const redirectUri = process.env['GOOGLE_REDIRECT_URI'] ?? `${getBaseUrl(c)}/api/login/google/callback`;

  if (!clientId) {
    return c.json({ success: false, error: 'Google OAuth belum dikonfigurasi' }, 500);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

oauthRoutes.get('/login/google/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) {
    return c.json({ success: false, error: 'Code tidak ditemukan' }, 400);
  }

  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
  const redirectUri = process.env['GOOGLE_REDIRECT_URI'] ?? `${getBaseUrl(c)}/api/login/google/callback`;

  if (!clientId || !clientSecret) {
    return c.json({ success: false, error: 'Google OAuth belum dikonfigurasi' }, 500);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error('Gagal menukar code dengan token');
    }

    const tokenData = await tokenRes.json() as Record<string, unknown>;
    const accessToken = tokenData['access_token'] as string;

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      throw new Error('Gagal mengambil data user dari Google');
    }

    const googleUser = await userRes.json() as Record<string, unknown>;
    const email = googleUser['email'] as string;
    const name = googleUser['name'] as string;
    const googleId = googleUser['id'] as string;

    // Find or create user
    const user = await findOrCreateOAuthUser('google', googleId, email, name);
    await createSessionAndRedirect(c, user);

    return c.redirect('/admin');
  } catch (err) {
    console.error('Google OAuth error:', err);
    return c.redirect('/login?error=google_failed');
  }
});

// ============================================================
// Apple OAuth
// ============================================================

oauthRoutes.get('/login/apple', async (c) => {
  const clientId = process.env['APPLE_CLIENT_ID'];
  const redirectUri = process.env['APPLE_REDIRECT_URI'] ?? `${getBaseUrl(c)}/api/login/apple/callback`;

  if (!clientId) {
    return c.json({ success: false, error: 'Apple OAuth belum dikonfigurasi' }, 500);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'name email',
    response_mode: 'form_post',
  });

  return c.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
});

oauthRoutes.post('/login/apple/callback', async (c) => {
  const body = await c.req.parseBody();
  const code = body['code'] as string | undefined;

  if (!code) {
    return c.json({ success: false, error: 'Code tidak ditemukan' }, 400);
  }

  const clientId = process.env['APPLE_CLIENT_ID'];
  const teamId = process.env['APPLE_TEAM_ID'];
  const keyId = process.env['APPLE_KEY_ID'];
  const privateKey = process.env['APPLE_PRIVATE_KEY'];
  const redirectUri = process.env['APPLE_REDIRECT_URI'] ?? `${getBaseUrl(c)}/api/login/apple/callback`;

  if (!clientId || !teamId || !keyId || !privateKey) {
    return c.json({ success: false, error: 'Apple OAuth belum dikonfigurasi' }, 500);
  }

  try {
    // Create client secret JWT
    const clientSecret = await createAppleClientSecret(teamId, clientId, keyId, privateKey);

    // Exchange code for tokens
    const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error('Gagal menukar code dengan token Apple');
    }

    const tokenData = await tokenRes.json() as Record<string, unknown>;
    const idToken = tokenData['id_token'] as string;

    // Decode id_token (JWT) to get user info
    const payload = decodeJwt(idToken);
    const appleId = payload['sub'] as string;
    const email = payload['email'] as string | undefined;

    // Apple might send name in the first auth only
    const user = await findOrCreateOAuthUser('apple', appleId, email ?? null, null);
    await createSessionAndRedirect(c, user);

    return c.redirect('/admin');
  } catch (err) {
    console.error('Apple OAuth error:', err);
    return c.redirect('/login?error=apple_failed');
  }
});

// ============================================================
// Helpers
// ============================================================

function getBaseUrl(c: { req: { url: string } }): string {
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}`;
}

async function findOrCreateOAuthUser(
  provider: 'google' | 'apple',
  providerId: string,
  email: string | null,
  name: string | null
): Promise<User> {
  // Find existing user by provider + provider_id
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.providerId, providerId));

  if (existing) {
    return {
      id: existing.id as User['id'],
      username: existing.username,
      email: existing.email,
      passwordHash: existing.passwordHash,
      provider: existing.provider as User['provider'],
      providerId: existing.providerId,
      role: existing.role as User['role'],
      createdAt: String(existing.createdAt),
    };
  }

  // Find by email (link accounts)
  if (email) {
    const [byEmail] = await db.select().from(users).where(eq(users.email, email));
    if (byEmail) {
      // Link OAuth to existing account
      await db.update(users).set({ provider, providerId }).where(eq(users.id, byEmail.id));
      return {
        id: byEmail.id as User['id'],
        username: byEmail.username,
        email: byEmail.email,
        passwordHash: byEmail.passwordHash,
        provider,
        providerId,
        role: byEmail.role as User['role'],
        createdAt: String(byEmail.createdAt),
      };
    }
  }

  // Create new user
  const userId = generateId();
  await db.insert(users).values({
    id: userId,
    username: name ?? email?.split('@')[0] ?? userId.slice(0, 8),
    email,
    provider,
    providerId,
    role: 'admin',
  });

  const [newRow] = await db.select().from(users).where(eq(users.id, userId));
  return {
    id: newRow!.id as User['id'],
    username: newRow!.username,
    email: newRow!.email,
    passwordHash: newRow!.passwordHash,
    provider: newRow!.provider as User['provider'],
    providerId: newRow!.providerId,
    role: newRow!.role as User['role'],
    createdAt: String(newRow!.createdAt),
  };
}

async function createSessionAndRedirect(c: { header: (name: string, value: string) => void }, user: User): Promise<void> {
  const session = await lucia.createSession(user.id, {});
  const cookie = lucia.createSessionCookie(session.id);
  c.header('Set-Cookie', cookie.serialize());
}

function decodeJwt(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');
  const payload = parts[1]!;
  const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
  return JSON.parse(decoded) as Record<string, unknown>;
}

async function createAppleClientSecret(
  teamId: string,
  clientId: string,
  keyId: string,
  privateKey: string
): Promise<string> {
  // Simple JWT creation for Apple client secret
  const header = { alg: 'ES256', kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 3600 * 24 * 180, // 180 days
    aud: 'https://appleid.apple.com',
    sub: clientId,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Note: In production, use a proper JWT library with ES256 signing
  // For now, return a placeholder that will need proper implementation
  return `${headerB64}.${payloadB64}.SIGNATURE_NEEDED`;
}

export default oauthRoutes;
