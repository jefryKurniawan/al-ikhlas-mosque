import { Lucia, TimeSpan } from 'lucia';
import { Mysql2Adapter } from '@lucia-auth/adapter-mysql';
import { pool } from '../db/index.js';

const adapter = new Mysql2Adapter(pool, {
  user: 'users',
  session: 'sessions',
});

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(30, 'd'),
  sessionCookie: {
    attributes: {
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes['username'],
      email: attributes['email'],
      role: attributes['role'],
    };
  },
});

// Generate a unique ID for Lucia
export function generateId(): string {
  return crypto.randomUUID();
}

// Type declarations for Lucia
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string | null;
      email: string | null;
      role: string;
    };
  }
}
