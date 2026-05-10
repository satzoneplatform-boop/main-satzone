import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-200 bg-white p-8 shadow-[var(--shadow-card)]',
        className,
      )}
      {...rest}
    />
  );
}
