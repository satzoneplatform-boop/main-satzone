import type {
  CourseDetail,
  CourseSummary,
  CoursePreviewPlaybackResponse,
  CurriculumRead,
  HomeFeed,
  LessonPlaybackResponse,
  Page,
} from '@/types/api';
import { api } from './client';
import {
  normalizeCourseDetail,
  normalizeCourseSummary,
  normalizeHomeFeed,
  normalizePage,
} from './normalize';

export interface CourseFilters {
  search?: string;
  category_id?: string;
  category_slug?: string;
  instructor_id?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  is_free?: boolean;
  min_rating?: number;
  min_duration_minutes?: number;
  max_duration_minutes?: number;
  tags?: string[];
  sort?: 'popular' | 'newest' | 'rating' | 'price_asc' | 'price_desc';
  page?: number;
  size?: number;
}

export const coursesApi = {
  async home(): Promise<HomeFeed> {
    const raw = await api.get<unknown>('/home');
    return normalizeHomeFeed(raw);
  },

  async list(filters: CourseFilters = {}): Promise<Page<CourseSummary>> {
    const raw = await api.get<unknown>('/courses', {
      params: filters as Record<string, string | number | boolean | string[] | undefined>,
    });
    return normalizePage(raw, normalizeCourseSummary);
  },

  async detail(slug: string): Promise<CourseDetail> {
    const raw = await api.get<unknown>(`/courses/${slug}`);
    return normalizeCourseDetail(raw);
  },

  curriculum(slug: string) {
    return api.get<CurriculumRead>(`/courses/${slug}/curriculum`);
  },

  async related(slug: string): Promise<CourseSummary[]> {
    const raw = await api.get<unknown[]>(`/courses/${slug}/related`);
    return Array.isArray(raw) ? raw.map(normalizeCourseSummary) : [];
  },

  /** Mints a short-lived signed URL for the course preview MP4 (§5.2). */
  previewPlayback(slug: string) {
    return api.get<CoursePreviewPlaybackResponse>(
      `/courses/${slug}/preview-playback`,
    );
  },

  /** Mints an HLS playback token for a lesson (§5.1). */
  lessonPlayback(lessonId: string) {
    return api.get<LessonPlaybackResponse>(`/lessons/${lessonId}/playback`);
  },
};
