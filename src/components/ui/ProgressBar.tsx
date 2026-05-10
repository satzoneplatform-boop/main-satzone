import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({
  value,
  max = 100,
  className,
  trackClassName,
  fillClassName,
  size = 'md',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      className={cn(
        'w-full overflow-hidden rounded-full bg-progress-bg',
        size === 'sm' ? 'h-1.5' : 'h-2',
        trackClassName,
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full bg-brand-600 transition-[width]', fillClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
