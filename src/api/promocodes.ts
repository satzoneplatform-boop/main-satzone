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

export const promocodesApi = {
  /** Validate a code against a course and return the discounted total. */
  preview(payload: PreviewPromocodePayload) {
    return api.post<PromocodePreview>('/promocodes/preview', { json: payload });
  },
};
