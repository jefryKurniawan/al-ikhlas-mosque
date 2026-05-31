/**
 * Basic XSS sanitizer — escapes HTML entities in user input.
 * For display purposes, not a full HTML sanitizer.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize string input — trim whitespace and escape HTML.
 */
export function sanitizeString(input: string): string {
  return escapeHtml(input.trim());
}

/**
 * Validate ISO date format (YYYY-MM-DD).
 */
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(date);
  return !isNaN(d.getTime()) && date === d.toISOString().split('T')[0];
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength — min 8 chars, at least 1 letter and 1 number.
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}
