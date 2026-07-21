import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Avatar } from '@/components/ui/Avatar';
import { CourseThumbnail } from '@/components/course/CourseThumbnail';
import { StarIcon } from '@/components/icons';
import type { CourseSummary } from '@/types/api';
import { COURSE_LEVEL_KEY, formatDuration, formatPrice } from '@/lib/format';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

interface PopularCourseCardProps {
  course: CourseSummary;
}

export function PopularCourseCard({ course }: PopularCourseCardProps) {
  const t = useT();
  const reduce = useReducedMotion();
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
    <motion.div
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="h-full"
    >
      <Link
        to={`/courses/${course.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
          <CourseThumbnail
            url={course.thumbnail_url}
            title={course.title}
            imgClassName="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {course.category && (
              <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-navy-900 backdrop-blur">
                {course.category.name}
              </span>
            )}
            {course.is_featured && (
              <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                {t('explore.card.featured')}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-ink-500">
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-ink-700">
              {COURSE_LEVEL_KEY[course.level] ? t(COURSE_LEVEL_KEY[course.level]) : course.level}
            </span>
            {course.rating > 0 && (
              <span className="inline-flex items-center gap-0.5 text-warn-500">
                <StarIcon className="size-3.5" />
                <span className="font-semibold text-navy-900">
                  {course.rating.toFixed(1)}
                </span>
                <span className="text-ink-400">({course.reviews_count})</span>
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold text-navy-900">
            {course.title}
          </h3>

          <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar
                src={course.instructor?.avatar_url}
                name={course.instructor?.full_name}
                size={24}
              />
              <span className="truncate text-xs text-ink-600">
                {course.instructor?.full_name ?? t('learning.myLearnings.defaultInstructor')}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  'text-sm font-bold',
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
          </div>

          <p className="text-[11px] text-ink-400">
            {formatDuration(course.duration_minutes)} ·{' '}
            {t('explore.card.lessons', { count: course.lessons_count })}
            {course.students_count > 0 &&
              ` · ${t('explore.card.students', {
                count: course.students_count.toLocaleString(),
              })}`}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
