import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LogoMark } from '@/components/brand/Logo';
import {
  QuestionCard,
  type QuestionAnswer,
} from '@/components/learning/QuestionCard';
import {
  QuestionGrid,
  QuestionLegend,
  QuestionNavigatorSheet,
} from '@/components/learning/QuestionNavigatorSheet';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FlagIcon,
  GridIcon,
} from '@/components/icons';
import { ApiError } from '@/api/errors';
import {
  useAssessment,
  useSubmitAssessment,
} from '@/features/learning/hooks';
import { authErrorMessage } from '@/features/auth/hooks';
import { HonorCodeModal } from './HonorCodeModal';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/I18nProvider';

/**
 * SAT-styled assessment runner.
 *
 *  - Big countdown timer in the header
 *  - One question on screen at a time, with prev/next navigation
 *  - Sidebar grid: jump to any question, see answered / flagged / current state
 *  - "Mark for review" toggle per question
 *  - Auto-submit when the timer hits zero
 */
export function AssessmentTakePage() {
  const t = useT();
  const { slug, assessmentId } = useParams<{ slug: string; assessmentId: string }>();
  const navigate = useNavigate();
  const assessment = useAssessment(assessmentId);
  const submit = useSubmitAssessment(assessmentId);
  const reduce = useReducedMotion();

  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const [honorOpen, setHonorOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const ordered = useMemo(
    () => [...(assessment.data?.questions ?? [])].sort((a, b) => a.order - b.order),
    [assessment.data],
  );

  // Initialize the countdown once the assessment loads (only when there's a
  // limit) — adjust-during-render so the seed happens before paint and no
  // setState runs inside an effect body.
  const [timerSeeded, setTimerSeeded] = useState(false);
  const limitMinutes = assessment.data?.time_limit_minutes;
  if (!timerSeeded && limitMinutes) {
    setTimerSeeded(true);
    setSecondsLeft(limitMinutes * 60);
  }

  // Tick the timer every second.
  useEffect(() => {
    if (secondsLeft == null) return;
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s == null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  // Auto-submit when the timer expires.
  useEffect(() => {
    if (secondsLeft === 0 && !submit.isPending && !submit.isSuccess) {
      onSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (assessment.isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-ink-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!assessment.data) {
    return (
      <div className="grid h-screen place-items-center bg-ink-50 text-center text-sm text-ink-500">
        {t('assessment.take.unavailable')}
      </div>
    );
  }

  const a = assessment.data;
  const total = ordered.length;
  const current = ordered[activeIdx];

  function isAnswered(qId: string): boolean {
    const ans = answers[qId];
    if (!ans) return false;
    return ans.selectedOptionIds.length > 0 || ans.text.trim().length > 0;
  }

  const answeredCount = ordered.filter((q) => isAnswered(q.id)).length;
  const allAnswered = answeredCount === total;

  const navItems = ordered.map((q) => ({
    id: q.id,
    answered: isAnswered(q.id),
    flagged: flagged.has(q.id),
  }));

  function toggleFlag(qId: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  }

  function onSubmit() {
    setError(null);
    const payload = ordered.map((q) => ({
      question_id: q.id,
      selected_option_ids: answers[q.id]?.selectedOptionIds,
      text: answers[q.id]?.text || undefined,
    }));
    submit.mutate(payload, {
      onSuccess: () => {
        setHonorOpen(false);
        navigate(`/courses/${slug}/assessments/${assessmentId}`, { replace: true });
      },
      onError: (err) => {
        setError(authErrorMessage(err));
        if (err instanceof ApiError && err.code === 'phone_not_verified') {
          navigate('/verify-phone');
        }
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <header className="flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark size={28} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-ink-500">
              {a.is_section_quiz ? t('assessment.take.sectionQuiz') : t('assessment.take.assessment')}
            </p>
            <p className="truncate text-sm font-semibold text-ink-900">{a.title}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* Mobile question navigator trigger — the desktop palette is
              hidden below lg, so this is the only way to jump/flag-scan. */}
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="flex min-h-11 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 text-xs font-medium text-ink-700 hover:bg-ink-50 lg:hidden"
            aria-label={t('assessment.take.openNavigator')}
            aria-haspopup="dialog"
          >
            <GridIcon className="size-4" />
            <span className="tabular-nums">
              {answeredCount}/{total}
            </span>
          </button>
          <p className="hidden text-xs text-ink-500 lg:block">
            {t('assessment.take.answeredCount', { answered: answeredCount, total })}
          </p>
          {secondsLeft != null && (
            <p
              className={cn(
                'flex min-h-11 items-center gap-1.5 rounded-lg border px-3 font-mono text-sm font-semibold tabular-nums',
                secondsLeft <= 60
                  ? 'border-danger-500/40 bg-danger-50 text-danger-600'
                  : 'border-ink-200 bg-white text-ink-900',
              )}
              aria-live="polite"
              aria-label={t('assessment.take.timeLeft')}
            >
              <ClockIcon className="size-4 shrink-0" aria-hidden />
              {formatClock(secondsLeft)}
            </p>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <main className="min-w-0 flex-1 overflow-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="min-w-0 text-ink-500">
                {t('assessment.take.question')}{' '}
                <span className="font-semibold text-ink-900">{activeIdx + 1}</span> {t('assessment.take.of')}{' '}
                {total}
                {current && (
                  <span className="ml-3 text-ink-400">
                    · {current.points === 1
                      ? t('assessment.take.points', { n: current.points })
                      : t('assessment.take.pointsPlural', { n: current.points })}
                  </span>
                )}
              </p>
              {current && (
                <button
                  type="button"
                  onClick={() => toggleFlag(current.id)}
                  aria-pressed={flagged.has(current.id)}
                  className={cn(
                    'flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
                    flagged.has(current.id)
                      ? 'border-warn-500 bg-warn-50 text-warn-600'
                      : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
                  )}
                >
                  <FlagIcon className="size-3.5 shrink-0" aria-hidden />
                  {flagged.has(current.id)
                    ? t('assessment.take.marked')
                    : t('assessment.take.markForReview')}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <QuestionCard
                    index={activeIdx + 1}
                    question={current}
                    answer={answers[current.id] ?? { selectedOptionIds: [], text: '' }}
                    onChange={(next) =>
                      setAnswers((prev) => ({ ...prev, [current.id]: next }))
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                disabled={activeIdx === 0}
                leftIcon={<ChevronLeftIcon className="size-4" />}
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              >
                {t('assessment.take.previous')}
              </Button>
              {activeIdx < total - 1 ? (
                <Button
                  rightIcon={<ChevronRightIcon className="size-4" />}
                  onClick={() => setActiveIdx((i) => Math.min(total - 1, i + 1))}
                >
                  {t('assessment.take.next')}
                </Button>
              ) : (
                <Button
                  onClick={() => setHonorOpen(true)}
                  disabled={submit.isPending}
                >
                  {t('assessment.take.reviewSubmit')}
                </Button>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 border-l border-ink-200 bg-white p-4 lg:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            {t('assessment.take.navigator')}
          </p>
          <div className="mt-3">
            <QuestionGrid items={navItems} activeIdx={activeIdx} onJump={setActiveIdx} />
          </div>

          <div className="mt-5">
            <QuestionLegend />
          </div>

          <div className="mt-6">
            <Button
              fullWidth
              onClick={() => setHonorOpen(true)}
              disabled={submit.isPending}
            >
              {t('assessment.take.submit')}
            </Button>
            <p className="mt-2 text-center text-xs text-ink-500">
              {allAnswered
                ? t('assessment.take.allAnswered')
                : t('assessment.take.unanswered', { n: total - answeredCount })}
            </p>
          </div>
        </aside>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-ink-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <Button
          variant="ghost"
          onClick={() =>
            navigate(`/courses/${slug}/assessments/${assessmentId}`)
          }
        >
          {t('assessment.take.cancel')}
        </Button>
        {error && <span className="text-sm text-danger-600">{error}</span>}
        <Button
          onClick={() => setHonorOpen(true)}
          disabled={submit.isPending || total === 0}
        >
          {t('assessment.take.submitShort')}
        </Button>
      </footer>

      <QuestionNavigatorSheet
        open={navOpen}
        onClose={() => setNavOpen(false)}
        items={navItems}
        activeIdx={activeIdx}
        onJump={setActiveIdx}
        answeredCount={answeredCount}
        onSubmit={() => {
          setNavOpen(false);
          setHonorOpen(true);
        }}
        submitDisabled={submit.isPending || total === 0}
      />

      <HonorCodeModal
        open={honorOpen}
        onClose={() => setHonorOpen(false)}
        onConfirm={onSubmit}
        loading={submit.isPending}
      />
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

