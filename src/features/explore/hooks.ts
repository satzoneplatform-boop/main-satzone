import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog';
import { coursesApi, type CourseFilters } from '@/api/courses';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.categories(),
    staleTime: 5 * 60_000,
  });
}

export function usePrograms(size = 8) {
  return useQuery({
    queryKey: ['programs', { size }],
    queryFn: () => catalogApi.programs({ size }),
    staleTime: 5 * 60_000,
  });
}

export function usePopularCourses(size = 4) {
  return useQuery({
    queryKey: ['courses', 'popular', { size }],
    queryFn: () => coursesApi.list({ sort: 'popular', size }),
    staleTime: 60_000,
  });
}

export function useCourseSearch(filters: CourseFilters, enabled = true) {
  return useQuery({
    queryKey: ['courses', 'search', filters],
    queryFn: () => coursesApi.list(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
