import type { HTMLAttributes } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover lift + elevated shadow. Use for clickable/linked cards. */
  interactive?: boolean;
}

const BASE = 'rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8';

export function Card({ className, interactive = false, ...rest }: CardProps) {
  const reduce = useReducedMotion();

  if (interactive) {
    return (
      <motion.div
        whileHover={reduce ? undefined : { y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className={cn(
          BASE,
          'cursor-pointer transition-shadow hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]',
          className,
        )}
        {...(rest as HTMLMotionProps<'div'>)}
      />
    );
  }

  return <div className={cn(BASE, className)} {...rest} />;
}
