import { motion, useReducedMotion } from 'motion/react';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import type { QuestionStudentRead } from '@/api/assessments';

export interface QuestionAnswer {
  selectedOptionIds: string[];
  text: string;
}

/** Per-option grading state, supplied by review mode when available. */
export type OptionState = 'correct' | 'incorrect' | undefined;

interface QuestionCardProps {
  index: number;
  question: QuestionStudentRead;
  answer: QuestionAnswer;
  onChange: (answer: QuestionAnswer) => void;
  /** Show as read-only with prior selection (review mode). */
  readOnly?: boolean;
  /** When provided, renders per-option correct/incorrect styling (review). */
  getOptionState?: (optionId: string) => OptionState;
  /** Explanation shown beneath the options after submission. */
  explanation?: string;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

/**
 * Renders the appropriate input(s) for a question based on its type
 * (single_choice / multi_choice / true_false / short_answer).
 *
 * Choice options render as premium, accessible option cards — a visually
 * hidden native radio/checkbox keeps full keyboard + screen-reader support
 * while the card handles the styling and a subtle tap microinteraction.
 */
export function QuestionCard({
  index,
  question,
  answer,
  onChange,
  readOnly = false,
  getOptionState,
  explanation,
}: QuestionCardProps) {
  const t = useT();
  function setOptions(ids: string[]) {
    if (readOnly) return;
    onChange({ ...answer, selectedOptionIds: ids });
  }
  function setText(text: string) {
    if (readOnly) return;
    onChange({ ...answer, text });
  }

  const opts = [...question.options].sort((a, b) => a.order - b.order);
  const isMulti = question.type === 'multi_choice';
  const isChoice =
    question.type === 'single_choice' ||
    question.type === 'true_false' ||
    isMulti;

  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h3 className="text-lg font-semibold leading-relaxed text-navy-900">
        <span className="mr-1.5 text-ink-400">{index}.</span>
        {question.prompt}
      </h3>
      {question.image_url && (
        <img
          src={question.image_url}
          alt=""
          className="mt-4 max-h-80 rounded-lg border border-ink-200 object-contain"
        />
      )}

      <div className="mt-5 space-y-3">
        {isChoice &&
          opts.map((opt, i) => {
            const checked = answer.selectedOptionIds.includes(opt.id);
            const state = getOptionState?.(opt.id);
            function toggle() {
              if (isMulti) {
                const next = new Set(answer.selectedOptionIds);
                if (checked) {
                  next.delete(opt.id);
                } else {
                  next.add(opt.id);
                }
                setOptions(Array.from(next));
              } else {
                setOptions([opt.id]);
              }
            }
            return (
              <OptionCard
                key={opt.id}
                letter={LETTERS[i] ?? String(i + 1)}
                text={opt.text}
                imageUrl={opt.image_url}
                checked={checked}
                multi={isMulti}
                state={state}
                disabled={readOnly}
                name={`q-${question.id}`}
                onToggle={toggle}
              />
            );
          })}

        {question.type === 'short_answer' &&
          (question.prompt.length > 100 ? (
            <Textarea
              value={answer.text}
              onChange={(e) => setText(e.target.value)}
              disabled={readOnly}
              placeholder={t('assessment.question.answerPlaceholder')}
            />
          ) : (
            <Input
              value={answer.text}
              onChange={(e) => setText(e.target.value)}
              disabled={readOnly}
              placeholder={t('assessment.question.answerPlaceholder')}
            />
          ))}
      </div>

      {explanation && (
        <div className="mt-5 rounded-xl border border-brand-100 bg-brand-25 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {t('assessment.question.explanation')}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{explanation}</p>
        </div>
      )}
    </article>
  );
}

function OptionCard({
  letter,
  text,
  imageUrl,
  checked,
  multi,
  state,
  disabled,
  name,
  onToggle,
}: {
  letter: string;
  text: string;
  imageUrl?: string | null;
  checked: boolean;
  multi: boolean;
  state: OptionState;
  disabled?: boolean;
  name: string;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();

  // Grading colors take priority over selection when review state is present.
  const tone =
    state === 'correct'
      ? 'border-success-500 bg-success-50 ring-1 ring-success-500/30'
      : state === 'incorrect'
        ? 'border-danger-500 bg-danger-50 ring-1 ring-danger-500/30'
        : checked
          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-300'
          : 'border-ink-200 bg-white hover:border-brand-300 hover:bg-ink-50';

  const badgeTone =
    state === 'correct'
      ? 'bg-success-500 text-white'
      : state === 'incorrect'
        ? 'bg-danger-500 text-white'
        : checked
          ? 'bg-brand-600 text-white'
          : 'bg-ink-100 text-ink-600';

  return (
    <motion.label
      whileTap={disabled || reduce ? undefined : { scale: 0.99 }}
      className={cn(
        'flex min-h-[52px] cursor-pointer items-center gap-3.5 rounded-xl border p-3.5 text-left transition-colors',
        // The native input is visually hidden (sr-only), so surface keyboard
        // focus on the card itself for full keyboard operability.
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500',
        tone,
        disabled && 'cursor-default',
      )}
    >
      <input
        type={multi ? 'checkbox' : 'radio'}
        name={name}
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold transition-colors',
          multi && 'rounded-md',
          badgeTone,
        )}
        aria-hidden
      >
        {state === 'correct' ? (
          <CheckIcon className="size-4" />
        ) : state === 'incorrect' ? (
          <CloseIcon className="size-4" />
        ) : (
          letter
        )}
      </span>
      <span className="min-w-0 flex-1 text-[15px] font-medium text-navy-900">{text}</span>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg border border-ink-200 object-cover"
        />
      )}
      {checked && !state && (
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
          <CheckIcon className="size-3.5" />
        </span>
      )}
    </motion.label>
  );
}
