import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';

export function useCourseDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ['course', slug],
    queryFn: () => coursesApi.detail(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useCourseCurriculum(slug: string | undefined) {
  return useQuery({
    queryKey: ['course', slug, 'curriculum'],
    queryFn: () => coursesApi.curriculum(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useRelatedCourses(slug: string | undefined) {
  return useQuery({
    queryKey: ['course', slug, 'related'],
    queryFn: () => coursesApi.related(slug!),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}
