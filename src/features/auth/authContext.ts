import { createContext } from 'react';
import type { LoginCredentials } from '@/api/auth';
import type { UserMe } from '@/types/api';

export interface AuthContextValue {
  user: UserMe | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  /** Pass `{email, password}` for email login or `{phone_number, password}` for phone login. */
  login: (payload: LoginCredentials) => Promise<UserMe>;
  logout: () => Promise<void>;
  refresh: () => Promise<UserMe | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
