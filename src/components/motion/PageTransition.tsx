import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE_BRAND } from './variants';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a routed page so it enters with a subtle fade + rise on mount.
 *
 * Enter-only (no exit) keeps it reliable under React Router's data router,
 * which unmounts the previous route immediately. Keying the wrapper by
 * pathname (see DashboardShell) re-triggers the entrance on each navigation.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_BRAND }}
    >
      {children}
    </motion.div>
  );
}
