import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { CheckIcon, ArrowRightIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';

interface CompletionCelebrationProps {
  open: boolean;
  onClose: () => void;
  /** Optional "next" action — omitted when this was the last lesson. */
  onContinue?: () => void;
  title?: string;
  message?: string;
}

/**
 * Celebratory overlay shown when a learner completes a lesson.
 *
 * A spring-popped success ring with radiating pulses — brief and premium,
 * never a looping distraction. Collapses to a simple fade under
 * prefers-reduced-motion.
 */
export function CompletionCelebration({
  open,
  onClose,
  onContinue,
  title,
  message,
}: CompletionCelebrationProps) {
  const t = useT();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-modal"
          >
            <div className="relative mx-auto grid size-24 place-items-center">
              {!reduce &&
                [0, 1].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full bg-success-500/20"
                    initial={{ scale: 0.6, opacity: 0.6 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{
                      duration: 1.6,
                      ease: 'easeOut',
                      // A brief, finite celebration — pulses stop instead of
                      // looping so the overlay stays calm.
                      repeat: 2,
                      delay: i * 0.5,
                    }}
                  />
                ))}
              <motion.span
                className="relative grid size-20 place-items-center rounded-full bg-success-500 text-white shadow-[0_10px_30px_-8px_rgb(16_185_129/0.7)]"
                initial={reduce ? undefined : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.1 }}
              >
                <CheckIcon className="size-10" />
              </motion.span>
            </div>

            <h2 className="mt-6 text-xl font-bold tracking-tight text-navy-900">
              {title ?? t('learning.complete.title')}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ink-500">
              {message ?? t('learning.complete.message')}
            </p>

            <div className="mt-7 flex flex-col gap-2">
              {onContinue && (
                <Button fullWidth rightIcon={<ArrowRightIcon />} onClick={onContinue}>
                  {t('learning.complete.next')}
                </Button>
              )}
              <Button fullWidth variant="ghost" onClick={onClose}>
                {t('learning.complete.stay')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
