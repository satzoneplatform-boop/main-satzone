import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@/components/icons';
import type { CourseSummary } from '@/types/api';
import { useT } from '@/i18n/I18nProvider';

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
  const t = useT();
  return (
    <section>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg font-semibold text-ink-900">{title}</h2>
        {/* Only render pager controls when a handler is actually wired up. */}
        {(onPrev || onNext) && (
          <div className="flex shrink-0 items-center gap-2">
            {onPrev && (
              <CarouselButton
                onClick={onPrev}
                icon={<ChevronLeftIcon />}
                ariaLabel={t('dashboard.recs.prev')}
              />
            )}
            {onNext && (
              <CarouselButton
                onClick={onNext}
                icon={<ChevronRightIcon />}
                ariaLabel={t('dashboard.recs.next')}
              />
            )}
          </div>
        )}
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
      className="grid size-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 disabled:opacity-50"
    >
      {icon}
    </button>
  );
}

function CourseTile({ course }: { course: CourseSummary }) {
  const t = useT();
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
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
          <span className="absolute left-3 top-3 rounded-md bg-success-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-success-600">
            {t('dashboard.recs.free')}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-900">{course.title}</h3>
        <p className="min-w-0 truncate text-xs text-ink-500">
          {course.instructor?.full_name ?? t('dashboard.recs.instructorFallback')}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-center gap-1 text-ink-700">
            <StarIcon className="size-4 shrink-0 text-warn-500" />
            <span className="font-medium">{course.rating.toFixed(1)}</span>
            <span className="truncate text-ink-400">({course.reviews_count})</span>
          </span>
          <span className="shrink-0 font-semibold text-ink-900">
            {course.is_free
              ? t('dashboard.recs.free')
              : `$${(course.price_cents / 100).toFixed(0)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
