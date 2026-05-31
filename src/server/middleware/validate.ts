import type { Context, Next } from 'hono';
import type { ApiError } from '../../shared/types.js';
import { sanitizeString } from '../lib/sanitize.js';

type ValidationSchema = {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date';
    required?: boolean;
    min?: number;
    max?: number;
    enum?: readonly string[];
  };
};

/**
 * Recursively sanitize all string values in an object.
 * Trims whitespace and escapes HTML entities.
 */
function sanitizeBody(obj: unknown): unknown {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeBody);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = sanitizeBody(value);
    }
    return result;
  }
  return obj;
}

export function validateBody(schema: ValidationSchema) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const raw = await c.req.json().catch(() => null);

    if (!raw) {
      const response: ApiError = {
        success: false,
        error: 'Request body tidak valid',
      };
      return c.json(response, 400);
    }

    // Sanitize all string fields in the body
    const body = sanitizeBody(raw) as Record<string, unknown>;

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        const response: ApiError = {
          success: false,
          error: `Field '${field}' wajib diisi`,
        };
        return c.json(response, 400);
      }

      // Skip optional empty fields
      if (!rules.required && (value === undefined || value === null)) continue;

      // Type check
      if (rules.type === 'number' && typeof value !== 'number') {
        const response: ApiError = {
          success: false,
          error: `Field '${field}' harus berupa angka`,
        };
        return c.json(response, 400);
      }

      if (rules.type === 'string' && typeof value !== 'string') {
        const response: ApiError = {
          success: false,
          error: `Field '${field}' harus berupa teks`,
        };
        return c.json(response, 400);
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value as string)) {
        const response: ApiError = {
          success: false,
          error: `Field '${field}' harus salah satu dari: ${rules.enum.join(', ')}`,
        };
        return c.json(response, 400);
      }

      // Min/max for numbers
      if (rules.type === 'number') {
        if (rules.min !== undefined && (value as number) < rules.min) {
          const response: ApiError = {
            success: false,
            error: `Field '${field}' minimal ${rules.min}`,
          };
          return c.json(response, 400);
        }
        if (rules.max !== undefined && (value as number) > rules.max) {
          const response: ApiError = {
            success: false,
            error: `Field '${field}' maksimal ${rules.max}`,
          };
          return c.json(response, 400);
        }
      }

      // Min/max length for strings
      if (rules.type === 'string') {
        if (rules.min !== undefined && (value as string).length < rules.min) {
          const response: ApiError = {
            success: false,
            error: `Field '${field}' minimal ${rules.min} karakter`,
          };
          return c.json(response, 400);
        }
        if (rules.max !== undefined && (value as string).length > rules.max) {
          const response: ApiError = {
            success: false,
            error: `Field '${field}' maksimal ${rules.max} karakter`,
          };
          return c.json(response, 400);
        }
      }
    }

    // Store sanitized body in context for route handlers
    c.set('body', body);
    await next();
  };
}

/**
 * Global body sanitization middleware for routes without validateBody.
 * Parses JSON, sanitizes all string values, and stores in context.
 */
export async function sanitizeMiddleware(c: Context, next: Next): Promise<void> {
  if (c.req.header('content-type')?.includes('application/json')) {
    const raw = await c.req.json().catch(() => null);
    if (raw) {
      c.set('body', sanitizeBody(raw));
    }
  }
  await next();
}

// Reusable report validation schema
export const reportSchema = {
  type: { type: 'string' as const, required: true, enum: ['bulanan', 'tahunan', 'setelah_idul_adha', 'setelah_idul_fitri', 'sebelum_ramadhan'] },
  year: { type: 'number' as const, required: true, min: 2000, max: 2100 },
  month: { type: 'number' as const, required: false, min: 1, max: 12 },
};
