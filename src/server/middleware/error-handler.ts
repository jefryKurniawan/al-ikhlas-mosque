import type { Context } from 'hono';
import type { ApiError } from '../../shared/types.js';

export function errorHandler(err: Error, c: Context): Response {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const response: ApiError = {
    success: false,
    error: process.env['NODE_ENV'] === 'production'
      ? 'Terjadi kesalahan server'
      : err.message,
  };

  return c.json(response, 500);
}

export function notFoundHandler(c: Context): Response {
  const response: ApiError = {
    success: false,
    error: 'Endpoint tidak ditemukan',
  };
  return c.json(response, 404);
}
