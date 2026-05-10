import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  trailing?: ReactNode;
  bodyClassName?: string;
}

export function DashboardCard({
  title,
  trailing,
  className,
  bodyClassName,
  children,
  ...rest
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]',
        className,
      )}
      {...rest}
    >
      {(title || trailing) && (
        <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          {title && <h2 className="text-base font-semibold text-ink-900">{title}</h2>}
          {trailing}
        </header>
      )}
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
