import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/errors';
import { CheckIcon, FlagIcon, LockIcon, StarIcon } from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Spinner } from '@/components/ui/Spinner';
import { useCourseDetail } from '@/features/course/hooks';
import { useCourseQuizSets } from '@/features/quizzes/hooks';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import type { QuizSetSummary } from '@/types/api';

/**
 * Duolingo-style quiz path. Renders the sets as a staggered vertical
 * lane of round nodes — the same visual language as the screenshot the
 * user shared. Locked nodes show a lock icon; completed ones show a
 * check; the next one to play is highlighted.
 *
 * For now lock state is purely sequential (one before next). Once the
 * backend exposes `best_score_percent` per set we can flip nodes to
 * "completed" based on that.
 */
export function QuizCoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const course = useCourseDetail(slug);
  const sets = useCourseQuizSets(course.data?.id);

  if (course.isLoading || sets.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  // The most likely error is the backend's `/courses/{id}/quiz-sets`
  // endpoint not being deployed yet — surface a friendly empty state.
  const apiNotReady =
    sets.error instanceof ApiError && sets.error.status === 404;

  const items = sets.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumb
        items={[
          { label: t('quizzes.title'), to: '/quizzes' },
          { label: course.data?.title ?? slug ?? '—' },
        ]}
      />

      <header className="rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 text-white sm:p-8">
        <p className="text-xs uppercase tracking-wider text-white/80">
          {t('quizzes.path')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {course.data?.title ?? 'SAT Zone'}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          {t('quizzes.coursePathSubtitle')}
        </p>
      </header>

      {apiNotReady ? (
        <EmptyState
          title={t('quizzes.notReadyTitle')}
          body={t('quizzes.notReadyBody')}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={t('quizzes.emptyTitle')}
          body={t('quizzes.emptyBody')}
        />
      ) : (
        <PathLane slug={slug!} sets={items} />
      )}
    </div>
  );
}

function PathLane({ slug, sets }: { slug: string; sets: QuizSetSummary[] }) {
  // Sort by `order` so the path follows the instructor's intended sequence.
  const ordered = [...sets].sort((a, b) => a.order - b.order);

  // Sequential gate: until we have per-set completion data from the backend,
  // unlock only the first node. Wire to real progress once the attempts
  // endpoint is in.
  const firstLockedIdx = 1;

  return (
    <ol className="relative mx-auto max-w-md py-4">
      {ordered.map((s, i) => {
        // Stagger the nodes left / center / right to give the path its
        // signature zigzag without an SVG.
        const offset = i % 4;
        const align =
          offset === 0
            ? 'self-center'
            : offset === 1
              ? 'self-start ml-6'
              : offset === 2
                ? 'self-center'
                : 'self-end mr-6';
        const completed = false; // wire to attempts data when available
        const locked = i > firstLockedIdx;
        return (
          <li key={s.id} className={cn('flex', align)}>
            <PathNode
              slug={slug}
              set={s}
              index={i}
              completed={completed}
              locked={locked}
            />
          </li>
        );
      })}
    </ol>
  );
}

function PathNode({
  slug,
  set,
  index,
  completed,
  locked,
}: {
  slug: string;
  set: QuizSetSummary;
  index: number;
  completed: boolean;
  locked: boolean;
}) {
  const t = useT();
  const current = !completed && !locked;

  const node = (
    <div className="flex flex-col items-center gap-2 py-3">
      {current && (
        <span className="rounded-md bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
          {t('quizzes.start')}
        </span>
      )}
      <span
        className={cn(
          'grid size-20 place-items-center rounded-full text-white shadow-lg ring-4',
          completed
            ? 'bg-success-500 ring-success-500/30'
            : locked
              ? 'bg-ink-200 text-ink-400 ring-ink-100'
              : 'bg-brand-600 ring-brand-200',
        )}
      >
        {completed ? (
          <CheckIcon className="size-10" />
        ) : locked ? (
          <LockIcon className="size-9" />
        ) : index === 0 ? (
          <StarIcon className="size-10 text-white" />
        ) : (
          <FlagIcon className="size-9 text-white" />
        )}
      </span>
      <span
        className={cn(
          'max-w-[14rem] text-center text-sm font-semibold',
          locked ? 'text-ink-400' : 'text-ink-900',
        )}
      >
        {set.title}
      </span>
      <span className="text-xs text-ink-500">
        {t('quizzes.items', { n: set.items_count })}
      </span>
    </div>
  );

  if (locked) {
    return (
      <div
        className="cursor-not-allowed opacity-90"
        aria-disabled
        title={t('quizzes.lockedHint')}
      >
        {node}
      </div>
    );
  }

  return (
    <Link
      to={`/quizzes/${slug}/sets/${set.id}`}
      className="transition-transform hover:-translate-y-0.5"
    >
      {node}
    </Link>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
      <div>
        <FlagIcon className="mx-auto size-10 text-ink-300" />
        <p className="mt-3 text-base font-semibold text-ink-900">{title}</p>
        <p className="mt-1 max-w-md text-sm text-ink-500">{body}</p>
      </div>
    </div>
  );
}
