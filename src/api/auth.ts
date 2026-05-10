import type { TokenResponse, UserMe } from '@/types/api';
import { api } from './client';
import { tokenStore } from './tokenStore';

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  /** 202 — verification email sent. Do not auto-login after this. */
  register(payload: RegisterPayload) {
    return api.post<{ message: string }>('/auth/register', {
      json: payload,
      skipAuth: true,
    });
  },

  async login(payload: LoginPayload): Promise<TokenResponse> {
    const tokens = await api.post<TokenResponse>('/auth/login', {
      json: payload,
      skipAuth: true,
    });
    tokenStore.set(tokens);
    return tokens;
  },

  async logout(): Promise<void> {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) {
        await api.post<{ message: string }>('/auth/logout', {
          json: { refresh_token: refresh },
          skipAuth: true,
          skipRefresh: true,
        });
      }
    } finally {
      tokenStore.clear();
    }
  },

  verifyEmail(token: string) {
    return api.post<{ message: string }>('/auth/verify-email', {
      json: { token },
      skipAuth: true,
    });
  },

  resendVerification(email: string) {
    return api.post<{ message: string }>('/auth/resend-verification', {
      json: { email },
      skipAuth: true,
    });
  },

  forgotPassword(email: string) {
    return api.post<{ message: string }>('/auth/password/forgot', {
      json: { email },
      skipAuth: true,
    });
  },

  resetPassword(token: string, newPassword: string) {
    return api.post<{ message: string }>('/auth/password/reset', {
      json: { token, new_password: newPassword },
      skipAuth: true,
    });
  },

  /** Phone-verify gate — see FRONTEND.md §2 */
  submitPhone(phoneNumber: string) {
    return api.post<{ message: string }>('/auth/phone', {
      json: { phone_number: phoneNumber },
    });
  },

  verifyPhone(code: string) {
    return api.post<{ message: string }>('/auth/verify-phone', {
      json: { code },
    });
  },

  resendPhoneCode() {
    return api.post<{ message: string }>('/auth/resend-phone-code');
  },

  me() {
    return api.get<UserMe>('/auth/me');
  },
};
