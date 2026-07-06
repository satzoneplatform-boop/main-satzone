import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
import { meApi } from '@/api/me';
import { onboardingApi } from '@/api/onboarding';

export function useHomeFeed() {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => coursesApi.home(),
  });
}

export function useOnboarding() {
  return useQuery({
    queryKey: ['onboarding'],
    queryFn: () => onboardingApi.get(),
  });
}

/** Real study activity for the current week — GET /me/activity/weekly. */
export function useWeeklyActivity() {
  return useQuery({
    queryKey: ['me', 'activity', 'weekly'],
    queryFn: () => meApi.getWeeklyActivity(),
    staleTime: 60_000,
  });
}
