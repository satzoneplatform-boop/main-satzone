import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  /** Render as a circle (uses width for both dimensions). */
  circle?: boolean;
}

/**
 * Shimmering placeholder for data-heavy areas. Uses the shared
 * `.skeleton-shimmer` utility, which collapses to a static tint under
 * prefers-reduced-motion.
 */
export function Skeleton({ className, circle = false }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'skeleton-shimmer',
        circle ? 'rounded-full' : 'rounded-lg',
        className,
      )}
    />
  );
}

/** Card-shaped skeleton matching the dashboard widget frame. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]',
        className,
      )}
    >
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-5 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
