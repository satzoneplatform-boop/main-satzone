import { Avatar } from '@/components/ui/Avatar';
import { StarIcon } from '@/components/icons';
import type { InstructorSummary } from '@/types/api';
import { useT } from '@/i18n/I18nProvider';

interface InstructorCardProps {
  instructor: InstructorSummary;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  const t = useT();
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-base font-semibold text-ink-900">{t('course.instructor.title')}</h2>
      <div className="mt-4 flex items-center gap-4">
        <Avatar
          src={instructor.avatar_url}
          name={instructor.full_name}
          size={64}
          className="bg-ink-100"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink-900">{instructor.full_name}</p>
          {instructor.headline && (
            <p className="line-clamp-1 text-sm text-ink-500">{instructor.headline}</p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-ink-600">
            <span className="flex items-center gap-1">
              <StarIcon className="size-3.5 text-amber-400" />
              {t('course.instructor.rating', { rating: instructor.rating.toFixed(1) })}
            </span>
            <span>{t('course.instructor.students', { count: instructor.students_count.toLocaleString() })}</span>
            <span>{t('course.instructor.courses', { count: instructor.courses_count })}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
