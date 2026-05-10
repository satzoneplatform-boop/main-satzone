import type { TokenResponse } from '@/types/api';

/**
 * Token store.
 *
 * Per FRONTEND.md §2: access token in memory, refresh token in
 * localStorage as a pragmatic dev default (swap to httpOnly cookie when
 * the backend is ready to set one). Subscribers are notified on every
 * change so React contexts can re-render.
 */

const REFRESH_KEY = 'edure.refresh_token';

let accessToken: string | null = null;
let refreshToken: string | null =
  typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;

type Listener = () => void;
const listeners = new Set<Listener>();

export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },

  getRefresh(): string | null {
    return refreshToken;
  },

  set(tokens: Pick<TokenResponse, 'access_token' | 'refresh_token'>) {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    }
    notify();
  },

  clear() {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REFRESH_KEY);
    }
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

function notify() {
  listeners.forEach((l) => l());
}
