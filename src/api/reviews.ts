import { api } from './client';
import { normalizePage, normalizeReview } from './normalize';
import type { Page, ReviewRead } from '@/types/api';

export interface CreateReviewPayload {
  rating: number;
  comment?: string | null;
}

export interface UpdateReviewPayload {
  rating?: number | null;
  comment?: string | null;
}

export const reviewsApi = {
  async list(
    slug: string,
    params: { page?: number; size?: number } = {},
  ): Promise<Page<ReviewRead>> {
    const raw = await api.get<unknown>(`/courses/${slug}/reviews`, {
      params: params as Record<string, number | undefined>,
    });
    return normalizePage(raw, normalizeReview);
  },
  async create(slug: string, payload: CreateReviewPayload): Promise<ReviewRead> {
    const raw = await api.post<unknown>(`/courses/${slug}/reviews`, { json: payload });
    return normalizeReview(raw);
  },
  async updateMine(slug: string, payload: UpdateReviewPayload): Promise<ReviewRead> {
    const raw = await api.put<unknown>(`/courses/${slug}/reviews/me`, { json: payload });
    return normalizeReview(raw);
  },
  deleteMine(slug: string) {
    return api.delete<void>(`/courses/${slug}/reviews/me`);
  },
};
