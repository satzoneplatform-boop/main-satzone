import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { ArrowRightIcon, BookIcon, BookmarkIcon, SearchIcon } from '@/components/icons';
import { CourseThumbnail } from '@/components/course/CourseThumbnail';
import { useMyEnrollments } from '@/features/learning/hooks';
import { useT } from '@/i18n/I18nProvider';
import type { EnrollmentRead } from '@/types/api';

type Filter = 'all' | 'active' | 'completed' | 'saved';

export function MyLearningsPage() {
  const t = useT();
  const [tab, setTab] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  // Backend status enum maps directly: active / completed / all (FRONTEND.md §4.6).
  const status: 'all' | 'active' | 'completed' =
    tab === 'completed' ? 'completed' : tab === 'active' ? 'active' : 'all';
  const enrollments = useMyEnrollments({ status, size: 24 });

  const items = enrollments.data?.items ?? [];
  const filtered = search
    ? items.filter((e) =>
        e.course.title.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const allCount = enrollments.data?.total ?? 0;

  const tabs: TabItem<Filter>[] = [
    { value: 'all', label: t('learning.myLearnings.tabs.all'), count: allCount },
    { value: 'completed', label: t('learning.myLearnings.tabs.completed') },
    { value: 'active', label: t('learning.myLearnings.tabs.inProgress') },
    { value: 'saved', label: t('learning.myLearnings.tabs.saved') },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs items={tabs} value={tab} onChange={setTab} variant="underline" />
        <div className="w-full max-w-xs">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('learning.myLearnings.searchPlaceholder')}
            leftSlot={<SearchIcon />}
          />
        </div>
      </div>

      {enrollments.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TileSkeleton key={i} />
          ))}
        </div>
      ) : tab === 'saved' ? (
        <SavedPlaceholder />
      ) : filtered.length === 0 ? (
        <EmptyEnrollments />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => (
            <EnrollmentTile key={e.id} enrollment={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollmentTile({ enrollment }: { enrollment: EnrollmentRead }) {
  const t = useT();
  const c = enrollment.course;
  const completed = Boolean(enrollment.completed_at);
  const next = enrollment.last_lesson
    ? `/courses/${c.slug}/lessons/${enrollment.last_lesson.id}`
    : `/courses/${c.slug}/learn`;

  return (
    <Link
      to={next}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
        <CourseThumbnail
          url={c.thumbnail_url}
          title={c.title}
          imgClassName="transition-transform group-hover:scale-105"
        />
        {c.category && (
          <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink-700 backdrop-blur">
            {c.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-900">{c.title}</h3>
        <div className="flex items-center gap-2">
          <Avatar
            src={c.instructor?.avatar_url}
            name={c.instructor?.full_name}
            size={20}
          />
          <span className="truncate text-xs text-ink-500">
            {c.instructor?.full_name ?? t('learning.myLearnings.defaultInstructor')}
          </span>
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Badge tone={completed ? 'success' : 'brand'}>
              {completed
                ? t('learning.myLearnings.completedBadge')
                : t('learning.myLearnings.continueBadge')}
            </Badge>
            <span className="font-medium text-ink-700">
              {Math.round(enrollment.progress_percent)}%
            </span>
          </div>
          <ProgressBar value={enrollment.progress_percent} size="sm" />
        </div>
      </div>
    </Link>
  );
}

function TileSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]"
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-2">
          <Skeleton circle className="size-5" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}

function EmptyEnrollments() {
  const t = useT();
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center text-sm text-ink-500">
      <div>
        <span
          aria-hidden
          className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"
        >
          <BookIcon className="size-6" />
        </span>
        <p className="mt-3">{t('learning.myLearnings.noMatches')}</p>
        <Link
          to="/explore"
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-medium text-brand-600 hover:bg-brand-50"
        >
          {t('learning.myLearnings.exploreLink')} <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function SavedPlaceholder() {
  const t = useT();
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center text-sm text-ink-500">
      <div>
        <span
          aria-hidden
          className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"
        >
          <BookmarkIcon className="size-6" />
        </span>
        <p className="mt-3">{t('learning.myLearnings.savedTitle')}</p>
        <Link
          to="/explore"
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-medium text-brand-600 hover:bg-brand-50"
        >
          {t('learning.myLearnings.findSaved')} <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </div>
  );
}
