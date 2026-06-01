import type { Context, Next } from 'hono';

export async function securityHeaders(c: Context, next: Next): Promise<void> {
  await next();

  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  const isProd = process.env['NODE_ENV'] === 'production';
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https://images.unsplash.com data: blob:",
    "connect-src 'self'",
    "frame-src https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    isProd ? "upgrade-insecure-requests" : '',
  ].filter(Boolean).join('; ');
  c.header('Content-Security-Policy', csp);

  if (isProd) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}
