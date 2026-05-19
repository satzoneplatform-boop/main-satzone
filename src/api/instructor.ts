import { api } from './client';
import type {
  AssessmentSummary,
  AssessmentUpdatePayload,
  Page,
} from '@/types/api';

export interface InstructorProfileRead {
  id: string;
  user_id: string | null;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export interface InstructorProfileUpsertPayload {
  name: string;
  title?: string | null;
  bio?: string | null;
}

/**
 * Instructor-only endpoints. Requires `user.role === 'instructor'` (or
 * 'admin'); the backend returns 403 `instructor_role_required` otherwise.
 */
export const instructorApi = {
  listCourseAssessments(
    courseId: string,
    params: { page?: number; size?: number } = {},
  ) {
    return api.get<Page<AssessmentSummary>>(
      `/instructor/courses/${courseId}/assessments`,
      { params: params as Record<string, number | undefined> },
    );
  },

  updateAssessment(assessmentId: string, payload: AssessmentUpdatePayload) {
    return api.patch<AssessmentSummary>(
      `/instructor/assessments/${assessmentId}`,
      { json: payload },
    );
  },

  getMyProfile() {
    return api.get<InstructorProfileRead>('/instructor/me/profile');
  },
  upsertMyProfile(payload: InstructorProfileUpsertPayload) {
    return api.put<InstructorProfileRead>('/instructor/me/profile', { json: payload });
  },
};

/** Admin-only — backend returns 403 unless `user.role === 'admin'`. */
export const adminApi = {
  /** Reassign a course to a different instructor. */
  updateCourse(courseId: string, payload: { instructor_id?: string }) {
    return api.patch<unknown>(`/admin/courses/${courseId}`, { json: payload });
  },
};
