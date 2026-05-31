import type { Context, Next } from 'hono';
import type { ApiError } from '../../shared/types.js';

type ValidationSchema = {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date';
    required?: boolean;
    min?: number;
    max?: number;
    enum?: readonly string[];
  };
};

export function validateBody(schema: ValidationSchema) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const body = await c.req.json().catch(() => null);

    if (!body) {
      const response: ApiError = {
        success: false,
        error: 'Request body tidak valid',
      };
      return c.json(response, 400);
    }

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
      if (rules.enum && !rules.enum.includes(value)) {
        const response: ApiError = {
          success: false,
          error: `Field '${field}' harus salah satu dari: ${rules.enum.join(', ')}`,
        };
        return c.json(response, 400);
      }

      // Min/max for numbers
      if (rules.type === 'number' && rules.min !== undefined && value < rules.min) {
        const response: ApiError = {
          success: false,
          error: `Field '${field}' minimal ${rules.min}`,
        };
        return c.json(response, 400);
      }

      // Min/max length for strings
      if (rules.type === 'string' && rules.min !== undefined && (value as string).length < rules.min) {
        const response: ApiError = {
          success: false,
          error: `Field '${field}' minimal ${rules.min} karakter`,
        };
        return c.json(response, 400);
      }
    }

    await next();
  };
}
