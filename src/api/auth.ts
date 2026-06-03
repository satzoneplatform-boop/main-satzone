import type { TokenResponse, UserMe } from '@/types/api';
import { api } from './client';
import { tokenStore } from './tokenStore';

/**
 * Auth API client — shapes match the live OpenAPI at
 * https://api.satzone.dev/docs (POST /auth/register,
 * POST /auth/login, POST /auth/login/phone, POST /auth/verify-phone,
 * etc.).
 *
 * Phone collection is NOT part of registration — `/auth/register`
 * accepts only {email, full_name, password}. Phone is set later via
 * the Telegram-bot OTP flow: user opens the bot, shares their phone,
 * the bot calls /internal/phone/issue-otp, DMs the OTP to the user,
 * the frontend posts the OTP to /auth/verify-phone.
 */

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
}

export interface LoginByEmailPayload {
  email: string;
  password: string;
}

export interface LoginByPhonePayload {
  phone_number: string;
  password: string;
}

export type LoginCredentials = LoginByEmailPayload | LoginByPhonePayload;

export function isPhoneLogin(p: LoginCredentials): p is LoginByPhonePayload {
  return 'phone_number' in p;
}

export const authApi = {
  /** 202 — verification email sent. Do not auto-login after this. */
  register(payload: RegisterPayload) {
    return api.post<{ message: string }>('/auth/register', {
      json: payload,
      skipAuth: true,
    });
  },

  async login(payload: LoginByEmailPayload): Promise<TokenResponse> {
    const tokens = await api.post<TokenResponse>('/auth/login', {
      json: payload,
      skipAuth: true,
    });
    tokenStore.set(tokens);
    return tokens;
  },

  async loginByPhone(payload: LoginByPhonePayload): Promise<TokenResponse> {
    const tokens = await api.post<TokenResponse>('/auth/login/phone', {
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

  /**
   * Submit the OTP DM'd by the Telegram bot. Backend looks the phone
   * up by OTP in Redis, stamps it onto users.phone_number, and flips
   * is_phone_verified true.
   */
  verifyPhone(otp: string) {
    return api.post<{ message: string }>('/auth/verify-phone', {
      json: { otp },
    });
  },

  me() {
    return api.get<UserMe>('/auth/me');
  },
};
