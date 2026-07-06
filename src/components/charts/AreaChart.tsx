import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';

interface AreaChartProps {
  /** Y values, left → right. */
  data: number[];
  /** X-axis labels (same length as data). */
  labels?: string[];
  /** Fixed lower bound; defaults to min(data) with headroom. */
  min?: number;
  /** Fixed upper bound; defaults to max(data) with headroom. */
  max?: number;
  /** Stroke/fill hue. */
  color?: string;
  height?: number;
  className?: string;
  /** Show horizontal gridlines. */
  grid?: boolean;
  valueFormatter?: (v: number) => string;
}

/**
 * Dependency-free SVG area chart with a self-drawing line, gradient fill,
 * end-point marker, and optional gridlines. Scales responsively via a fixed
 * viewBox; the line draws in on scroll into view (reduced-motion safe).
 */
export function AreaChart({
  data,
  labels,
  min,
  max,
  color = '#2563EB',
  height = 220,
  className,
  grid = true,
  valueFormatter = (v) => String(Math.round(v)),
}: AreaChartProps) {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();

  const W = 640;
  const H = 240;
  const padX = 16;
  const padTop = 16;
  const padBottom = labels ? 30 : 12;

  const lo = min ?? Math.min(...data) - (Math.max(...data) - Math.min(...data)) * 0.2;
  const hi = max ?? Math.max(...data) + (Math.max(...data) - Math.min(...data)) * 0.15;
  const span = hi - lo || 1;

  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const pts = data.map((v, i) => {
    const x = padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padTop + innerH - ((v - lo) / span) * innerH;
    return { x, y };
  });

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${padTop + innerH} L${pts[0].x},${padTop + innerH} Z`;
  const last = pts[pts.length - 1];

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => padTop + innerH * f);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn('h-auto w-full', className)}
      style={{ maxHeight: height }}
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {grid &&
        gridLines.map((y, i) => (
          <line
            key={i}
            x1={padX}
            y1={y}
            x2={W - padX}
            y2={y}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray={i === gridLines.length - 1 ? '0' : '4 4'}
          />
        ))}

      {/* Area fill fades in */}
      <motion.path
        d={area}
        fill={`url(#area-${uid})`}
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />

      {/* Line draws in */}
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* End marker */}
      <motion.circle
        cx={last.x}
        cy={last.y}
        r="5"
        fill={color}
        stroke="#fff"
        strokeWidth="2.5"
        initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ delay: 1.1, type: 'spring', stiffness: 300, damping: 18 }}
      />

      {labels &&
        labels.map((lb, i) => (
          <text
            key={i}
            x={pts[i].x}
            y={H - 8}
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#64748B"
          >
            {lb}
          </text>
        ))}

      <title>{`Latest value: ${valueFormatter(data[data.length - 1])}`}</title>
    </svg>
  );
}
