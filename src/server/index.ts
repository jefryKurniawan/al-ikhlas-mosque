import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { securityHeaders } from './middleware/security-headers.js';
import { csrfProtection, csrfTokenRoute } from './middleware/csrf.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import adminRoutes from './routes/admin.js';

const app = new Hono();

// --- Global Middleware ---
app.use('*', logger());
app.use('*', securityHeaders);
app.use('/api/*', cors({
  origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  credentials: true,
}));

// --- CSRF Token Endpoint (for SPA to fetch token) ---
app.get('/api/csrf-token', csrfTokenRoute);

// --- CSRF Protection (applied before routes, skips OAuth callbacks) ---
app.use('/api/*', async (c, next) => {
  // Skip CSRF for OAuth callbacks (external redirects can't carry CSRF cookies)
  const path = c.req.path;
  if (path.includes('/callback')) {
    await next();
    return;
  }
  return csrfProtection(c, next);
});

// --- API Routes ---
app.route('/api', publicRoutes);
app.route('/api', authRoutes);
app.route('/api', oauthRoutes);
app.route('/api/admin', adminRoutes);

// --- Health Check ---
app.get('/api/health', (c) => {
  return c.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// --- Static Files (production) ---
app.use('/*', serveStatic({ root: './dist' }));

// --- Error Handling ---
app.notFound(notFoundHandler);
app.onError(errorHandler);

// --- Start Server ---
const port = Number(process.env['PORT'] ?? 3000);

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🕌 Al Ikhlas Mosque server running on http://localhost:${info.port}`);
});

// --- Graceful Shutdown ---
function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
