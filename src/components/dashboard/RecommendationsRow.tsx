import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@/components/icons';
import type { CourseSummary } from '@/types/api';
import { cn } from '@/lib/cn';

interface RecommendationsRowProps {
  title: string;
  courses: CourseSummary[];
  onPrev?: () => void;
  onNext?: () => void;
}

export function RecommendationsRow({
  title,
  courses,
  onPrev,
  onNext,
}: RecommendationsRowProps) {
  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        <div className="flex items-center gap-2">
          <CarouselButton onClick={onPrev} icon={<ChevronLeftIcon />} ariaLabel="Previous" />
          <CarouselButton onClick={onNext} icon={<ChevronRightIcon />} ariaLabel="Next" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {courses.slice(0, 4).map((c) => (
          <CourseTile key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}

function CarouselButton({
  onClick,
  icon,
  ariaLabel,
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="grid size-9 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 disabled:opacity-50"
    >
      {icon}
    </button>
  );
}

function CourseTile({ course }: { course: CourseSummary }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        {course.is_free && (
          <span className="absolute left-3 top-3 rounded-md bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-600">
            FREE
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-900">{course.title}</h3>
        <p className="text-xs text-ink-500 truncate">
          {course.instructor?.full_name ?? 'SATZone instructor'}
        </p>
        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-ink-700">
            <StarIcon className={cn('size-4 text-amber-400')} />
            <span className="font-medium">{course.rating.toFixed(1)}</span>
            <span className="text-ink-400">({course.reviews_count})</span>
          </span>
          <span className="font-semibold text-ink-900">
            {course.is_free
              ? 'Free'
              : `$${(course.price_cents / 100).toFixed(0)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
