import { api } from './client';
import type {
  QuizAttemptCreatePayload,
  QuizAttemptRead,
  QuizSetRead,
  QuizSetSummary,
} from '@/types/api';

/**
 * Quiz-games endpoints (Duolingo-style vocabulary practice).
 *
 * Backend contract lives in BACKEND-QUIZGAMES.md at repo root. These calls
 * will 404 until the satzone backend ships the `/quiz-sets/*` router; the
 * frontend handles empty / error states gracefully.
 */
export const quizzesApi = {
  /** List published sets in a course (Duolingo path entries). */
  listForCourse(courseId: string) {
    return api.get<QuizSetSummary[]>(`/courses/${courseId}/quiz-sets`);
  },

  /** Get a single set with all its items — payload for the game runner. */
  detail(setId: string) {
    return api.get<QuizSetRead>(`/quiz-sets/${setId}`);
  },

  /** Persist a finished game session. */
  recordAttempt(setId: string, payload: QuizAttemptCreatePayload) {
    return api.post<QuizAttemptRead>(`/quiz-sets/${setId}/attempts`, {
      json: payload,
    });
  },

  /** History of my plays of this set (best score, last attempt, etc.). */
  myAttempts(setId: string) {
    return api.get<QuizAttemptRead[]>(`/quiz-sets/${setId}/attempts/me`);
  },
};
