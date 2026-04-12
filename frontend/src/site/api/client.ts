// Thin fetch wrapper for the site API. Uses VITE_API_BASE when set
// (production reverse-proxies API under the same origin, so default is "").
const API_BASE = (import.meta.env.VITE_API_BASE ?? '') as string;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const TOKEN_KEY = 'ember_site_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth !== false) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      msg = data.detail ?? msg;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
