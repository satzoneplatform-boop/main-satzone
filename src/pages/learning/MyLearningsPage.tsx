import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { SearchIcon } from '@/components/icons';
import { useMyEnrollments } from '@/features/learning/hooks';
import type { EnrollmentRead } from '@/types/api';

type Filter = 'all' | 'active' | 'completed' | 'saved';

export function MyLearningsPage() {
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
    { value: 'all', label: 'All courses', count: allCount },
    { value: 'completed', label: 'Completed' },
    { value: 'active', label: 'In progress' },
    { value: 'saved', label: 'Saved courses' },
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
            placeholder="Search popular course"
            leftSlot={<SearchIcon />}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span>Course type</span>
        <span>·</span>
        <span>Last Modified</span>
      </div>

      {enrollments.isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner size="lg" />
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
  const c = enrollment.course;
  const completed = Boolean(enrollment.completed_at);
  const next = enrollment.last_lesson_id
    ? `/courses/${c.slug}/lessons/${enrollment.last_lesson_id}`
    : `/courses/${c.slug}/learn`;

  return (
    <Link
      to={next}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
        {c.thumbnail_url && (
          <img
            src={c.thumbnail_url}
            alt={c.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
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
            {c.instructor?.full_name ?? 'Edura instructor'}
          </span>
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Badge tone={completed ? 'success' : 'brand'}>
              {completed ? 'Completed' : 'Continue'}
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

function EmptyEnrollments() {
  return (
    <div className="grid place-items-center py-16 text-center text-sm text-ink-500">
      <div>
        <span aria-hidden className="text-4xl">📘</span>
        <p className="mt-3">No courses match this view yet.</p>
        <Link to="/explore" className="mt-2 inline-block text-brand-600 hover:underline">
          Explore courses →
        </Link>
      </div>
    </div>
  );
}

function SavedPlaceholder() {
  return (
    <div className="grid place-items-center py-16 text-center text-sm text-ink-500">
      <div>
        <span aria-hidden className="text-4xl">🔖</span>
        <p className="mt-3">Saved courses live in your wishlist.</p>
        <Link to="/explore" className="mt-2 inline-block text-brand-600 hover:underline">
          Find something to save →
        </Link>
      </div>
    </div>
  );
}
