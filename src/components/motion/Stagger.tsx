import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { staggerContainer, transitions } from './variants';

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's reveal. */
  stagger?: number;
  delayChildren?: number;
  onView?: boolean;
  as?: 'div' | 'ul' | 'ol' | 'section';
}

/**
 * Container that reveals its <StaggerItem> children in sequence.
 * Pair with <StaggerItem> for each child you want to animate.
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0.05,
  onView = true,
  as = 'div',
}: StaggerProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      {...(onView
        ? { whileInView: 'visible', viewport: { once: true, amount: 0.2 } }
        : { animate: 'visible' })}
    >
      {children}
    </MotionTag>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: 'div' | 'li' | 'article' | 'section';
}

export function StaggerItem({ children, className, y = 16, as = 'div' }: StaggerItemProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];
  const variants: Variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: transitions.base } }
    : {
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: transitions.base },
      };
  return (
    <MotionTag className={className} variants={variants}>
      {children}
    </MotionTag>
  );
}
