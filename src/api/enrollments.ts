import { api } from './client';
import type { EnrollmentRead, Page } from '@/types/api';
import { normalizeEnrollment, normalizePage } from './normalize';

export interface EnrollmentListParams {
  status?: 'all' | 'active' | 'completed';
  page?: number;
  size?: number;
}

export const enrollmentsApi = {
  async enroll(courseId: string): Promise<EnrollmentRead> {
    const raw = await api.post<unknown>('/me/enrollments', {
      json: { course_id: courseId },
    });
    return normalizeEnrollment(raw);
  },
  async list(params: EnrollmentListParams = {}): Promise<Page<EnrollmentRead>> {
    const raw = await api.get<unknown>('/me/enrollments', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
    return normalizePage(raw, normalizeEnrollment);
  },
  async detail(id: string): Promise<EnrollmentRead> {
    const raw = await api.get<unknown>(`/me/enrollments/${id}`);
    return normalizeEnrollment(raw);
  },
  addToWishlist(courseId: string) {
    return api.post<{ message: string }>(`/me/wishlist/${courseId}`);
  },
  removeFromWishlist(courseId: string) {
    return api.delete<void>(`/me/wishlist/${courseId}`);
  },
};
