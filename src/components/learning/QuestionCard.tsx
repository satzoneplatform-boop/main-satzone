import { Checkbox } from '@/components/ui/Checkbox';
import { Radio } from '@/components/ui/Radio';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import type { QuestionStudentRead } from '@/api/assessments';

export interface QuestionAnswer {
  selectedOptionIds: string[];
  text: string;
}

interface QuestionCardProps {
  index: number;
  question: QuestionStudentRead;
  answer: QuestionAnswer;
  onChange: (answer: QuestionAnswer) => void;
  /** Show as read-only with prior selection (review mode). */
  readOnly?: boolean;
}

/**
 * Renders the appropriate input(s) for a question based on its type
 * (single_choice / multi_choice / true_false / short_answer) per
 * FRONTEND.md §4.8.
 */
export function QuestionCard({
  index,
  question,
  answer,
  onChange,
  readOnly = false,
}: QuestionCardProps) {
  function setOptions(ids: string[]) {
    if (readOnly) return;
    onChange({ ...answer, selectedOptionIds: ids });
  }
  function setText(text: string) {
    if (readOnly) return;
    onChange({ ...answer, text });
  }

  // Sort options by `order` (backend may return them in any order).
  const opts = [...question.options].sort((a, b) => a.order - b.order);

  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold text-ink-900">
        {index}. {question.prompt}
      </h3>
      {question.image_url && (
        <img
          src={question.image_url}
          alt=""
          className="mt-3 max-h-80 rounded-md border border-ink-200 object-contain"
        />
      )}

      <div className="mt-4 space-y-3">
        {(question.type === 'single_choice' || question.type === 'true_false') &&
          opts.map((opt) => (
            <div key={opt.id} className="flex flex-col gap-1">
              <Radio
                name={`q-${question.id}`}
                value={opt.id}
                label={opt.text}
                checked={answer.selectedOptionIds[0] === opt.id}
                onChange={() => setOptions([opt.id])}
                disabled={readOnly}
              />
              {opt.image_url && (
                <img
                  src={opt.image_url}
                  alt=""
                  className="ml-7 max-h-40 rounded border border-ink-200 object-contain"
                />
              )}
            </div>
          ))}

        {question.type === 'multi_choice' &&
          opts.map((opt) => {
            const checked = answer.selectedOptionIds.includes(opt.id);
            return (
              <div key={opt.id} className="flex flex-col gap-1">
                <Checkbox
                  label={opt.text}
                  checked={checked}
                  disabled={readOnly}
                  onChange={(e) => {
                    const next = new Set(answer.selectedOptionIds);
                    e.target.checked ? next.add(opt.id) : next.delete(opt.id);
                    setOptions(Array.from(next));
                  }}
                />
                {opt.image_url && (
                  <img
                    src={opt.image_url}
                    alt=""
                    className="ml-7 max-h-40 rounded border border-ink-200 object-contain"
                  />
                )}
              </div>
            );
          })}

        {question.type === 'short_answer' && (
          question.prompt.length > 100 ? (
            <Textarea
              value={answer.text}
              onChange={(e) => setText(e.target.value)}
              disabled={readOnly}
              placeholder="Type your answer…"
            />
          ) : (
            <Input
              value={answer.text}
              onChange={(e) => setText(e.target.value)}
              disabled={readOnly}
              placeholder="Type your answer…"
            />
          )
        )}
      </div>
    </article>
  );
}
