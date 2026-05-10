import { api } from './client';
import type { LessonAttachmentRead, LessonPlaybackResponse } from '@/types/api';

export interface LessonProgressUpdate {
  last_position_seconds?: number;
  watched_seconds?: number;
  completed?: boolean;
}

export interface LessonProgressRead {
  enrollment_id: string;
  lesson_id: string;
  last_position_seconds: number;
  watched_seconds: number;
  completed: boolean;
  completed_at: string | null;
}

export const lessonsApi = {
  /** Mints a short-lived HLS playback token (FRONTEND.md §5.1). */
  playback(lessonId: string) {
    return api.get<LessonPlaybackResponse>(`/lessons/${lessonId}/playback`);
  },
  /**
   * Throttle these — once every ~10s during playback is plenty
   * (FRONTEND.md §4.6).
   */
  updateProgress(
    enrollmentId: string,
    lessonId: string,
    payload: LessonProgressUpdate,
  ) {
    return api.put<LessonProgressRead>(
      `/me/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      { json: payload },
    );
  },
  listAttachments(lessonId: string) {
    return api.get<LessonAttachmentRead[]>(`/lessons/${lessonId}/attachments`);
  },
  /** Server-side DRM license issuer; usually called by the player, not the UI. */
  issueDrmLicense(lessonId: string) {
    return api.post<unknown>(`/lessons/${lessonId}/drm/license`);
  },
};
