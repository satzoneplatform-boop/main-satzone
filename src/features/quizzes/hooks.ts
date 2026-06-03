import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizzesApi } from '@/api/quizzes';
import type { PracticeAttemptCreate } from '@/types/api';

/** Pack lookup by course UUID. `null` data === pack not created yet (200). */
export function useCoursePracticePack(courseId: string | undefined) {
  return useQuery({
    queryKey: ['practice', 'pack', courseId],
    queryFn: () => quizzesApi.pack(courseId!),
    enabled: Boolean(courseId),
    staleTime: 60_000,
    retry: false,
  });
}

/** Single quiz with items. */
export function usePracticeQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: ['practice', 'quiz', quizId],
    queryFn: () => quizzesApi.quiz(quizId!),
    enabled: Boolean(quizId),
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * Submit a finished play-through. On success, invalidate the pack so
 * `best_score_percent` / `attempts_count` refresh on the course path.
 */
export function useSubmitPracticeAttempt(
  quizId: string | undefined,
  courseId: string | undefined,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PracticeAttemptCreate) =>
      quizzesApi.submitAttempt(quizId!, body),
    onSuccess: () => {
      if (courseId) {
        void qc.invalidateQueries({ queryKey: ['practice', 'pack', courseId] });
      }
      if (quizId) {
        void qc.invalidateQueries({ queryKey: ['practice', 'quiz', quizId] });
      }
    },
  });
}
