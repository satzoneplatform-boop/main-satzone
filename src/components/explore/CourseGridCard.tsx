import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon } from '@/components/icons';
import type { CourseSummary } from '@/types/api';
import { formatDuration, formatPrice } from '@/lib/format';

interface CourseGridCardProps {
  course: CourseSummary;
  onEnroll?: (course: CourseSummary) => void;
  enrollLoading?: boolean;
}

export function CourseGridCard({ course, onEnroll, enrollLoading }: CourseGridCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-md">
      <Link to={`/courses/${course.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-ink-100">
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        )}
        <span
          className={
            course.is_free
              ? 'absolute left-3 top-3 rounded-md bg-success-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success-600'
              : 'absolute left-3 top-3 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700'
          }
        >
          {course.is_free ? 'Free' : 'Pro'}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {course.category && (
          <span className="self-start rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
            {course.category.name}
          </span>
        )}
        <Link to={`/courses/${course.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink-900 hover:underline">
            {course.title}
          </h3>
        </Link>
        <p className="text-xs text-ink-500">
          {formatDuration(course.duration_minutes)} · {course.lessons_count} lessons
        </p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-ink-900">
            {formatPrice(course.price_cents, course.currency, course.is_free)}
          </span>
          <Button
            size="sm"
            variant="primary"
            rightIcon={<ArrowRightIcon className="size-4" />}
            loading={enrollLoading}
            onClick={() => onEnroll?.(course)}
          >
            Enroll now
          </Button>
        </div>
      </div>
    </article>
  );
}
