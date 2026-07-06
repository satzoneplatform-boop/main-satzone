import { useEffect, useRef, useState } from 'react';
import {
  animate,
  useInView,
  useReducedMotion,
} from 'motion/react';

interface CountUpProps {
  /** Target value to count to. */
  to: number;
  /** Value to start from (default 0). */
  from?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Decimal places to render. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Insert thousands separators. */
  separator?: boolean;
  className?: string;
}

/**
 * Counts up to `to` when scrolled into view. Respects reduced-motion by
 * rendering the final value immediately. Used for scores and stats.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = false,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, reduce, from, to, duration]);

  // With reduced motion we skip the animation and show the final value as
  // soon as the element is in view — derived here instead of via setState.
  const current = reduce && inView ? to : value;

  const formatted = (() => {
    const fixed = current.toFixed(decimals);
    if (!separator) return fixed;
    const [intPart, decPart] = fixed.split('.');
    const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${withSep}.${decPart}` : withSep;
  })();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
