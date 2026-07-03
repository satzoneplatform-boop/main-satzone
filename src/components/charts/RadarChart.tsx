import { cn } from '@/lib/cn';

export interface RadarAxis {
  label: string;
  /** 0..1 scaled value */
  value: number;
}

interface RadarChartProps {
  axes: RadarAxis[];
  size?: number;
  className?: string;
  rings?: number;
  fill?: string;
  stroke?: string;
}

/**
 * Pure-SVG radar chart for the "Skill you're building" card.
 * Renders concentric rings + axes + filled polygon.
 */
export function RadarChart({
  axes,
  size = 200,
  className,
  rings = 4,
  fill = 'rgba(37, 99, 235, 0.16)',
  stroke = '#2563EB',
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 28;
  const n = axes.length;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  const polygonPoints = axes
    .map((a, i) => {
      const p = point(i, Math.max(0.05, Math.min(1, a.value)) * radius);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <div className={cn('relative inline-block', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Skill radar">
        {Array.from({ length: rings }, (_, ring) => {
          const r = ((ring + 1) / rings) * radius;
          const pts = axes
            .map((_, i) => {
              const p = point(i, r);
              return `${p.x},${p.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={ring}
              points={pts}
              fill="none"
              stroke="#DDE3EB"
              strokeWidth="1"
            />
          );
        })}

        {axes.map((_, i) => {
          const p = point(i, radius);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#DDE3EB"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {axes.map((a, i) => {
          const p = point(i, Math.max(0.05, Math.min(1, a.value)) * radius);
          return (
            <circle
              key={`pt-${i}`}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={stroke}
            />
          );
        })}

        {axes.map((a, i) => {
          const p = point(i, radius + 14);
          return (
            <text
              key={`label-${i}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="500"
              fill="#62748E"
            >
              {a.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
