import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '@/api/errors';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useQuizSet, useRecordQuizAttempt } from '@/features/quizzes/hooks';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import type { QuizItemRead, QuizMode } from '@/types/api';

/** Fisher-Yates shuffle, returns a new array. */
function shuffle<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Quiz runner — hosts either the MCQ or Matching game depending on the
 * `?mode=` query parameter. Translation of the prototype HTML's
 * `startMcq` / `startMatch` flows into React, with the addition of
 * `POST /quiz-sets/:id/attempts` on completion so the backend can persist
 * the score.
 */
export function QuizPlayPage() {
  const { slug, setId } = useParams<{ slug: string; setId: string }>();
  const t = useT();
  const [params] = useSearchParams();
  const mode = (params.get('mode') as QuizMode) || 'mcq';

  const set = useQuizSet(setId);
  const record = useRecordQuizAttempt(setId);

  // Stash the wall-clock start so we can report duration on submit.
  const startedAtRef = useRef<number>(Date.now());

  if (set.isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-ink-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (set.error instanceof ApiError || !set.data) {
    return (
      <div className="grid h-screen place-items-center bg-ink-50 text-center text-sm text-ink-500">
        <div>
          <p className="font-semibold text-ink-900">
            {t('quizzes.errorTitle')}
          </p>
          <p className="mt-1">
            {set.error instanceof ApiError ? set.error.message : ''}
          </p>
          <Link to={`/quizzes/${slug}`} className="mt-4 inline-block">
            <Button variant="outline">{t('quizzes.backToPath')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  function onFinish(correct: number, total: number) {
    const duration = Math.floor((Date.now() - startedAtRef.current) / 1000);
    // Fire-and-forget — the result screen renders even if backend 404s.
    record.mutate({
      mode,
      total_items: total,
      correct_items: correct,
      duration_seconds: duration,
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      {mode === 'matching' ? (
        <MatchingRunner
          items={set.data.items}
          title={set.data.title}
          backTo={`/quizzes/${slug}/sets/${setId}`}
          onFinish={onFinish}
        />
      ) : (
        <McqRunner
          items={set.data.items}
          title={set.data.title}
          backTo={`/quizzes/${slug}/sets/${setId}`}
          onFinish={onFinish}
        />
      )}
    </div>
  );
}

// ============================================================
// MCQ Runner — pick one of 4 options. Random direction per Q.
// ============================================================

interface McqQuestion {
  item: QuizItemRead;
  prompt: string;       // shown to the user
  pronunciation: string | null;
  correct: string;      // expected answer
  options: string[];    // 4 strings (1 correct + 3 distractors), pre-shuffled
  enToUz: boolean;      // direction (used for the label)
}

function McqRunner({
  items,
  title,
  backTo,
  onFinish,
}: {
  items: QuizItemRead[];
  title: string;
  backTo: string;
  onFinish: (correct: number, total: number) => void;
}) {
  const t = useT();
  const navigate = useNavigate();

  const questions = useMemo(() => buildMcq(items), [items]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const total = questions.length;

  if (total < 4) {
    return (
      <PageMessage
        title={t('quizzes.tooFewTitle')}
        body={t('quizzes.tooFewBody')}
        backTo={backTo}
      />
    );
  }

  function pick(answer: string) {
    if (picked) return;
    setPicked(answer);
    if (answer === q.correct) setCorrect((c) => c + 1);
  }

  function next() {
    if (idx + 1 >= total) {
      setDone(true);
      onFinish(correct, total);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  if (done) {
    return (
      <ResultScreen
        correct={correct}
        total={total}
        onPlayAgain={() => {
          setIdx(0);
          setCorrect(0);
          setPicked(null);
          setDone(false);
        }}
        backTo={backTo}
      />
    );
  }

  const pickedCorrect = picked === q.correct;

  return (
    <>
      <Header
        backTo={backTo}
        title={title}
        progressPct={(idx / total) * 100}
        scoreLabel={`${correct} / ${idx + (picked ? 1 : 0)}`}
        onQuit={() => navigate(backTo)}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <p className="text-xs uppercase tracking-wider text-ink-500">
          {q.enToUz
            ? t('quizzes.dir.enToUz')
            : t('quizzes.dir.uzToEn')}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink-900">
          {q.prompt}
        </h1>
        {q.pronunciation && (
          <p className="mt-1 text-sm text-brand-600">[{q.pronunciation}]</p>
        )}

        <div className="mt-6 grid gap-3">
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.correct;
            const isPicked = opt === picked;
            const showCorrect = picked && isCorrect;
            const showWrong = picked && isPicked && !isCorrect;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pick(opt)}
                disabled={!!picked}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 text-left text-base font-medium transition-colors',
                  showCorrect
                    ? 'border-success-500 bg-success-50 text-success-600'
                    : showWrong
                      ? 'border-danger-500 bg-danger-50 text-danger-600'
                      : 'border-ink-200 bg-white hover:bg-ink-50',
                  picked && !isCorrect && !isPicked && 'opacity-60',
                )}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink-100 text-xs font-semibold text-ink-700">
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-4">
            <p
              className={cn(
                'text-sm font-semibold',
                pickedCorrect ? 'text-success-600' : 'text-danger-600',
              )}
            >
              {pickedCorrect
                ? t('quizzes.feedback.correct')
                : t('quizzes.feedback.wrong', { answer: q.correct })}
            </p>
            <Button onClick={next} className="mt-3" fullWidth size="lg">
              {idx + 1 >= total
                ? t('quizzes.finish')
                : t('quizzes.next')}
            </Button>
          </div>
        )}
      </main>
    </>
  );
}

function buildMcq(items: QuizItemRead[]): McqQuestion[] {
  // Each item becomes one question; direction picked at random.
  return shuffle(items).map((item) => {
    const enToUz = Math.random() < 0.5;
    const prompt = enToUz ? item.front_text : item.back_text;
    const correct = enToUz ? item.back_text : item.front_text;
    const distractorPool = items.filter((x) => x.id !== item.id);
    const distractors = shuffle(distractorPool)
      .slice(0, 3)
      .map((x) => (enToUz ? x.back_text : x.front_text));
    const options = shuffle([correct, ...distractors]);
    return {
      item,
      prompt,
      pronunciation: enToUz ? item.pronunciation : null,
      correct,
      options,
      enToUz,
    };
  });
}

// ============================================================
// Matching Runner — connect left/right tiles in batches of 5.
// ============================================================

interface MatchTile {
  key: string;
  text: string;
  side: 'L' | 'R';
  itemId: string;
}

const BATCH = 5;

function MatchingRunner({
  items,
  title,
  backTo,
  onFinish,
}: {
  items: QuizItemRead[];
  title: string;
  backTo: string;
  onFinish: (correct: number, total: number) => void;
}) {
  const t = useT();
  const navigate = useNavigate();

  const queue = useMemo(() => shuffle(items), [items]);
  const [doneCount, setDoneCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [batchStart, setBatchStart] = useState(0);
  // Tracked via setBatchSolved inside onPick — the count itself is only
  // read in that callback, so we use the state setter to keep the
  // value live without subscribing the render to it.
  const [, setBatchSolved] = useState(0);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<MatchTile | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; keys: string[] } | null>(null);
  const [done, setDone] = useState(false);

  const total = queue.length;
  const batchItems = queue.slice(batchStart, batchStart + BATCH);

  // Random direction per batch — same as the prototype HTML.
  const directionRef = useRef(Math.random() < 0.5);
  const enToUz = directionRef.current;

  const tiles = useMemo<{ left: MatchTile[]; right: MatchTile[] }>(() => {
    const left = shuffle(
      batchItems.map((it) => ({
        key: `L-${it.id}`,
        text: enToUz ? it.front_text : it.back_text,
        side: 'L' as const,
        itemId: it.id,
      })),
    );
    const right = shuffle(
      batchItems.map((it) => ({
        key: `R-${it.id}`,
        text: enToUz ? it.back_text : it.front_text,
        side: 'R' as const,
        itemId: it.id,
      })),
    );
    return { left, right };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchStart, enToUz]);

  if (total < BATCH) {
    return (
      <PageMessage
        title={t('quizzes.tooFewTitle')}
        body={t('quizzes.tooFewBody')}
        backTo={backTo}
      />
    );
  }

  function onPick(tile: MatchTile) {
    if (solvedIds.has(tile.itemId)) return;
    if (flash) return; // pause taps while a flash animation is running

    if (!selected) {
      setSelected(tile);
      return;
    }
    if (selected.key === tile.key) {
      setSelected(null);
      return;
    }
    if (selected.side === tile.side) {
      // Two from the same column — replace selection.
      setSelected(tile);
      return;
    }
    // One from each column — evaluate.
    const matched = selected.itemId === tile.itemId;
    if (matched) {
      setFlash({ ok: true, keys: [selected.key, tile.key] });
      setTimeout(() => {
        setSolvedIds((prev) => {
          const next = new Set(prev);
          next.add(tile.itemId);
          return next;
        });
        setCorrectCount((c) => c + 1);
        setDoneCount((d) => d + 1);
        setBatchSolved((b) => {
          const nb = b + 1;
          if (nb === batchItems.length) {
            // Whole batch cleared — advance.
            const nextStart = batchStart + BATCH;
            if (nextStart >= total) {
              setDone(true);
              onFinish(correctCount + 1, total);
            } else {
              // Re-randomize direction for the next batch (matches HTML).
              directionRef.current = Math.random() < 0.5;
              setBatchStart(nextStart);
              setBatchSolved(0);
              setSelected(null);
              setSolvedIds(new Set());
            }
          }
          return nb;
        });
        setSelected(null);
        setFlash(null);
      }, 380);
    } else {
      setFlash({ ok: false, keys: [selected.key, tile.key] });
      setTimeout(() => {
        setSelected(null);
        setFlash(null);
      }, 580);
    }
  }

  if (done) {
    return (
      <ResultScreen
        correct={correctCount}
        total={total}
        onPlayAgain={() => navigate(0)}
        backTo={backTo}
      />
    );
  }

  return (
    <>
      <Header
        backTo={backTo}
        title={title}
        progressPct={(doneCount / total) * 100}
        scoreLabel={`${doneCount} / ${total}`}
        onQuit={() => navigate(backTo)}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <p className="text-xs uppercase tracking-wider text-ink-500">
          {t('quizzes.matching.instruction')}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-3">
            {tiles.left.map((tl) => (
              <MatchTileButton
                key={tl.key}
                tile={tl}
                selected={selected?.key === tl.key}
                done={solvedIds.has(tl.itemId)}
                flashOk={flash?.ok && flash.keys.includes(tl.key)}
                flashBad={flash && !flash.ok && flash.keys.includes(tl.key)}
                onPick={onPick}
              />
            ))}
          </div>
          <div className="space-y-3">
            {tiles.right.map((tl) => (
              <MatchTileButton
                key={tl.key}
                tile={tl}
                selected={selected?.key === tl.key}
                done={solvedIds.has(tl.itemId)}
                flashOk={flash?.ok && flash.keys.includes(tl.key)}
                flashBad={flash && !flash.ok && flash.keys.includes(tl.key)}
                onPick={onPick}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function MatchTileButton({
  tile,
  selected,
  done,
  flashOk,
  flashBad,
  onPick,
}: {
  tile: MatchTile;
  selected: boolean;
  done: boolean;
  flashOk: boolean | null | undefined;
  flashBad: boolean | null | undefined;
  onPick: (t: MatchTile) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(tile)}
      disabled={done}
      className={cn(
        'grid min-h-[60px] place-items-center rounded-xl border bg-white p-3 text-center text-sm font-semibold transition-colors',
        done && 'border-dashed border-ink-200 bg-ink-50 text-ink-300',
        flashOk && 'border-success-500 bg-success-50 text-success-600',
        flashBad && 'border-danger-500 bg-danger-50 text-danger-600',
        selected &&
          !flashOk &&
          !flashBad &&
          'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100',
        !selected && !done && !flashOk && !flashBad && 'border-ink-200 hover:bg-ink-50',
      )}
    >
      {tile.text}
    </button>
  );
}

// ============================================================
// Shared UI — header, result screen, message page
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
        <Button variant="ghost" size="sm" onClick={onQuit}>
          ‹ {t('common.cancel')}
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

function ResultScreen({
  correct,
  total,
  onPlayAgain,
  backTo,
}: {
  correct: number;
  total: number;
  onPlayAgain: () => void;
  backTo: string;
}) {
  const t = useT();
  const pct = Math.round((correct / total) * 100);
  const messageKey =
    pct === 100
      ? 'quizzes.result.perfect'
      : pct >= 80
        ? 'quizzes.result.great'
        : pct >= 60
          ? 'quizzes.result.good'
          : 'quizzes.result.tryAgain';

  return (
    <main className="mx-auto grid w-full max-w-md flex-1 place-items-center px-4 py-10">
      <div className="w-full rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-wider text-ink-500">
          {t('quizzes.result.title')}
        </p>
        <p className="mt-2 text-5xl font-semibold text-brand-600">{pct}%</p>
        <p className="mt-1 text-sm text-ink-500">
          {t('quizzes.result.line', { correct, total })}
        </p>
        <p className="mt-4 text-base font-semibold text-ink-900">
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
      </div>
    </main>
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
