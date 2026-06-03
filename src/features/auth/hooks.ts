import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
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
    case 'phone_code_expired':
      return 'That code expired. Open the bot again to get a fresh one.';
    case 'phone_code_attempts_exceeded':
      return 'Too many wrong codes. Request a new one.';
    case 'phone_taken':
      return 'This phone number is already in use.';
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

/**
 * Submit the 6-to-8 digit OTP the Telegram bot DM'd the user.
 * POST /auth/verify-phone { otp }.
 */
export function useVerifyPhone() {
  return useMutation({ mutationFn: (otp: string) => authApi.verifyPhone(otp) });
}

/** Top-level navigation to the backend's Google OAuth start endpoint. */
export function googleSignInUrl(): string {
  return `${env.apiBaseUrl}/auth/google/login`;
}
