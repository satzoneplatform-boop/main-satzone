import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { telegramApi } from '@/api/telegram';
import { ApiError } from '@/api/errors';
import { env } from '@/lib/env';

/** Map common backend error codes into a single human-readable message. */
export function authErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (!(err instanceof ApiError)) return fallback;
  switch (err.code) {
    case 'invalid_credentials':
      return 'Invalid email or password.';
    case 'email_not_verified':
      return 'Please verify your email — check your inbox for the link.';
    case 'oauth_only':
      return 'This account uses Google sign-in.';
    case 'account_disabled':
      return 'This account has been disabled.';
    case 'email_taken':
      return 'An account with this email already exists.';
    case 'rate_limited':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'invalid_phone_code':
      return 'Wrong or expired code. Please try again.';
    case 'phone_code_attempts_exceeded':
      return 'Too many wrong codes. Request a new one.';
    case 'phone_taken':
      return 'This phone number is already in use.';
    case 'phone_not_submitted':
      return 'Please submit your phone number first.';
    case 'invalid_refresh_token':
    case 'refresh_expired':
    case 'token_reuse':
      return 'Your session expired. Please sign in again.';
    case 'validation_error':
      return err.fieldError('password') ?? err.fieldError('email') ?? err.message;
    default:
      return err.message || fallback;
  }
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email: string) => authApi.resendVerification(email) });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
  });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: (token: string) => authApi.verifyEmail(token) });
}

export function useSubmitPhone() {
  return useMutation({ mutationFn: (phone: string) => authApi.submitPhone(phone) });
}

export function useVerifyPhone() {
  return useMutation({ mutationFn: (code: string) => authApi.verifyPhone(code) });
}

export function useResendPhoneCode() {
  return useMutation({ mutationFn: () => authApi.resendPhoneCode() });
}

/** Top-level navigation to the backend's Google OAuth start endpoint. */
export function googleSignInUrl(): string {
  // Strip the trailing /api/v1 if env.apiBaseUrl already points at it.
  return `${env.apiBaseUrl}/auth/google/login`;
}

/**
 * Mint a Telegram-bot verification link. Call once when the verify page
 * mounts; the resulting `state` feeds the polling hook below.
 */
export function useInitTelegram() {
  return useMutation({ mutationFn: () => telegramApi.init() });
}

/**
 * Poll `/auth/telegram/status` every 2 s while `state` is set. Stops
 * polling automatically once the response says `verified` or `expired`.
 * Returns the typed status object so the page can react to verified ↔
 * expired transitions.
 */
export function useTelegramStatus(state: string | null) {
  return useQuery({
    queryKey: ['telegram', 'status', state],
    queryFn: () => telegramApi.status(state!),
    enabled: Boolean(state),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 2000;
      if (d.verified || d.expired) return false;
      return 2000;
    },
    // Token may be redeemed on a different device; keep polling reliably.
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: false,
  });
}
