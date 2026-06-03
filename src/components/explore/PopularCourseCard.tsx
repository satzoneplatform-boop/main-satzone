import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import type { CourseSummary } from '@/types/api';
import { formatDuration } from '@/lib/format';

interface PopularCourseCardProps {
  course: CourseSummary;
}

export function PopularCourseCard({ course }: PopularCourseCardProps) {
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
        {course.category && (
          <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink-700 backdrop-blur">
            {course.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-900">{course.title}</h3>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              src={course.instructor?.avatar_url}
              name={course.instructor?.full_name}
              size={24}
            />
            <span className="truncate text-xs text-ink-600">
              {course.instructor?.full_name ?? 'SATZone instructor'}
            </span>
          </div>
          <span className="text-xs text-ink-500">
            {formatDuration(course.duration_minutes)} · {course.lessons_count} lessons
          </span>
        </div>
      </div>
    </Link>
  );
}
