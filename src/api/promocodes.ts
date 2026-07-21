import { api } from './client';

export type PromocodeDiscountKind = 'percent' | 'fixed';

/**
 * Server-authoritative preview of how much a code shaves off a course price.
 * Mirrors the amounts `POST /orders` will charge — the client never computes
 * the discount itself.
 */
export interface PromocodePreview {
  course_id: string;
  code: string;
  discount_kind: PromocodeDiscountKind;
  discount_value: number;
  original_amount_cents: number;
  discount_cents: number;
  final_amount_cents: number;
  currency: string;
}

export interface PreviewPromocodePayload {
  code: string;
  course_id: string;
}

/**
 * Live status of a saved code, recomputed server-side on every read — a code
 * can expire / be revoked / be used up after it was saved to the wallet.
 */
export type SavedPromocodeStatus = 'usable' | 'expired' | 'used' | 'revoked';

/** One entry in the user's promocode wallet (GET/POST /me/promocodes). */
export interface SavedPromocode {
  /** Wallet-entry id — this (not `promocode_id`) is what DELETE takes. */
  id: string;
  promocode_id: string;
  code: string;
  course_id: string;
  course_title: string | null;
  course_slug: string | null;
  discount_kind: PromocodeDiscountKind;
  discount_value: number;
  expires_at: string | null;
  status: SavedPromocodeStatus;
  /** Convenience boolean: `status === 'usable'`. */
  is_valid: boolean;
  saved_at: string;
}

/**
 * Wallet entry filtered to one course and enriched with the price math
 * (GET /me/promocodes?course_id=…). Discount fields are null when the code
 * is no longer valid.
 */
export interface SavedPromocodeApplicable extends SavedPromocode {
  original_amount_cents: number;
  discount_cents: number | null;
  final_amount_cents: number | null;
  currency: string;
}

export const promocodesApi = {
  /** Validate a code against a course and return the discounted total. */
  preview(payload: PreviewPromocodePayload) {
    return api.post<PromocodePreview>('/promocodes/preview', { json: payload });
  },
  /** Full wallet, newest first (profile screen). */
  listSaved() {
    return api.get<SavedPromocode[]>('/me/promocodes');
  },
  /** Wallet filtered to one course, each entry with the price math (checkout). */
  listSavedForCourse(courseId: string) {
    return api.get<SavedPromocodeApplicable[]>('/me/promocodes', {
      params: { course_id: courseId },
    });
  },
  /** Bookmark a code into the wallet. Validates but does NOT reserve a use. */
  save(code: string) {
    return api.post<SavedPromocode>('/me/promocodes', { json: { code } });
  },
  /** Remove a wallet entry by its `SavedPromocode.id`. */
  remove(savedId: string) {
    return api.delete<void>(`/me/promocodes/${savedId}`);
  },
};
