import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/errors';
import { CheckIcon, FlagIcon, LockIcon, StarIcon } from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCourseDetail } from '@/features/course/hooks';
import { useCoursePracticePack } from '@/features/quizzes/hooks';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import type { PracticeQuizStudentSummary } from '@/types/api';

/**
 * Duolingo-style quiz path. The pack is keyed by course UUID, so we
 * resolve the slug → course detail → course id before fetching.
 *
 * Lock state is sequential and progress-driven: a quiz unlocks once
 * the previous one has been attempted at least once. The
 * `best_score_percent` badge is the mastery signal (FRONTEND.md
 * gotcha — completion ≠ mastery).
 */
export function QuizCoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const course = useCourseDetail(slug);
  const pack = useCoursePracticePack(course.data?.id);

  if (course.isLoading || pack.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-hidden>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="mx-auto flex max-w-md flex-col items-center gap-8 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton circle className="size-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 403 not_enrolled is the friendly enroll-prompt; other errors → empty.
  const notEnrolled =
    pack.error instanceof ApiError && pack.error.code === 'not_enrolled';
  const otherError =
    pack.error instanceof ApiError && pack.error.code !== 'not_enrolled';

  const quizzes = pack.data?.quizzes ?? [];

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
          {pack.data?.title ?? course.data?.title ?? 'SAT Zone'}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          {pack.data?.description ?? t('quizzes.coursePathSubtitle')}
        </p>
      </header>

      {notEnrolled ? (
        <EmptyState
          title={t('quizzes.notEnrolledTitle')}
          body={t('quizzes.notEnrolledBody')}
        />
      ) : otherError || !pack.data ? (
        <EmptyState
          title={t('quizzes.notReadyTitle')}
          body={t('quizzes.notReadyBody')}
        />
      ) : quizzes.length === 0 ? (
        <EmptyState
          title={t('quizzes.emptyTitle')}
          body={t('quizzes.emptyBody')}
        />
      ) : (
        <PathLane slug={slug!} quizzes={quizzes} />
      )}
    </div>
  );
}

function PathLane({
  slug,
  quizzes,
}: {
  slug: string;
  quizzes: PracticeQuizStudentSummary[];
}) {
  const ordered = [...quizzes].sort((a, b) => a.order - b.order);
  return (
    <ol className="relative mx-auto flex max-w-md flex-col py-4">
      {/* Trail spine behind the nodes — ties the zigzag into one path. */}
      <div
        className="absolute inset-y-8 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-ink-200"
        aria-hidden
      />
      {ordered.map((q, i) => {
        const offset = i % 4;
        const align =
          offset === 0
            ? 'self-center'
            : offset === 1
              ? 'self-start ml-6'
              : offset === 2
                ? 'self-center'
                : 'self-end mr-6';
        const prev = ordered[i - 1];
        const locked = i > 0 && !prev?.progress.completed;
        const completed = q.progress.completed;
        return (
          <li key={q.id} className={cn('relative z-10 flex', align)}>
            <PathNode
              slug={slug}
              quiz={q}
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
  quiz,
  index,
  completed,
  locked,
}: {
  slug: string;
  quiz: PracticeQuizStudentSummary;
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
      {/* White backdrop keeps center-lane labels readable over the spine. */}
      <span className="flex flex-col items-center gap-0.5 rounded-lg bg-white/95 px-2 py-0.5">
        <span
          className={cn(
            'max-w-[14rem] text-center text-sm font-semibold',
            locked ? 'text-ink-400' : 'text-ink-900',
          )}
        >
          {quiz.title}
        </span>
        <span className="text-xs text-ink-500">
          {t('quizzes.items', { n: quiz.item_count })}
        </span>
        {completed && quiz.progress.best_score_percent > 0 && (
          <span className="text-[11px] font-semibold text-success-600">
            {t('quizzes.best', { pct: quiz.progress.best_score_percent })}
          </span>
        )}
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
      to={`/quizzes/${slug}/q/${quiz.id}`}
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
