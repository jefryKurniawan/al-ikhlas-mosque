import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const app = new Hono();

// --- Global Middleware ---
app.use('*', logger());
app.use('/api/*', cors({
  origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  credentials: true,
}));

// --- API Routes ---
app.route('/api', publicRoutes);
app.route('/api', authRoutes);
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

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🕌 Al Ikhlas Mosque server running on http://localhost:${info.port}`);
});
