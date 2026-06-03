import { env } from './env';

/**
 * Rewrite an absolute HLS URL onto the same origin our API client uses.
 *
 * Why: backend playback tokens (`?t=…`) are IP-bound, and the manifest
 * embeds **absolute** URLs for segments and the AES-128 key. If hls.js
 * fetches those directly cross-origin, the backend sees the raw TCP
 * source (no `X-Forwarded-For`), the bound IP doesn't match, and every
 * fetch 401s with `playback_ip_mismatch`. Routing through the same
 * proxy origin the rest of the app uses keeps the XFF chain intact.
 */
export function rewriteHlsUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url, window.location.origin);
    const base = env.apiBaseUrl;
    const apiV1 = u.pathname.indexOf('/api/v1');
    const tail = apiV1 >= 0 ? u.pathname.slice(apiV1) : u.pathname;
    if (base.startsWith('/')) {
      // Dev proxy / same-origin reverse proxy mode.
      return `${tail}${u.search}`;
    }
    // Absolute API base in prod: rewrite host but preserve the /api/v1+ tail.
    const baseUrl = new URL(base, window.location.origin);
    return `${baseUrl.origin}${tail}${u.search}`;
  } catch {
    return url;
  }
}
