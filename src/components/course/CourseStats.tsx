import { formatDuration } from '@/lib/format';
import type { CourseDetail, CurriculumRead } from '@/types/api';
import { useT } from '@/i18n/I18nProvider';

interface CourseStatsProps {
  course: CourseDetail;
  curriculum?: CurriculumRead;
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

export function CourseStats({ course, curriculum }: CourseStatsProps) {
  const t = useT();
  const lessons = curriculum?.total_lessons ?? course.lessons_count;
  return (
    <section className="grid grid-cols-2 gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)] sm:grid-cols-4">
      <Stat value={lessons.toString().padStart(2, '0')} label={t('course.stats.totalLessons')} />
      <Stat
        value={NUMBER_FORMAT.format(course.students_count)}
        label={t('course.stats.studentsEnrolled')}
      />
      <Stat
        value={`${course.rating.toFixed(1)} / ${shortCount(course.reviews_count)}`}
        label={t('course.stats.reviewsRatings')}
      />
      <Stat
        value={course.duration_minutes ? formatDuration(course.duration_minutes) : t('course.stats.flexible')}
        label={t('course.stats.duration')}
      />
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-ink-500">{label}</p>
    </div>
  );
}

function shortCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}
