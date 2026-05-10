import { Link } from 'react-router-dom';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ArrowRightIcon } from '@/components/icons';
import type { EnrollmentRead } from '@/types/api';
import { DashboardCard } from './DashboardCard';

interface LearningPathCardProps {
  enrollments: EnrollmentRead[];
}

export function LearningPathCard({ enrollments }: LearningPathCardProps) {
  if (!enrollments.length) {
    return (
      <DashboardCard title="Your learning path" bodyClassName="grid place-items-center text-center">
        <div className="py-6">
          <span aria-hidden className="text-4xl">📘</span>
          <h3 className="mt-3 text-base font-semibold text-ink-900">No progress yet</h3>
          <p className="mt-1 max-w-xs text-sm text-ink-500">
            Your learning path will appear here once you start a course.
          </p>
          <Link
            to="/courses"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
          >
            Explore courses
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Your learning path" bodyClassName="space-y-4">
      {enrollments.slice(0, 4).map((e) => (
        <div key={e.id}>
          <div className="flex items-center justify-between">
            <p className="truncate text-sm font-medium text-ink-900">
              {e.course.title}
            </p>
            <span className="text-xs font-medium text-ink-500">
              {Math.round(e.progress_percent)}%
            </span>
          </div>
          <ProgressBar
            value={e.progress_percent}
            size="sm"
            className="mt-2"
            fillClassName="bg-teal-500"
          />
        </div>
      ))}
    </DashboardCard>
  );
}
