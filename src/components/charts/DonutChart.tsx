import { useId } from 'react';
import { cn } from '@/lib/cn';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * Lightweight SVG donut chart — no library.
 * `segments` are summed and rendered as proportional arc segments.
 */
export function DonutChart({
  segments,
  size = 160,
  strokeWidth = 16,
  className,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const reactId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  // Precompute each segment's arc length + start offset (lint-safe: no
  // mutation during render).
  const arcs = segments.reduce<Array<{ length: number; start: number }>>(
    (acc, s, i) => {
      const length = (s.value / total) * circumference;
      const start = i === 0 ? 0 : acc[i - 1].start + acc[i - 1].length;
      acc.push({ length, start });
      return acc;
    },
    [],
  );

  return (
    <div className={cn('relative inline-block', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-progress-bg)"
          strokeWidth={strokeWidth}
        />
        {segments.map((s, i) => {
          const { length, start } = arcs[i];
          const dasharray = `${length} ${circumference - length}`;
          const dashoffset = -start;
          return (
            <circle
              key={`${reactId}-${s.label}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            {centerValue && (
              <div className="text-2xl font-semibold text-ink-900">{centerValue}</div>
            )}
            {centerLabel && (
              <div className="text-xs text-ink-500">{centerLabel}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
