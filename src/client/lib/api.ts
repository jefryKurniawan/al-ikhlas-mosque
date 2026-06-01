/**
 * API client with CSRF handling for Hono backend.
 * Uses Double Submit Cookie pattern — reads csrf_token cookie,
 * sends it as X-CSRF-Token header on state-changing requests.
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function getCsrfToken(): string {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match?.[1] ?? '';
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };

  // Attach CSRF token for state-changing requests
  if (method !== 'GET' && method !== 'HEAD') {
    headers['X-CSRF-Token'] = getCsrfToken();
    if (!headers['Content-Type'] && options.body) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }

  return json.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(url: string) =>
    request<T>(url, { method: 'DELETE' }),
};
