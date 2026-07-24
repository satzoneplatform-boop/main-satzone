import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ApiError } from '@/api/errors';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { CheckIcon, ChevronLeftIcon } from '@/components/icons';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { useCourseDetail } from '@/features/course/hooks';
import {
  usePracticeQuiz,
  useSubmitPracticeAttempt,
} from '@/features/quizzes/hooks';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { launchConfetti } from '@/lib/confetti';
import type {
  MCQDataStudent,
  MatchingDataStudent,
  MatchingPairAnswer,
  PracticeAnswer,
  PracticeAttemptResult,
  PracticeItemStudentRead,
  PracticeQuizStudentRead,
} from '@/types/api';

/**
 * Quiz runner — walks the user through the quiz's items in order and
 * collects one answer per item. On finish, POST /practice/quizzes/{id}
 * /attempts with the full answer set; the server grades all-or-nothing
 * per item and returns `PracticeAttemptResult.results[]` which drives
 * the result screen.
 *
 * Each item is rendered by its own runner based on `item.type`:
 *   - mcq: pick one option, record `{item_id, option_id}`
 *   - matching: pair every left with a right, record
 *     `{item_id, pairs: [{left_id, right_id}, ...]}`
 *
 * Local "show feedback after pick" is purely visual — the authoritative
 * grade comes back from the server. We don't lie to the user about
 * correctness pre-submission; we just dim the picked option and let the
 * Next button advance.
 */
export function QuizPlayPage() {
  const { slug, quizId } = useParams<{ slug: string; quizId: string }>();
  const t = useT();
  const quiz = usePracticeQuiz(quizId);
  const course = useCourseDetail(slug);
  const submit = useSubmitPracticeAttempt(quizId, course.data?.id);

  // Wall-clock start so we can report `started_at` on submit. useState's
  // lazy initializer runs exactly once per mount and, unlike a ref, is
  // safe to read during render.
  const [startedAt] = useState<string>(() => new Date().toISOString());

  if (quiz.isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-ink-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (quiz.error instanceof ApiError || !quiz.data) {
    return (
      <PageMessage
        title={t('quizzes.errorTitle')}
        body={
          quiz.error instanceof ApiError ? quiz.error.message : ''
        }
        backTo={`/quizzes/${slug}`}
      />
    );
  }

  if (quiz.data.items.length === 0) {
    return (
      <PageMessage
        title={t('quizzes.notReadyTitle')}
        body={t('quizzes.notReadyBody')}
        backTo={`/quizzes/${slug}`}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <QuizRunner
        quiz={quiz.data}
        startedAt={startedAt}
        backTo={`/quizzes/${slug}`}
        onSubmit={(answers) =>
          submit.mutateAsync({
            started_at: startedAt,
            answers,
          })
        }
        result={submit.data ?? null}
        submitting={submit.isPending}
        submitError={submit.error instanceof ApiError ? submit.error : null}
        onReset={() => submit.reset()}
      />
    </div>
  );
}

// ============================================================
// Quiz runner — orchestrates per-item rendering + submission
// ============================================================

function QuizRunner({
  quiz,
  backTo,
  onSubmit,
  result,
  submitting,
  submitError,
  onReset,
}: {
  quiz: PracticeQuizStudentRead;
  startedAt: string;
  backTo: string;
  onSubmit: (answers: PracticeAnswer[]) => Promise<PracticeAttemptResult>;
  result: PracticeAttemptResult | null;
  submitting: boolean;
  submitError: ApiError | null;
  onReset: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();

  const items = useMemo(
    () => [...quiz.items].sort((a, b) => a.order - b.order),
    [quiz.items],
  );

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PracticeAnswer>>({});

  const item = items[idx];
  const total = items.length;
  const allAnswered = Object.keys(answers).length === total;

  function recordAnswer(answer: PracticeAnswer) {
    setAnswers((prev) => ({ ...prev, [answer.item_id]: answer }));
  }

  function next() {
    if (idx + 1 >= total) {
      // Final question answered — submit if not already.
      if (!result && !submitting) {
        void onSubmit(items.map((it) => answers[it.id]).filter(Boolean));
      }
      return;
    }
    setIdx((i) => i + 1);
  }

  // Result screen — surfaces server's per-item correctness.
  if (result) {
    return (
      <ResultScreen
        result={result}
        items={items}
        backTo={backTo}
        onPlayAgain={() => {
          onReset();
          setAnswers({});
          setIdx(0);
        }}
      />
    );
  }

  return (
    <>
      <Header
        backTo={backTo}
        title={quiz.title}
        progressPct={(idx / total) * 100}
        scoreLabel={`${idx + 1} / ${total}`}
        onQuit={() => navigate(backTo)}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {item.type === 'mcq' ? (
          <McqRunner
            item={item}
            answered={answers[item.id]?.item_id === item.id}
            onAnswer={recordAnswer}
          />
        ) : (
          <MatchingRunner
            item={item}
            answered={answers[item.id]?.item_id === item.id}
            onAnswer={recordAnswer}
          />
        )}

        {answers[item.id] && (
          <div className="mt-6">
            {idx + 1 >= total ? (
              <Button
                fullWidth
                size="lg"
                onClick={next}
                disabled={!allAnswered}
                loading={submitting}
              >
                {t('quizzes.finish')}
              </Button>
            ) : (
              <Button fullWidth size="lg" onClick={next}>
                {t('quizzes.next')}
              </Button>
            )}
          </div>
        )}

        {submitError && (
          <p className="mt-4 text-center text-sm text-danger-600">
            {submitError.message}
          </p>
        )}
      </main>
    </>
  );
}

// ============================================================
// MCQ — pick one option
// ============================================================

function McqRunner({
  item,
  answered,
  onAnswer,
}: {
  item: PracticeItemStudentRead;
  answered: boolean;
  onAnswer: (a: PracticeAnswer) => void;
}) {
  const t = useT();
  const data = item.data as MCQDataStudent;
  const reduce = useReducedMotion();
  // Re-shuffle on mount so option order isn't predictable. Stable across
  // re-renders via useMemo (options identity changes when the item does).
  const options = useMemo(() => shuffle(data.options), [data.options]);

  const [picked, setPicked] = useState<string | null>(null);

  function pick(optionId: string) {
    if (picked) return;
    setPicked(optionId);
    onAnswer({ item_id: item.id, option_id: optionId });
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-ink-500">
        {t('quizzes.dir.mcq')}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
        {data.prompt}
      </h1>
      {data.image_url && (
        <img
          src={data.image_url}
          alt=""
          className="mt-4 max-h-48 w-full rounded-lg object-contain"
        />
      )}

      <div className="mt-6 grid gap-3">
        {options.map((opt, i) => {
          const isPicked = opt.id === picked;
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => pick(opt.id)}
              disabled={answered}
              whileTap={answered || reduce ? undefined : { scale: 0.99 }}
              whileHover={answered || reduce ? undefined : { y: -1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className={cn(
                'flex min-h-[52px] items-center gap-3.5 rounded-xl border p-4 text-left text-base font-medium transition-colors',
                isPicked
                  ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                  : 'border-ink-200 bg-white hover:border-brand-300 hover:bg-ink-50',
                answered && !isPicked && 'opacity-50',
              )}
            >
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold transition-colors',
                  isPicked ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600',
                )}
              >
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][i] ?? String(i + 1)}
              </span>
              <span className="flex-1">{opt.text}</span>
              {opt.image_url && (
                <img
                  src={opt.image_url}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-lg border border-ink-200 object-cover"
                />
              )}
              {isPicked && (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                  <CheckIcon className="size-3.5" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Matching — pair every left with a right
// ============================================================

function MatchingRunner({
  item,
  answered,
  onAnswer,
}: {
  item: PracticeItemStudentRead;
  answered: boolean;
  onAnswer: (a: PracticeAnswer) => void;
}) {
  const t = useT();
  const data = item.data as MatchingDataStudent;

  // Server already shuffled both sides. Track active selection + locked
  // pairs locally. A pair is locked the moment the user picks both
  // sides; we don't reveal correctness here, that comes after submit.
  const [pairs, setPairs] = useState<MatchingPairAnswer[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  const usedLefts = new Set(pairs.map((p) => p.left_id));
  const usedRights = new Set(pairs.map((p) => p.right_id));

  function tryCommit(leftId: string | null, rightId: string | null) {
    if (!leftId || !rightId) return;
    const newPairs = [...pairs, { left_id: leftId, right_id: rightId }];
    setPairs(newPairs);
    setSelectedLeft(null);
    setSelectedRight(null);
    if (newPairs.length === data.lefts.length) {
      onAnswer({ item_id: item.id, pairs: newPairs });
    }
  }

  function pickLeft(id: string) {
    if (answered || usedLefts.has(id)) return;
    if (selectedRight) {
      tryCommit(id, selectedRight);
    } else {
      setSelectedLeft(id);
    }
  }

  function pickRight(id: string) {
    if (answered || usedRights.has(id)) return;
    if (selectedLeft) {
      tryCommit(selectedLeft, id);
    } else {
      setSelectedRight(id);
    }
  }

  function undo() {
    if (answered) return;
    setPairs((prev) => prev.slice(0, -1));
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-ink-500">
        {t('quizzes.dir.matching')}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
        {data.prompt}
      </h1>

      <div className="mt-6 grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-3">
          {data.lefts.map((l) => (
            <MatchTileButton
              key={l.id}
              text={l.text}
              locked={usedLefts.has(l.id)}
              selected={selectedLeft === l.id}
              onPick={() => pickLeft(l.id)}
            />
          ))}
        </div>
        <div className="space-y-3">
          {data.rights.map((r) => (
            <MatchTileButton
              key={r.id}
              text={r.text}
              locked={usedRights.has(r.id)}
              selected={selectedRight === r.id}
              onPick={() => pickRight(r.id)}
            />
          ))}
        </div>
      </div>

      {pairs.length > 0 && !answered && (
        <button
          type="button"
          onClick={undo}
          className="mx-auto mt-3 flex min-h-11 items-center px-3 text-xs text-ink-500 underline-offset-2 hover:text-ink-700 hover:underline"
        >
          {t('quizzes.matching.undo')}
        </button>
      )}
    </div>
  );
}

function MatchTileButton({
  text,
  locked,
  selected,
  onPick,
}: {
  text: string;
  locked: boolean;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={locked}
      className={cn(
        'grid min-h-[60px] w-full place-items-center break-words rounded-xl border bg-white p-3 text-center text-sm font-semibold transition-colors',
        locked && 'border-dashed border-ink-200 bg-ink-50 text-ink-300',
        selected &&
          !locked &&
          'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100',
        !selected && !locked && 'border-ink-200 hover:bg-ink-50',
      )}
    >
      {text}
    </button>
  );
}

// ============================================================
// Result screen
// ============================================================

function ResultScreen({
  result,
  items,
  backTo,
  onPlayAgain,
}: {
  result: PracticeAttemptResult;
  items: PracticeItemStudentRead[];
  backTo: string;
  onPlayAgain: () => void;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const messageKey =
    result.score_percent === 100
      ? 'quizzes.result.perfect'
      : result.score_percent >= 80
        ? 'quizzes.result.great'
        : result.score_percent >= 60
          ? 'quizzes.result.good'
          : 'quizzes.result.tryAgain';

  // Build a quick lookup so per-item review can show the prompt.
  const itemById = new Map(items.map((it) => [it.id, it]));
  const passed = result.score_percent >= 80;

  // Celebrate the score reveal once: full volley for a perfect run, a
  // modest pop for a pass — misses stay quiet so the confetti keeps
  // meaning something.
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (celebratedRef.current) return;
    celebratedRef.current = true;
    if (result.score_percent === 100) launchConfetti();
    else if (result.score_percent >= 80) launchConfetti(0.45);
  }, [result.score_percent]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-[var(--shadow-card)]"
      >
        <p className="text-xs uppercase tracking-wider text-ink-500">
          {t('quizzes.result.title')}
        </p>
        <div className="mt-4 grid place-items-center">
          <ScoreRing
            value={result.score_percent}
            max={100}
            suffix="%"
            size={148}
            strokeWidth={12}
            ringClassName={passed ? 'text-success-500' : 'text-brand-600'}
            valueClassName={passed ? 'text-success-600' : 'text-brand-600'}
          />
        </div>
        <p className="mt-3 text-sm text-ink-500">
          {t('quizzes.result.line', {
            correct: result.correct_count,
            total: result.total_count,
          })}
        </p>
        <p className="mt-2 text-base font-semibold text-navy-900">
          {t(messageKey as never)}
        </p>
        <div className="mt-6 flex gap-2">
          <Button fullWidth onClick={onPlayAgain}>
            {t('quizzes.result.again')}
          </Button>
          <Link to={backTo} className="flex-1">
            <Button fullWidth variant="outline">
              {t('quizzes.result.home')}
            </Button>
          </Link>
        </div>
      </motion.div>

      {result.results.length > 0 && (
        <section className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
            {t('quizzes.result.breakdown')}
          </p>
          <Stagger className="space-y-2" stagger={0.05}>
            {result.results.map((r, i) => {
              const it = itemById.get(r.item_id);
              const prompt =
                it && (it.data.type === 'mcq' ? it.data.prompt : it.data.prompt);
              return (
                <StaggerItem
                  key={r.item_id}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border bg-white p-3 text-sm',
                    r.is_correct
                      ? 'border-success-200 bg-success-50/40'
                      : 'border-danger-200 bg-danger-50/40',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white',
                      r.is_correct ? 'bg-success-500' : 'bg-danger-500',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-ink-700">{prompt ?? r.item_id}</span>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-semibold',
                      r.is_correct ? 'text-success-600' : 'text-danger-600',
                    )}
                  >
                    {r.is_correct
                      ? t('quizzes.feedback.correctShort')
                      : t('quizzes.feedback.wrongShort')}
                  </span>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>
      )}
    </main>
  );
}

// ============================================================
// Shared header / message
// ============================================================

function Header({
  backTo,
  title,
  progressPct,
  scoreLabel,
  onQuit,
}: {
  backTo: string;
  title: string;
  progressPct: number;
  scoreLabel: string;
  onQuit: () => void;
}) {
  const t = useT();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-ink-200 bg-white px-4 py-3">
      <Link to={backTo}>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11"
          leftIcon={<ChevronLeftIcon className="size-4" />}
          onClick={onQuit}
        >
          {t('common.cancel')}
        </Button>
      </Link>
      <div className="flex-1">
        <p className="truncate text-xs font-medium text-ink-500">{title}</p>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>
      <p className="text-sm font-semibold text-ink-900 tabular-nums">
        {scoreLabel}
      </p>
    </header>
  );
}

function PageMessage({
  title,
  body,
  backTo,
}: {
  title: string;
  body: string;
  backTo: string;
}) {
  const t = useT();
  return (
    <main className="grid flex-1 place-items-center px-4 py-12 text-center">
      <div>
        <p className="text-base font-semibold text-ink-900">{title}</p>
        <p className="mt-1 max-w-md text-sm text-ink-500">{body}</p>
        <Link to={backTo} className="mt-4 inline-block">
          <Button variant="outline">{t('quizzes.backToPath')}</Button>
        </Link>
      </div>
    </main>
  );
}

// ============================================================
// Helpers
// ============================================================

function shuffle<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
