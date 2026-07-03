import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';

// Lazy-load the lesson player so hls.js is only fetched when a learner opens a video.
const LessonPlayerPage = lazy(() =>
  import('@/pages/learning/LessonPlayerPage').then((m) => ({
    default: m.LessonPlayerPage,
  })),
);

export function LazyLessonPlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-24">
          <Spinner size="lg" />
        </div>
      }
    >
      <LessonPlayerPage />
    </Suspense>
  );
}
