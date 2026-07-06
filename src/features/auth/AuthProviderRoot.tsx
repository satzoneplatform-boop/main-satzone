import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, isPhoneLogin } from '@/api/auth';
import { ApiError } from '@/api/errors';
import { tokenStore } from '@/api/tokenStore';
import type { UserMe } from '@/types/api';
import { AuthContext, type AuthContextValue } from './authContext';

type AuthSnapshot = {
  user: UserMe | null;
  status: 'authenticated' | 'unauthenticated';
};

/**
 * Resolve the current auth state from the token store + /auth/me. Kept
 * outside the component so `refresh` only touches React state after the
 * await — no synchronous setState inside the bootstrap effect.
 */
async function resolveAuthState(): Promise<AuthSnapshot> {
  if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
    return { user: null, status: 'unauthenticated' };
  }
  try {
    const me = await authApi.me();
    return { user: me, status: 'authenticated' };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      tokenStore.clear();
    }
    return { user: null, status: 'unauthenticated' };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserMe | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');

  const refresh = useCallback(async () => {
    const next = await resolveAuthState();
    setUser(next.user);
    setStatus(next.status);
    return next.user;
  }, []);

  // Bootstrap: resolve the session once on mount. State is only set from
  // the promise callback, never synchronously in the effect body.
  useEffect(() => {
    void resolveAuthState().then((next) => {
      setUser(next.user);
      setStatus(next.status);
    });
  }, []);

  // Listen for hard-logout signals from the API client.
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setStatus('unauthenticated');
      queryClient.clear();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [queryClient]);

  // Listen for the global phone-verify gate from the API client. When the
  // backend returns 403 phone_not_verified we re-read /auth/me — that
  // refresh flips `is_phone_verified` to false, RequireAuth notices on
  // the next render and routes the user to /verify-phone.
  useEffect(() => {
    const handler = () => {
      void refresh();
    };
    window.addEventListener('auth:phone_required', handler);
    return () => window.removeEventListener('auth:phone_required', handler);
  }, [refresh]);

  const login = useCallback<AuthContextValue['login']>(
    async (payload) => {
      if (isPhoneLogin(payload)) {
        await authApi.loginByPhone(payload);
      } else {
        await authApi.login(payload);
      }
      const me = await authApi.me();
      setUser(me);
      setStatus('authenticated');
      return me;
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refresh }),
    [user, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
