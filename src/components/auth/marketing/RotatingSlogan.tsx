import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/I18nProvider';

interface RotatingSloganProps {
  /** i18n keys to cross-fade through. */
  keys: TranslationKey[];
  /** Dwell time per line, ms. */
  interval?: number;
  className?: string;
}

/**
 * Cross-fades through a list of marketing lines. Reserves a fixed height so
 * the hero never reflows on swap. Under reduced motion it shows the first line
 * statically with no timer.
 */
export function RotatingSlogan({ keys, interval = 4000, className }: RotatingSloganProps) {
  const t = useT();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || keys.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % keys.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [reduce, keys.length, interval]);

  return (
    <div className={`relative min-h-[2.75rem] ${className ?? ''}`} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.p
          key={reduce ? 'static' : index}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 text-base font-medium leading-snug text-brand-200"
        >
          {t(keys[reduce ? 0 : index])}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
