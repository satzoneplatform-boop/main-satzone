import type { ValidationFieldError } from '@/types/api';

/**
 * Normalized error thrown by the API client.
 *
 * `code` is the stable machine string from the backend's error envelope
 * (FRONTEND.md §3) — branch UI on this, not on `message`.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  isValidation(): this is ApiError & { details: ValidationFieldError[] } {
    return this.code === 'validation_error' && Array.isArray(this.details);
  }

  /** Pull a per-field message out of a 422 envelope by field name. */
  fieldError(field: string): string | undefined {
    if (!this.isValidation()) return undefined;
    const hit = this.details.find((d) => d.loc[d.loc.length - 1] === field);
    return hit?.msg;
  }
}

/** Auth errors that should trigger the access-token refresh loop. */
export const REFRESHABLE_AUTH_CODES = new Set([
  'missing_token',
  'invalid_token',
  'invalid_user',
]);

/** Refresh-endpoint errors that mean "wipe state, send to /login". */
export const HARD_LOGOUT_CODES = new Set([
  'token_reuse',
  'invalid_refresh_token',
  'refresh_expired',
]);
