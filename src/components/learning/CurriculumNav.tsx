import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  FlagIcon,
  LockIcon,
  PlayIcon,
} from '@/components/icons';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { assessmentsApi } from '@/api/assessments';
import { ApiError } from '@/api/errors';
import { useT } from '@/i18n/I18nProvider';
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
  /**
   * When true, lessons are gated sequentially: a lesson is unlocked only
   * if every preceding lesson (across sections, in curriculum order) is
   * in `completedIds`. The first lesson is always unlocked.
   */
  enforceSequentialLock?: boolean;
}

/**
 * Course outline panel shown to enrolled learners alongside the lesson player
 * and assessment pages. Mirrors the design's "Module 1 → lesson list" pattern.
 *
 * If a section has a section-quiz attached on the backend (returned by
 * `GET /sections/{id}/quiz/status`), we render a "Section quiz" row at the
 * end of that module's lessons.
 *
 * Desktop-only (hidden below lg) — mobile browsing goes through
 * `CurriculumSheet` below.
 */
export function CurriculumNav({
  curriculum,
  loading,
  courseSlug,
  activeId,
  completedIds,
  enforceSequentialLock,
}: CurriculumNavProps) {
  const t = useT();

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
        {t('learning.curriculum.comingSoon')}
      </aside>
    );
  }

  return (
    <aside className="hidden h-full w-[280px] shrink-0 overflow-y-auto border-r border-ink-200 bg-white p-3 lg:block">
      <CurriculumSections
        curriculum={curriculum}
        courseSlug={courseSlug}
        activeId={activeId}
        completedIds={completedIds}
        enforceSequentialLock={enforceSequentialLock}
      />
    </aside>
  );
}

/**
 * Mobile curriculum browser — a slide-up bottom sheet mirroring the desktop
 * `CurriculumNav` content (same module blocks, lock/completed states and quiz
 * rows). Navigating to a lesson closes the sheet. Respects reduced motion,
 * closes on Escape / backdrop tap, and locks body scroll while open.
 */
export function CurriculumSheet({
  open,
  onClose,
  curriculum,
  courseSlug,
  activeId,
  completedIds,
  enforceSequentialLock,
}: CurriculumNavProps & {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <motion.button
            type="button"
            aria-label={t('learning.curriculum.close')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-ink-900/40"
          />
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-modal)]"
          >
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" aria-hidden />
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy-900">
                  {t('learning.curriculum.browse')}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('learning.curriculum.close')}
                  className="grid size-11 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>

              <div className="mt-3">
                {!curriculum?.sections.length ? (
                  <p className="py-6 text-center text-sm text-ink-500">
                    {t('learning.curriculum.comingSoon')}
                  </p>
                ) : (
                  <CurriculumSections
                    curriculum={curriculum}
                    courseSlug={courseSlug}
                    activeId={activeId}
                    completedIds={completedIds}
                    enforceSequentialLock={enforceSequentialLock}
                    onNavigate={onClose}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Shared section list — renders the module blocks for both the desktop
 * sidebar and the mobile sheet so lock/completed logic never diverges.
 */
function CurriculumSections({
  curriculum,
  courseSlug,
  activeId,
  completedIds,
  enforceSequentialLock,
  onNavigate,
}: {
  curriculum: CurriculumRead;
  courseSlug: string;
  activeId?: string;
  completedIds?: Set<string>;
  enforceSequentialLock?: boolean;
  onNavigate?: () => void;
}) {
  // Compute the index of the first not-yet-completed lesson across the
  // whole curriculum. Lessons at or before this index are unlocked;
  // anything after is locked.
  const firstLockedIndex = useMemo(() => {
    if (!enforceSequentialLock) return Number.POSITIVE_INFINITY;
    const flat = curriculum.sections.flatMap((s) => s.lessons.map((l) => l.id));
    for (let i = 0; i < flat.length; i++) {
      if (!completedIds?.has(flat[i])) return i;
    }
    return flat.length;
  }, [enforceSequentialLock, curriculum, completedIds]);

  // Absolute starting lesson index per section so locking decisions are
  // independent of the section the lesson sits in (precomputed — no
  // mutation during render).
  const sectionStarts = curriculum.sections.reduce<number[]>((acc, _s, i) => {
    acc.push(
      i === 0 ? 0 : acc[i - 1] + curriculum.sections[i - 1].lessons.length,
    );
    return acc;
  }, []);

  return (
    <>
      {curriculum.sections.map((section, i) => (
        <SectionBlock
          key={section.id}
          section={section}
          courseSlug={courseSlug}
          activeId={activeId}
          completedIds={completedIds}
          sectionStartIndex={sectionStarts[i]}
          firstLockedIndex={firstLockedIndex}
          enforceSequentialLock={!!enforceSequentialLock}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

function SectionBlock({
  section,
  courseSlug,
  activeId,
  completedIds,
  sectionStartIndex,
  firstLockedIndex,
  enforceSequentialLock,
  onNavigate,
}: {
  section: SectionRead;
  courseSlug: string;
  activeId?: string;
  completedIds?: Set<string>;
  sectionStartIndex: number;
  firstLockedIndex: number;
  enforceSequentialLock: boolean;
  onNavigate?: () => void;
}) {
  const t = useT();
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

  // Quiz is always gated behind "all lessons in this section completed",
  // regardless of the backend's `required` flag. Once passed, it stays
  // unlocked so the learner can retake (within max_attempts).
  const quizUnlocked = allLessonsDone || !!status.data?.passed;

  // Expand the module that contains the active lesson / assessment;
  // collapse the rest. Tracks user toggles after first render.
  const containsActive =
    !!activeId &&
    (section.lessons.some((l) => l.id === activeId) ||
      status.data?.assessment_id === activeId);
  const [open, setOpen] = useState(containsActive);
  const lessonCount =
    section.lessons.length + (hasQuiz && status.data?.assessment_id ? 1 : 0);
  const completedCount = completedIds
    ? section.lessons.filter((l) => completedIds.has(l.id)).length
    : 0;
  const panelId = `module-${section.id}`;

  return (
    <section className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left',
          'transition-colors hover:bg-ink-50',
        )}
      >
        <ChevronDownIcon
          className={cn(
            'size-4 shrink-0 text-ink-500 transition-transform',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-ink-900">
            {t('learning.curriculum.moduleShort', { order: section.order })}
          </span>
          <span className="text-[11px] text-ink-500">
            {completedIds
              ? `${completedCount}/${lessonCount}`
              : t('learning.curriculum.itemsCount', { n: lessonCount })}
          </span>
        </span>
      </button>
      {open && (
        <ul id={panelId} className="mt-1 space-y-1">
          {section.lessons.map((lesson, i) => {
            const absoluteIndex = sectionStartIndex + i;
            const locked =
              enforceSequentialLock && absoluteIndex > firstLockedIndex;
            return (
              <li key={lesson.id}>
                <LessonRow
                  lesson={lesson}
                  active={lesson.id === activeId}
                  completed={completedIds?.has(lesson.id) ?? false}
                  locked={locked}
                  to={`/courses/${courseSlug}/lessons/${lesson.id}`}
                  onNavigate={onNavigate}
                />
              </li>
            );
          })}
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
                onNavigate={onNavigate}
              />
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function LessonRow({
  lesson,
  active,
  completed,
  locked,
  to,
  onNavigate,
}: {
  lesson: LessonSummary;
  active: boolean;
  completed: boolean;
  locked: boolean;
  to: string;
  onNavigate?: () => void;
}) {
  const t = useT();
  const body = (
    <>
      <span
        className={cn(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md',
          completed
            ? 'bg-success-50 text-success-600'
            : locked
              ? 'bg-ink-100 text-ink-400'
              : active
                ? 'bg-brand-100 text-brand-700'
                : 'bg-ink-100 text-ink-500',
        )}
      >
        {completed ? (
          <CheckIcon className="size-4" />
        ) : locked ? (
          <LockIcon className="size-3.5" />
        ) : (
          <PlayIcon className="size-3.5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {t('learning.courseLearn.lessonLine', {
            order: lesson.order,
            title: lesson.title,
          })}
        </span>
        <span className="text-xs text-ink-500">
          {locked
            ? t('learning.courseLearn.lockedHint')
            : t('learning.courseLearn.lessonMeta', {
                minutes: Math.max(1, Math.round(lesson.duration_seconds / 60)),
                type: lesson.type,
              })}
        </span>
      </span>
    </>
  );

  if (locked) {
    return (
      <div
        className={cn(
          'flex min-h-11 cursor-not-allowed items-start gap-3 rounded-lg p-2 text-sm text-ink-400',
          'border border-dashed border-ink-200 bg-ink-50/60',
        )}
        aria-disabled
        title={t('learning.courseLearn.lockedHint')}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-start gap-3 rounded-lg p-2 text-sm transition-colors',
        active
          ? 'bg-brand-50 text-ink-900 ring-1 ring-brand-200'
          : 'text-ink-700 hover:bg-ink-50',
      )}
    >
      {body}
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
  onNavigate,
}: {
  courseSlug: string;
  assessmentId: string;
  active: boolean;
  passed: boolean;
  locked: boolean;
  attempts: number;
  maxAttempts: number | null;
  onNavigate?: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const to = `/courses/${courseSlug}/assessments/${assessmentId}`;

  function go() {
    if (locked) return;
    onNavigate?.();
    navigate(to);
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={locked}
      className={cn(
        'flex min-h-11 w-full items-start gap-3 rounded-lg border p-2 text-left text-sm transition-colors',
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
        {passed ? (
          <CheckIcon className="size-4" />
        ) : locked ? (
          <LockIcon className="size-3.5" />
        ) : (
          <FlagIcon className="size-3.5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block truncate font-medium">
            {t('learning.courseLearn.sectionQuiz')}
          </span>
          {passed && <Badge tone="success">{t('learning.courseLearn.passedBadge')}</Badge>}
          {locked && !passed && (
            <Badge tone="neutral">{t('learning.courseLearn.lockedBadge')}</Badge>
          )}
        </span>
        <span className="text-xs text-ink-500">
          {locked
            ? t('learning.courseLearn.quizLockedHint')
            : maxAttempts == null
              ? t('learning.courseLearn.attemptsMeta', { n: attempts })
              : t('learning.courseLearn.attemptsOfMeta', {
                  used: attempts,
                  max: maxAttempts,
                })}
        </span>
      </span>
    </button>
  );
}
