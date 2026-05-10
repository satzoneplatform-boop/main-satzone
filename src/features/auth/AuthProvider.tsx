import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginPayload } from '@/api/auth';
import { ApiError } from '@/api/errors';
import { tokenStore } from '@/api/tokenStore';
import type { UserMe } from '@/types/api';

interface AuthContextValue {
  user: UserMe | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (payload: LoginPayload) => Promise<UserMe>;
  logout: () => Promise<void>;
  refresh: () => Promise<UserMe | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserMe | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');

  const refresh = useCallback(async () => {
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus('authenticated');
      return me;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStore.clear();
      }
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  const login = useCallback<AuthContextValue['login']>(
    async (payload) => {
      await authApi.login(payload);
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
