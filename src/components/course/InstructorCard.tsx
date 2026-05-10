import { Avatar } from '@/components/ui/Avatar';
import { StarIcon } from '@/components/icons';
import type { InstructorSummary } from '@/types/api';

interface InstructorCardProps {
  instructor: InstructorSummary;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-base font-semibold text-ink-900">Instructor</h2>
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
              {instructor.rating.toFixed(1)} rating
            </span>
            <span>{instructor.students_count.toLocaleString()} students</span>
            <span>{instructor.courses_count} courses</span>
          </div>
        </div>
      </div>
    </section>
  );
}
