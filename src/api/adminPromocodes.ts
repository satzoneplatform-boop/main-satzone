import { api } from './client';
import type { Page } from '@/types/api';
import type { PromocodeDiscountKind } from './promocodes';

export type PromoStatusFilter =
  | 'all'
  | 'active'
  | 'scheduled'
  | 'expired'
  | 'archived'
  | 'exhausted';

export type RedemptionStatus = 'reserved' | 'confirmed' | 'released';

/** Mirrors the backend `AdminPromocodeRead`. */
export interface AdminPromocode {
  id: string;
  code: string;
  description: string | null;
  discount_kind: PromocodeDiscountKind;
  discount_value: number;
  course_id: string | null;
  instructor_id: string | null;
  created_by_user_id: string | null;
  applies_to_all_courses: boolean;
  max_uses: number;
  uses_count: number;
  per_user_limit: number | null;
  min_purchase_cents: number | null;
  first_purchase_only: boolean;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface AdminPromocodeStats {
  confirmed_count: number;
  reserved_count: number;
  released_count: number;
  total_uses: number;
  max_uses: number;
  total_discount_cents: number;
  revenue_after_discount_cents: number;
}

export interface AdminRedemption {
  id: string;
  promocode_id: string;
  user_id: string;
  order_id: string | null;
  status: RedemptionStatus;
  discount_cents: number;
  confirmed_at: string | null;
  released_at: string | null;
  created_at: string;
}

export interface AdminPromocodeCreatePayload {
  code: string;
  description?: string | null;
  discount_kind: PromocodeDiscountKind;
  discount_value: number;
  course_id?: string | null;
  applies_to_all_courses: boolean;
  max_uses: number;
  per_user_limit?: number | null;
  min_purchase_cents?: number | null;
  first_purchase_only: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
}

export type AdminPromocodeUpdatePayload = Partial<AdminPromocodeCreatePayload>;

/** Minimal course shape for the eligibility selector (from GET /admin/courses). */
export interface AdminCourseOption {
  id: string;
  title: string;
  slug: string;
}

export const adminPromocodesApi = {
  list(params: { q?: string; status?: PromoStatusFilter; page?: number; size?: number }) {
    return api.get<Page<AdminPromocode>>('/admin/promocodes', {
      params: params as Record<string, string | number | undefined>,
    });
  },
  get(id: string) {
    return api.get<AdminPromocode>(`/admin/promocodes/${id}`);
  },
  create(payload: AdminPromocodeCreatePayload) {
    return api.post<AdminPromocode>('/admin/promocodes', { json: payload });
  },
  update(id: string, payload: AdminPromocodeUpdatePayload) {
    return api.patch<AdminPromocode>(`/admin/promocodes/${id}`, { json: payload });
  },
  activate(id: string) {
    return api.post<AdminPromocode>(`/admin/promocodes/${id}/activate`, {});
  },
  deactivate(id: string) {
    return api.post<AdminPromocode>(`/admin/promocodes/${id}/deactivate`, {});
  },
  archive(id: string) {
    return api.post<AdminPromocode>(`/admin/promocodes/${id}/archive`, {});
  },
  unarchive(id: string) {
    return api.post<AdminPromocode>(`/admin/promocodes/${id}/unarchive`, {});
  },
  stats(id: string) {
    return api.get<AdminPromocodeStats>(`/admin/promocodes/${id}/stats`);
  },
  redemptions(id: string, params: { page?: number; size?: number } = {}) {
    return api.get<Page<AdminRedemption>>(`/admin/promocodes/${id}/redemptions`, {
      params: params as Record<string, number | undefined>,
    });
  },
  /** Course options for the eligibility selector. */
  listCourses(params: { q?: string; size?: number } = {}) {
    return api.get<Page<AdminCourseOption>>('/admin/courses', {
      params: { size: 100, ...params } as Record<string, string | number | undefined>,
    });
  },
};
