import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assessmentsApi, type SubmissionAnswerWrite } from '@/api/assessments';
import { enrollmentsApi, type EnrollmentListParams } from '@/api/enrollments';
import { lessonsApi, type LessonProgressUpdate } from '@/api/lessons';
import { meApi, type CreateNotePayload } from '@/api/me';

export function useMyEnrollments(params: EnrollmentListParams = {}) {
  return useQuery({
    queryKey: ['enrollments', params],
    queryFn: () => enrollmentsApi.list(params),
    staleTime: 30_000,
  });
}

export function useLessonPlayback(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson', lessonId, 'playback'],
    queryFn: () => lessonsApi.playback(lessonId!),
    enabled: Boolean(lessonId),
    // Don't cache stale playback URLs — they're IP-bound and short-lived.
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    // Poll while packaging is in flight (FRONTEND.md §5.1 — every ~5 s
    // until `hls_status` flips from `pending` to `ready` / `failed`).
    refetchInterval: (query) =>
      query.state.data?.hls_status === 'pending' ? 5000 : false,
  });
}

export function useUpdateLessonProgress(enrollmentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      payload,
    }: {
      lessonId: string;
      payload: LessonProgressUpdate;
    }) =>
      lessonsApi.updateProgress(enrollmentId!, lessonId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      void queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useAssessment(id: string | undefined) {
  return useQuery({
    queryKey: ['assessment', id],
    queryFn: () => assessmentsApi.detail(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

/** Fetch a section's quiz (returns 404 if the section has no quiz attached). */
export function useSectionQuiz(sectionId: string | undefined) {
  return useQuery({
    queryKey: ['section', sectionId, 'quiz'],
    queryFn: () => assessmentsApi.sectionQuiz(sectionId!),
    enabled: Boolean(sectionId),
    staleTime: 60_000,
    // Don't retry on 404 — "no quiz here" is a normal answer.
    retry: false,
  });
}

/** Pass/attempts status for a section quiz — drives the lock UI. */
export function useSectionQuizStatus(sectionId: string | undefined) {
  return useQuery({
    queryKey: ['section', sectionId, 'quiz', 'status'],
    queryFn: () => assessmentsApi.sectionQuizStatus(sectionId!),
    enabled: Boolean(sectionId),
    staleTime: 30_000,
    retry: false,
  });
}

export function useAssessmentHistory(id: string | undefined) {
  return useQuery({
    queryKey: ['assessment', id, 'history'],
    queryFn: () => assessmentsApi.history(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useLessonNotes(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson', lessonId, 'notes'],
    queryFn: () => meApi.listNotes({ lesson_id: lessonId }),
    enabled: Boolean(lessonId),
    staleTime: 30_000,
  });
}

export function useCourseNotes(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course', courseId, 'notes'],
    queryFn: () => meApi.listNotes({ course_id: courseId }),
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });
}

export function useDeleteNote(courseId?: string, lessonId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => meApi.deleteNote(noteId),
    onSuccess: () => {
      if (courseId) {
        void queryClient.invalidateQueries({ queryKey: ['course', courseId, 'notes'] });
      }
      if (lessonId) {
        void queryClient.invalidateQueries({ queryKey: ['lesson', lessonId, 'notes'] });
      }
    },
  });
}

export function useCreateLessonNote(lessonId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateNotePayload, 'lesson_id'>) =>
      meApi.createNote({ ...payload, lesson_id: lessonId! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lesson', lessonId, 'notes'] });
    },
  });
}

export function useDeleteLessonNote(lessonId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => meApi.deleteNote(noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lesson', lessonId, 'notes'] });
    },
  });
}

export function useLessonAttachments(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson', lessonId, 'attachments'],
    queryFn: () => lessonsApi.listAttachments(lessonId!),
    enabled: Boolean(lessonId),
    staleTime: 60_000,
  });
}

export function useSubmitAssessment(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: SubmissionAnswerWrite[]) =>
      assessmentsApi.submit(id!, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assessment', id, 'history'] });
      void queryClient.invalidateQueries({ queryKey: ['assessment', id] });
    },
  });
}
