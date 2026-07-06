import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { transitions } from './variants';

interface RevealProps {
  children: ReactNode;
  /** Delay before the reveal starts (seconds). */
  delay?: number;
  /** Pixels to travel on the y-axis. */
  y?: number;
  className?: string;
  /** Animate on scroll into view (default) vs. immediately on mount. */
  onView?: boolean;
  as?: 'div' | 'section' | 'li' | 'article' | 'span';
}

/**
 * Reveals its children with a fade + rise when scrolled into view.
 * Collapses to a plain fade (no movement) under prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  onView = true,
  as = 'div',
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  const variants: Variants = reduce
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { ...transitions.base, delay } },
      }
    : {
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { ...transitions.base, delay } },
      };

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      {...(onView
        ? { whileInView: 'visible', viewport: { once: true, amount: 0.25 } }
        : { animate: 'visible' })}
    >
      {children}
    </MotionTag>
  );
}
