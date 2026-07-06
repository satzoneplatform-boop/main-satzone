import { motion, useReducedMotion } from 'motion/react';
import { CountUp } from '@/components/motion/CountUp';
import { cn } from '@/lib/cn';

interface ScoreRingProps {
  /** Current value (e.g. an SAT score or a percentage). */
  value: number;
  /** Maximum value the ring represents. */
  max?: number;
  size?: number;
  strokeWidth?: number;
  /** Label rendered under the value (e.g. "SAT score"). */
  label?: string;
  /** Render the numeric value with a count-up animation. */
  countUp?: boolean;
  /** Appended after the numeric value (e.g. "%"). */
  suffix?: string;
  /** Tailwind text color class for the value. */
  valueClassName?: string;
  /** Ring color (stroke). Defaults to brand blue. */
  ringClassName?: string;
  trackClassName?: string;
  className?: string;
}

/**
 * Circular progress ring with an animated sweep and optional count-up value.
 * Used for SAT score targets, subject mastery, and mock-test results.
 */
export function ScoreRing({
  value,
  max = 1600,
  size = 128,
  strokeWidth = 10,
  label,
  countUp = true,
  suffix = '',
  valueClassName = 'text-navy-900',
  ringClassName = 'text-brand-600',
  trackClassName = 'text-ink-100',
  className,
}: ScoreRingProps) {
  const reduce = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / max));

  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
          stroke="currentColor"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={ringClassName}
          stroke="currentColor"
          strokeDasharray={circumference}
          initial={reduce ? false : { strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - pct) }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className={cn('text-2xl font-bold tabular-nums', valueClassName)}>
          {countUp ? <CountUp to={value} suffix={suffix} /> : `${value}${suffix}`}
        </span>
        {label && <span className="mt-0.5 text-xs font-medium text-ink-500">{label}</span>}
      </div>
    </div>
  );
}
