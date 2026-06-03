import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizzesApi } from '@/api/quizzes';
import type { QuizAttemptCreatePayload } from '@/types/api';

export function useCourseQuizSets(courseId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-sets', 'by-course', courseId],
    queryFn: () => quizzesApi.listForCourse(courseId!),
    enabled: Boolean(courseId),
    staleTime: 60_000,
    retry: false,
  });
}

export function useQuizSet(setId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-sets', setId],
    queryFn: () => quizzesApi.detail(setId!),
    enabled: Boolean(setId),
    staleTime: 60_000,
    retry: false,
  });
}

export function useMyQuizAttempts(setId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-sets', setId, 'attempts', 'me'],
    queryFn: () => quizzesApi.myAttempts(setId!),
    enabled: Boolean(setId),
    staleTime: 30_000,
    retry: false,
  });
}

export function useRecordQuizAttempt(setId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuizAttemptCreatePayload) =>
      quizzesApi.recordAttempt(setId!, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['quiz-sets', setId, 'attempts', 'me'],
      });
    },
  });
}
