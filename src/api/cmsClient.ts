import { env } from '@/lib/env';

/**
 * Minimal fetch client for the Results CMS.
 *
 * Deliberately separate from `src/api/client.ts`: that client injects the
 * *site's* JWT and runs a refresh loop, neither of which apply to the CMS. The
 * CMS has its own admin session token (a single shared-password login), stored
 * in localStorage and attached as a Bearer token on admin calls.
 */

const TOKEN_KEY = 'satzone:admin-token';

export const adminToken = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore storage failures */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** Normalized CMS error. `status === 401` means the admin token is missing/expired. */
export class CmsError extends Error {
  status: number;
  code: string;
  details: Record<string, string[]> | null;
  constructor(status: number, code: string, message: string, details: Record<string, string[]> | null = null) {
    super(message);
    this.name = 'CmsError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface CmsRequestOptions {
  /** JSON-encoded automatically. */
  json?: unknown;
  /** Raw body (FormData) — Content-Type is left to the browser. */
  body?: BodyInit;
  /** Attach the admin bearer token. */
  auth?: boolean;
  params?: Record<string, string | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: CmsRequestOptions['params']): string {
  const base = `${env.cmsBaseUrl}${path}`;
  if (!params) return base;
  const isAbsolute = /^https?:\/\//i.test(base);
  const url = new URL(base, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.append(key, value);
  }
  return isAbsolute ? url.toString() : url.pathname + url.search;
}

async function request<T>(method: string, path: string, options: CmsRequestOptions = {}): Promise<T> {
  const { json, body, auth, params, signal } = options;
  const headers = new Headers();
  let finalBody: BodyInit | undefined = body;

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    finalBody = JSON.stringify(json);
  }
  if (auth) {
    const token = adminToken.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(buildUrl(path, params), { method, headers, body: finalBody, signal });

  if (res.status === 401 && auth) {
    adminToken.clear();
  }

  if (!res.ok) {
    let payload: { error?: { code?: string; message?: string; details?: Record<string, string[]> } } | undefined;
    try {
      payload = await res.json();
    } catch {
      /* non-JSON */
    }
    throw new CmsError(
      res.status,
      payload?.error?.code ?? `http_${res.status}`,
      payload?.error?.message ?? res.statusText ?? 'Request failed',
      payload?.error?.details ?? null,
    );
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const cms = {
  get: <T>(path: string, options?: CmsRequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options?: CmsRequestOptions) => request<T>('POST', path, options),
  put: <T>(path: string, options?: CmsRequestOptions) => request<T>('PUT', path, options),
  patch: <T>(path: string, options?: CmsRequestOptions) => request<T>('PATCH', path, options),
  delete: <T>(path: string, options?: CmsRequestOptions) => request<T>('DELETE', path, options),
};
