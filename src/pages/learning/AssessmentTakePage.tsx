import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LogoMark } from '@/components/brand/Logo';
import {
  QuestionCard,
  type QuestionAnswer,
} from '@/components/learning/QuestionCard';
import { ApiError } from '@/api/errors';
import {
  useAssessment,
  useSubmitAssessment,
} from '@/features/learning/hooks';
import { authErrorMessage } from '@/features/auth/hooks';
import { HonorCodeModal } from './HonorCodeModal';
import { cn } from '@/lib/cn';

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
  const { slug, assessmentId } = useParams<{ slug: string; assessmentId: string }>();
  const navigate = useNavigate();
  const assessment = useAssessment(assessmentId);
  const submit = useSubmitAssessment(assessmentId);

  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const [honorOpen, setHonorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const ordered = useMemo(
    () => [...(assessment.data?.questions ?? [])].sort((a, b) => a.order - b.order),
    [assessment.data],
  );

  // Initialize the countdown once the assessment loads (only when there's a limit).
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    const minutes = assessment.data?.time_limit_minutes;
    if (!minutes) return;
    startedRef.current = true;
    setSecondsLeft(minutes * 60);
  }, [assessment.data?.time_limit_minutes]);

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
        This assessment is unavailable.
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

  function toggleFlag(qId: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
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
      <header className="flex items-center justify-between border-b border-ink-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <LogoMark size={28} />
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500">
              {a.is_section_quiz ? 'Section quiz' : 'Assessment'}
            </p>
            <p className="text-sm font-semibold text-ink-900">{a.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-xs text-ink-500">
            {answeredCount} / {total} answered
          </p>
          {secondsLeft != null && (
            <p
              className={cn(
                'rounded-md border px-3 py-1 font-mono text-sm font-semibold tabular-nums',
                secondsLeft <= 60
                  ? 'border-danger-500/40 bg-danger-50 text-danger-600'
                  : 'border-ink-200 bg-white text-ink-900',
              )}
              aria-live="polite"
            >
              ⏱ {formatClock(secondsLeft)}
            </p>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <main className="min-w-0 flex-1 overflow-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex items-center justify-between text-sm">
              <p className="text-ink-500">
                Question{' '}
                <span className="font-semibold text-ink-900">{activeIdx + 1}</span> of{' '}
                {total}
                {current && (
                  <span className="ml-3 text-ink-400">
                    · {current.points} pt{current.points === 1 ? '' : 's'}
                  </span>
                )}
              </p>
              {current && (
                <button
                  type="button"
                  onClick={() => toggleFlag(current.id)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs font-medium',
                    flagged.has(current.id)
                      ? 'border-warn-500 bg-yellow-50 text-warn-500'
                      : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
                  )}
                >
                  {flagged.has(current.id) ? '🚩 Marked' : 'Mark for review'}
                </button>
              )}
            </div>

            {current && (
              <QuestionCard
                index={activeIdx + 1}
                question={current}
                answer={answers[current.id] ?? { selectedOptionIds: [], text: '' }}
                onChange={(next) =>
                  setAnswers((prev) => ({ ...prev, [current.id]: next }))
                }
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                disabled={activeIdx === 0}
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              >
                ← Previous
              </Button>
              {activeIdx < total - 1 ? (
                <Button
                  onClick={() => setActiveIdx((i) => Math.min(total - 1, i + 1))}
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={() => setHonorOpen(true)}
                  disabled={submit.isPending}
                >
                  Review &amp; submit
                </Button>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 border-l border-ink-200 bg-white p-4 lg:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Question navigator
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {ordered.map((q, i) => {
              const answered = isAnswered(q.id);
              const isCurrent = i === activeIdx;
              const isFlagged = flagged.has(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'relative grid aspect-square place-items-center rounded-md border text-xs font-medium',
                    isCurrent && 'ring-2 ring-brand-500 ring-offset-1',
                    answered
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
                  )}
                  aria-current={isCurrent ? 'true' : undefined}
                  aria-label={`Question ${i + 1}${answered ? ', answered' : ''}${
                    isFlagged ? ', flagged' : ''
                  }`}
                >
                  {i + 1}
                  {isFlagged && (
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warn-500 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 text-xs text-ink-600">
            <Legend swatch="bg-brand-600 border-brand-600" label="Answered" />
            <Legend swatch="bg-white border-ink-200" label="Unanswered" />
            <Legend
              swatch="bg-white border-ink-200"
              dot
              label="Marked for review"
            />
          </div>

          <div className="mt-6">
            <Button
              fullWidth
              onClick={() => setHonorOpen(true)}
              disabled={submit.isPending}
            >
              Submit assessment
            </Button>
            <p className="mt-2 text-center text-xs text-ink-500">
              {allAnswered
                ? 'All questions answered.'
                : `${total - answeredCount} unanswered`}
            </p>
          </div>
        </aside>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-ink-200 bg-white px-6 py-3">
        <Button
          variant="ghost"
          onClick={() =>
            navigate(`/courses/${slug}/assessments/${assessmentId}`)
          }
        >
          Cancel
        </Button>
        {error && <span className="text-sm text-danger-600">{error}</span>}
        <Button
          onClick={() => setHonorOpen(true)}
          disabled={submit.isPending || total === 0}
        >
          Submit
        </Button>
      </footer>

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

function Legend({
  swatch,
  label,
  dot,
}: {
  swatch: string;
  label: string;
  dot?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'relative grid size-5 place-items-center rounded-md border',
          swatch,
        )}
      >
        {dot && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warn-500 ring-2 ring-white" />
        )}
      </span>
      <span>{label}</span>
    </div>
  );
}
