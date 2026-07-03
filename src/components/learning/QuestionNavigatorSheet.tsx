import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/I18nProvider';

export interface QuestionNavItem {
  id: string;
  answered: boolean;
  flagged: boolean;
}

/**
 * Shared question-palette grid — used by the desktop sidebar and the mobile
 * bottom sheet so both always show identical state (answered / flagged /
 * current) and jump behavior.
 */
export function QuestionGrid({
  items,
  activeIdx,
  onJump,
  columns = 5,
}: {
  items: QuestionNavItem[];
  activeIdx: number;
  onJump: (index: number) => void;
  columns?: 5 | 6 | 8;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        'grid gap-2',
        columns === 5 && 'grid-cols-5',
        columns === 6 && 'grid-cols-6',
        columns === 8 && 'grid-cols-8',
      )}
    >
      {items.map((q, i) => {
        const isCurrent = i === activeIdx;
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onJump(i)}
            className={cn(
              'relative grid aspect-square min-h-11 place-items-center rounded-md border text-xs font-medium',
              isCurrent && 'ring-2 ring-brand-500 ring-offset-1',
              q.answered
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
            )}
            aria-current={isCurrent ? 'true' : undefined}
            aria-label={`${t('assessment.take.question')} ${i + 1}`}
          >
            {i + 1}
            {q.flagged && (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warn-500 ring-2 ring-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function QuestionLegend() {
  const t = useT();
  return (
    <div className="space-y-2 text-xs text-ink-600">
      <LegendRow swatch="bg-brand-600 border-brand-600" label={t('assessment.take.legend.answered')} />
      <LegendRow swatch="bg-white border-ink-200" label={t('assessment.take.legend.unanswered')} />
      <LegendRow swatch="bg-white border-ink-200" dot label={t('assessment.take.legend.flagged')} />
    </div>
  );
}

function LegendRow({
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
      <span className={cn('relative grid size-5 place-items-center rounded-md border', swatch)}>
        {dot && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warn-500 ring-2 ring-white" />
        )}
      </span>
      <span>{label}</span>
    </div>
  );
}

/**
 * Mobile question navigator — a bottom sheet with the question grid, legend,
 * progress summary, and submit action. Jumping to a question closes the
 * sheet so the student lands directly on it. Respects reduced motion,
 * closes on Escape / backdrop tap, and locks body scroll while open.
 */
export function QuestionNavigatorSheet({
  open,
  onClose,
  items,
  activeIdx,
  onJump,
  answeredCount,
  onSubmit,
  submitDisabled,
}: {
  open: boolean;
  onClose: () => void;
  items: QuestionNavItem[];
  activeIdx: number;
  onJump: (index: number) => void;
  answeredCount: number;
  onSubmit: () => void;
  submitDisabled?: boolean;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const total = items.length;

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
            aria-label={t('assessment.take.closeNavigator')}
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
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl"
          >
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" aria-hidden />
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy-900">
                  {t('assessment.take.navigator')}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-500">
                    {t('assessment.take.answeredCount', {
                      answered: answeredCount,
                      total,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('assessment.take.closeNavigator')}
                    className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
                  >
                    <CloseIcon className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <QuestionGrid
                  items={items}
                  activeIdx={activeIdx}
                  onJump={(i) => {
                    onJump(i);
                    onClose();
                  }}
                  columns={6}
                />
              </div>

              <div className="mt-5">
                <QuestionLegend />
              </div>

              <div className="mt-5">
                <Button fullWidth onClick={onSubmit} disabled={submitDisabled}>
                  {t('assessment.take.submit')}
                </Button>
                <p className="mt-2 text-center text-xs text-ink-500">
                  {answeredCount === total
                    ? t('assessment.take.allAnswered')
                    : t('assessment.take.unanswered', { n: total - answeredCount })}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
