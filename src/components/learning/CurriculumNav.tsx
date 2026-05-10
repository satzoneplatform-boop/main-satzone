import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon, FlagIcon, PlayIcon } from '@/components/icons';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { assessmentsApi } from '@/api/assessments';
import { ApiError } from '@/api/errors';
import type {
  CurriculumRead,
  LessonSummary,
  SectionRead,
} from '@/types/api';
import { cn } from '@/lib/cn';

interface CurriculumNavProps {
  curriculum: CurriculumRead | undefined;
  loading?: boolean;
  courseSlug: string;
  /** ID of the active lesson or assessment to highlight. */
  activeId?: string;
  /** Lesson IDs the user has completed. */
  completedIds?: Set<string>;
}

/**
 * Course outline panel shown to enrolled learners alongside the lesson player
 * and assessment pages. Mirrors the design's "Module 1 → lesson list" pattern.
 *
 * If a section has a section-quiz attached on the backend (returned by
 * `GET /sections/{id}/quiz/status`), we render a "Section quiz" row at the
 * end of that module's lessons.
 */
export function CurriculumNav({
  curriculum,
  loading,
  courseSlug,
  activeId,
  completedIds,
}: CurriculumNavProps) {
  if (loading) {
    return (
      <aside className="hidden h-full w-[280px] shrink-0 border-r border-ink-200 bg-white p-4 lg:block">
        <Spinner />
      </aside>
    );
  }

  if (!curriculum?.sections.length) {
    return (
      <aside className="hidden h-full w-[280px] shrink-0 border-r border-ink-200 bg-white p-4 text-sm text-ink-500 lg:block">
        Curriculum coming soon.
      </aside>
    );
  }

  return (
    <aside className="hidden h-full w-[280px] shrink-0 overflow-y-auto border-r border-ink-200 bg-white p-3 lg:block">
      {curriculum.sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          courseSlug={courseSlug}
          activeId={activeId}
          completedIds={completedIds}
        />
      ))}
    </aside>
  );
}

function SectionBlock({
  section,
  courseSlug,
  activeId,
  completedIds,
}: {
  section: SectionRead;
  courseSlug: string;
  activeId?: string;
  completedIds?: Set<string>;
}) {
  // Cheap status fetch — returns 404 when a section has no quiz attached;
  // we treat that as "no quiz" silently.
  const status = useQuery({
    queryKey: ['section', section.id, 'quiz', 'status'],
    queryFn: () => assessmentsApi.sectionQuizStatus(section.id),
    staleTime: 30_000,
    retry: false,
  });

  const hasQuiz =
    !!status.data?.assessment_id &&
    !(status.error instanceof ApiError && status.error.status === 404);

  const allLessonsDone = completedIds
    ? section.lessons.every((l) => completedIds.has(l.id))
    : false;

  const quizUnlocked = !status.data?.required || allLessonsDone || status.data?.passed;

  return (
    <section className="mb-5">
      <p className="px-2 pb-2 text-xs font-semibold text-ink-900">
        Module {section.order}
      </p>
      <ul className="space-y-1">
        {section.lessons.map((lesson) => (
          <li key={lesson.id}>
            <LessonRow
              lesson={lesson}
              active={lesson.id === activeId}
              completed={completedIds?.has(lesson.id) ?? false}
              to={`/courses/${courseSlug}/lessons/${lesson.id}`}
            />
          </li>
        ))}
        {hasQuiz && status.data?.assessment_id && (
          <li>
            <SectionQuizRow
              courseSlug={courseSlug}
              assessmentId={status.data.assessment_id}
              active={status.data.assessment_id === activeId}
              passed={status.data.passed}
              locked={!quizUnlocked}
              attempts={status.data.attempts}
              maxAttempts={status.data.max_attempts}
            />
          </li>
        )}
      </ul>
    </section>
  );
}

function LessonRow({
  lesson,
  active,
  completed,
  to,
}: {
  lesson: LessonSummary;
  active: boolean;
  completed: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-start gap-3 rounded-lg p-2 text-sm transition-colors',
        active
          ? 'bg-brand-50 text-ink-900 ring-1 ring-brand-200'
          : 'text-ink-700 hover:bg-ink-50',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md',
          completed
            ? 'bg-success-50 text-success-600'
            : active
              ? 'bg-brand-100 text-brand-700'
              : 'bg-ink-100 text-ink-500',
        )}
      >
        {completed ? <CheckIcon className="size-4" /> : <PlayIcon className="size-3.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          Lesson {lesson.order}: {lesson.title}
        </span>
        <span className="text-xs text-ink-500">
          {Math.max(1, Math.round(lesson.duration_seconds / 60))} min · {lesson.type}
        </span>
      </span>
    </Link>
  );
}

function SectionQuizRow({
  courseSlug,
  assessmentId,
  active,
  passed,
  locked,
  attempts,
  maxAttempts,
}: {
  courseSlug: string;
  assessmentId: string;
  active: boolean;
  passed: boolean;
  locked: boolean;
  attempts: number;
  maxAttempts: number | null;
}) {
  const navigate = useNavigate();
  const to = `/courses/${courseSlug}/assessments/${assessmentId}`;

  function go() {
    if (locked) return;
    navigate(to);
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={locked}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-2 text-left text-sm transition-colors',
        active
          ? 'border-brand-300 bg-brand-50 text-ink-900'
          : locked
            ? 'border-dashed border-ink-200 bg-ink-50 text-ink-400'
            : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
      )}
      aria-disabled={locked}
    >
      <span
        className={cn(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md',
          passed
            ? 'bg-success-50 text-success-600'
            : locked
              ? 'bg-ink-100 text-ink-400'
              : 'bg-warn-500/10 text-warn-500',
        )}
      >
        {passed ? <CheckIcon className="size-4" /> : <FlagIcon className="size-3.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block truncate font-medium">Section quiz</span>
          {passed && <Badge tone="success">Passed</Badge>}
          {locked && !passed && <Badge tone="neutral">Locked</Badge>}
        </span>
        <span className="text-xs text-ink-500">
          {locked
            ? 'Complete lessons to unlock'
            : maxAttempts == null
              ? `${attempts} attempts`
              : `${attempts}/${maxAttempts} attempts`}
        </span>
      </span>
    </button>
  );
}
