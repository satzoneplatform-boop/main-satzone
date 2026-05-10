import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
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
