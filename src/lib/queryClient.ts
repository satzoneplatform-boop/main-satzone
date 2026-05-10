import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/errors';

/**
 * App-wide query client.
 *
 * Defaults are tuned for a media-heavy course app:
 *  - 60 s stale time on most reads to dampen refetch storms.
 *  - Don't retry on 4xx (client errors are usually permanent).
 *  - Single retry on 5xx with capped backoff.
 *  - refetchOnWindowFocus off — too noisy with a video player on the page.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    },
    mutations: {
      retry: false,
    },
  },
});
