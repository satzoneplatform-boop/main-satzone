import { env } from '@/lib/env';
import type { ApiErrorBody, TokenResponse } from '@/types/api';
import {
  ApiError,
  HARD_LOGOUT_CODES,
  REFRESHABLE_AUTH_CODES,
} from './errors';
import { tokenStore } from './tokenStore';

/**
 * fetch wrapper for the Edure API.
 *
 * Implements the auth refresh loop from FRONTEND.md §2:
 *  - On a refreshable 401, mint a new token pair via /auth/refresh and retry once.
 *  - Concurrent requests share a single in-flight refresh promise (single-flight).
 *  - On hard refresh failure, wipe tokens and dispatch `auth:logout` so the
 *    AuthProvider can route to /login.
 *
 * Error shape from the backend (`{error: {code, message, details}}`) is
 * normalized into ApiError throughout.
 */

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Plain object — JSON-encoded automatically. Skip for FormData/Blob. */
  json?: unknown;
  /** Use raw body (FormData, Blob, string). Sends without setting Content-Type. */
  body?: BodyInit;
  /** Skip the Authorization header even if a token is present. */
  skipAuth?: boolean;
  /** Skip the 401 → refresh → retry loop (used by /auth/refresh itself). */
  skipRefresh?: boolean;
  /** Query params, appended as `?k=v`. Arrays repeat the key. */
  params?: Record<string, string | number | boolean | string[] | undefined | null>;
  /** Override request signal. */
  signal?: AbortSignal;
}

let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`;
  if (!params) return base;
  const url = new URL(base, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)));
    } else {
      url.searchParams.append(key, String(value));
    }
  }
  return url.pathname + url.search;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | undefined;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // non-JSON response; fall through to generic
  }
  const code = body?.error?.code ?? `http_${res.status}`;
  const message = body?.error?.message ?? res.statusText ?? 'Request failed';
  return new ApiError(res.status, code, message, body?.error?.details ?? null);
}

async function tryRefresh(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) {
        const err = await parseError(res);
        if (HARD_LOGOUT_CODES.has(err.code)) {
          tokenStore.clear();
          dispatchEvent(new CustomEvent('auth:logout', { detail: err }));
        }
        return false;
      }
      const tokens = (await res.json()) as TokenResponse;
      tokenStore.set(tokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, body, skipAuth, skipRefresh, params, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | undefined = body;

  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    finalBody = JSON.stringify(json);
  }

  if (!skipAuth) {
    const access = tokenStore.getAccess();
    if (access) finalHeaders.set('Authorization', `Bearer ${access}`);
  }

  const res = await fetch(buildUrl(path, params), {
    ...rest,
    method,
    headers: finalHeaders,
    body: finalBody,
  });

  if (res.status === 401 && !skipRefresh) {
    const err = await parseError(res);
    if (REFRESHABLE_AUTH_CODES.has(err.code) && (await tryRefresh())) {
      // single retry with fresh token
      return request<T>(method, path, { ...options, skipRefresh: true });
    }
    if (err.code === 'invalid_credentials' || err.code === 'email_not_verified') {
      throw err; // surface to login form
    }
    tokenStore.clear();
    dispatchEvent(new CustomEvent('auth:logout', { detail: err }));
    throw err;
  }

  if (!res.ok) {
    const err = await parseError(res);
    // Backend hard-gates every authed endpoint behind phone verification
    // (FRONTEND.md §2). Surface the screen even when the cached /auth/me
    // says the user is verified — AuthProvider listens and refreshes.
    if (res.status === 403 && err.code === 'phone_not_verified') {
      dispatchEvent(new CustomEvent('auth:phone_required', { detail: err }));
    }
    throw err;
  }
  if (res.status === 204) return undefined as T;

  // 200 with empty body (rare) — guard against JSON parse error
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) =>
    request<T>('POST', path, options),
  put: <T>(path: string, options?: RequestOptions) =>
    request<T>('PUT', path, options),
  patch: <T>(path: string, options?: RequestOptions) =>
    request<T>('PATCH', path, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
};
