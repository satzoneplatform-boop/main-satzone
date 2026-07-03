import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  size?: 'sm' | 'md';
  /** Animate the fill growing in when it scrolls into view. */
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  trackClassName,
  fillClassName,
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const reduce = useReducedMotion();
  const shouldAnimate = animated && !reduce;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'w-full overflow-hidden rounded-full bg-progress-bg',
        size === 'sm' ? 'h-1.5' : 'h-2',
        trackClassName,
        className,
      )}
    >
      <motion.div
        className={cn('h-full rounded-full bg-brand-600', fillClassName)}
        initial={shouldAnimate ? { width: 0 } : false}
        whileInView={shouldAnimate ? { width: `${pct}%` } : undefined}
        animate={shouldAnimate ? undefined : { width: `${pct}%` }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={shouldAnimate ? undefined : { width: `${pct}%` }}
      />
    </div>
  );
}
