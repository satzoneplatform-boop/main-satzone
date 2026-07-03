import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon } from '@/components/icons';
import type { CourseSummary } from '@/types/api';
import { formatDuration, formatPrice } from '@/lib/format';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

interface CourseGridCardProps {
  course: CourseSummary;
  onEnroll?: (course: CourseSummary) => void;
  enrollLoading?: boolean;
}

export function CourseGridCard({ course, onEnroll, enrollLoading }: CourseGridCardProps) {
  const t = useT();
  const hasDiscount =
    course.discount_price_cents != null &&
    course.discount_price_cents < course.price_cents &&
    !course.is_free;
  const price = formatPrice(
    hasDiscount ? course.discount_price_cents! : course.price_cents,
    course.currency,
    course.is_free,
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)] transition-shadow duration-200 hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]">
      <Link
        to={`/courses/${course.slug}`}
        className="relative block aspect-[16/10] overflow-hidden bg-ink-100"
        tabIndex={-1}
        aria-hidden
      >
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span
          className={cn(
            'absolute left-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
            course.is_free
              ? 'bg-success-50 text-success-600'
              : 'bg-brand-50 text-brand-700',
          )}
        >
          {course.is_free ? t('explore.card.free') : t('explore.card.pro')}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {course.category && (
          <span className="self-start rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
            {course.category.name}
          </span>
        )}
        <Link to={`/courses/${course.slug}`} className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
            {course.title}
          </h3>
        </Link>
        <p className="text-xs text-ink-500">
          {formatDuration(course.duration_minutes)} ·{' '}
          {t('explore.card.lessons', { count: course.lessons_count })}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
          <div className="min-w-0">
            <p
              className={cn(
                'truncate text-sm font-bold',
                course.is_free ? 'text-success-600' : 'text-brand-600',
              )}
            >
              {price}
            </p>
            {hasDiscount && (
              <p className="text-[11px] text-ink-400 line-through">
                {formatPrice(course.price_cents, course.currency, false)}
              </p>
            )}
          </div>
          <Button
            size="md"
            variant="primary"
            rightIcon={<ArrowRightIcon className="size-4" />}
            loading={enrollLoading}
            onClick={() => onEnroll?.(course)}
            className="shrink-0"
          >
            {t('explore.card.enroll')}
          </Button>
        </div>
      </div>
    </article>
  );
}
