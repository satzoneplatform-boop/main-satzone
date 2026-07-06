import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import { PlayIcon, ArrowRightIcon } from '@/components/icons';
import { meApi } from '@/api/me';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { DashboardCard } from './DashboardCard';
import type { CourseSummary, EnrollmentRead, WishlistItemRead } from '@/types/api';

interface LatestCourseCardProps {
  enrollment?: EnrollmentRead | null;
}

type View = 'active' | 'bookmark';

export function LatestCourseCard({ enrollment }: LatestCourseCardProps) {
  const t = useT();
  const [view, setView] = useState<View>('active');

  // Bookmark list — wishlist on the backend (FRONTEND.md §4.6). Fetched
  // lazily the first time the user flips the toggle so the dashboard's
  // primary load stays light.
  const wishlist = useQuery({
    queryKey: ['me', 'wishlist'],
    queryFn: () => meApi.listWishlist({ size: 10 }),
    enabled: view === 'bookmark',
    staleTime: 30_000,
  });

  return (
    <DashboardCard
      title={t('dashboard.latestCourse.title')}
      trailing={
        <div className="flex items-center gap-1 rounded-full bg-ink-50 p-1 text-xs">
          <Pill active={view === 'active'} onClick={() => setView('active')}>
            {t('dashboard.latestCourse.activeCourses')}
          </Pill>
          <Pill active={view === 'bookmark'} onClick={() => setView('bookmark')}>
            {t('dashboard.latestCourse.bookmarkActive')}
          </Pill>
        </div>
      }
      bodyClassName="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]"
    >
      {view === 'active' ? (
        enrollment ? (
          <ActiveState enrollment={enrollment} />
        ) : (
          <EmptyState />
        )
      ) : wishlist.isLoading ? (
        <div className="col-span-full grid place-items-center py-10">
          <Spinner />
        </div>
      ) : wishlist.data && wishlist.data.items.length > 0 ? (
        <BookmarkState item={wishlist.data.items[0]} />
      ) : (
        <BookmarkEmptyState />
      )}
    </DashboardCard>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-9 rounded-full px-3 font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        active
          ? 'bg-white text-ink-900 shadow-[var(--shadow-input)]'
          : 'text-ink-500 hover:text-ink-700',
      )}
    >
      {children}
    </button>
  );
}

function ActiveState({ enrollment }: { enrollment: EnrollmentRead }) {
  const t = useT();
  const navigate = useNavigate();
  const course = enrollment.course;
  // Resume target: the last lesson the user opened in this course. Falls
  // back to the course's learn page when the backend has no last lesson
  // yet (i.e. the user enrolled but never opened a lesson).
  const resumeTo = enrollment.last_lesson_id
    ? `/courses/${course.slug}/lessons/${enrollment.last_lesson_id}`
    : `/courses/${course.slug}/learn`;
  return (
    <>
      <div className="flex min-w-0 flex-col">
        <h3 className="text-xl font-semibold text-ink-900 line-clamp-2">{course.title}</h3>
        <p className="mt-1 text-sm text-ink-500 line-clamp-2">
          {course.subtitle ?? t('dashboard.latestCourse.defaultSubtitle')}
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>{t('dashboard.latestCourse.progress')}</span>
            <span className="font-medium tabular-nums text-ink-900">
              {Math.round(enrollment.progress_percent)}%
            </span>
          </div>
          <ProgressBar value={enrollment.progress_percent} className="mt-2" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => navigate(resumeTo)} leftIcon={<PlayIcon />}>
            {t('dashboard.latestCourse.resumeLesson')}
          </Button>
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            {t('dashboard.latestCourse.viewDetail')}
            <ArrowRightIcon />
          </Link>
        </div>
      </div>

      <CourseThumb course={course} />
    </>
  );
}

function BookmarkState({ item }: { item: WishlistItemRead }) {
  const t = useT();
  const course = item.course;
  return (
    <>
      <div className="flex min-w-0 flex-col">
        <h3 className="text-xl font-semibold text-ink-900 line-clamp-2">{course.title}</h3>
        <p className="mt-1 text-sm text-ink-500 line-clamp-2">
          {course.subtitle ?? t('dashboard.latestCourse.defaultSubtitle')}
        </p>

        <p className="mt-4 text-xs text-ink-500">
          {t('dashboard.latestCourse.savedOn', {
            date: new Date(item.created_at).toLocaleDateString(),
          })}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            {t('dashboard.latestCourse.viewDetail')}
            <ArrowRightIcon />
          </Link>
        </div>
      </div>

      <CourseThumb course={course} />
    </>
  );
}

function CourseThumb({ course }: { course: CourseSummary }) {
  return (
    <div className="hidden h-[180px] overflow-hidden rounded-xl bg-ink-100 lg:block">
      {course.thumbnail_url && (
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function EmptyState() {
  const t = useT();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-6 text-center">
      <span aria-hidden className="text-4xl">📗</span>
      <h3 className="mt-3 text-base font-semibold text-ink-900">
        {t('dashboard.latestCourse.emptyTitle')}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        {t('dashboard.latestCourse.emptyBody')}
      </p>
      <Link
        to="/courses"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
      >
        {t('dashboard.latestCourse.exploreCourses')}
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  );
}

function BookmarkEmptyState() {
  const t = useT();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-6 text-center">
      <span aria-hidden className="text-4xl">🔖</span>
      <h3 className="mt-3 text-base font-semibold text-ink-900">
        {t('dashboard.latestCourse.bookmarkEmptyTitle')}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        {t('dashboard.latestCourse.bookmarkEmptyBody')}
      </p>
      <Link
        to="/courses"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
      >
        {t('dashboard.latestCourse.exploreCourses')}
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  );
}
