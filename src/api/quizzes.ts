import { api } from './client';
import type {
  PracticeAttemptCreate,
  PracticeAttemptResult,
  PracticePackStudentRead,
  PracticeQuizStudentRead,
} from '@/types/api';

/**
 * Practice-quizzes API (FRONTEND.md §4.9). Endpoints live on the
 * deployed backend at:
 *   GET  /courses/{course_id}/practice              -> PracticePackStudentRead | null
 *   GET  /practice/quizzes/{quiz_id}                -> PracticeQuizStudentRead
 *   POST /practice/quizzes/{quiz_id}/attempts       -> PracticeAttemptResult
 *
 * Enrollment-gated end-to-end — 403 not_enrolled if the student hasn't
 * bought the parent course. The pack endpoint returns `null` (200) when
 * the instructor hasn't created any quizzes yet; callers must handle
 * that as an empty state.
 */
export const quizzesApi = {
  /** Pack lives on the course. `null` is a valid 200 response. */
  pack(courseId: string) {
    return api.get<PracticePackStudentRead | null>(
      `/courses/${courseId}/practice`,
    );
  },

  /** Full quiz with items (server strips `is_correct` and shuffles matching sides). */
  quiz(quizId: string) {
    return api.get<PracticeQuizStudentRead>(`/practice/quizzes/${quizId}`);
  },

  /** Submit a full play-through. Unlimited replays. */
  submitAttempt(quizId: string, body: PracticeAttemptCreate) {
    return api.post<PracticeAttemptResult>(
      `/practice/quizzes/${quizId}/attempts`,
      { json: body },
    );
  },
};
