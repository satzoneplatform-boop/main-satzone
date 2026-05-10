import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PlayIcon, ArrowRightIcon } from '@/components/icons';
import { DashboardCard } from './DashboardCard';
import type { EnrollmentRead } from '@/types/api';

interface LatestCourseCardProps {
  enrollment?: EnrollmentRead | null;
}

export function LatestCourseCard({ enrollment }: LatestCourseCardProps) {
  return (
    <DashboardCard
      title="Latest course"
      trailing={
        <div className="flex items-center gap-2 text-xs">
          <button className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-900">
            Active courses
          </button>
          <button className="rounded-full px-3 py-1 font-medium text-ink-500 hover:bg-ink-50">
            Bookmark active
          </button>
        </div>
      }
      bodyClassName="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]"
    >
      {enrollment ? (
        <LoadedState enrollment={enrollment} />
      ) : (
        <EmptyState />
      )}
    </DashboardCard>
  );
}

function LoadedState({ enrollment }: { enrollment: EnrollmentRead }) {
  const course = enrollment.course;
  return (
    <>
      <div className="flex flex-col">
        <h3 className="text-xl font-semibold text-ink-900">{course.title}</h3>
        <p className="mt-1 text-sm text-ink-500 line-clamp-2">
          {course.subtitle ??
            'Pick up where you left off and keep your momentum going.'}
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Progress</span>
            <span className="font-medium text-ink-900">
              {Math.round(enrollment.progress_percent)}%
            </span>
          </div>
          <ProgressBar value={enrollment.progress_percent} className="mt-2" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button leftIcon={<PlayIcon />}>Resume lesson</Button>
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            View detail
            <ArrowRightIcon />
          </Link>
        </div>
      </div>

      <div className="hidden h-[180px] overflow-hidden rounded-xl bg-ink-100 lg:block">
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-6 text-center">
      <span aria-hidden className="text-4xl">📗</span>
      <h3 className="mt-3 text-base font-semibold text-ink-900">
        Start your first course
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        You haven’t started any classes yet. Pick a course to begin building skills now.
      </p>
      <Link
        to="/courses"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
      >
        Explore courses
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  );
}
