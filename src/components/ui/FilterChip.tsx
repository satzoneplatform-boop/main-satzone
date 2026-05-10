import type { ReactNode } from 'react';
import { CloseIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

interface FilterChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({ children, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700',
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove filter"
          onClick={onRemove}
          className="grid size-4 place-items-center rounded-full text-ink-400 hover:bg-ink-200 hover:text-ink-700"
        >
          <CloseIcon className="size-3" />
        </button>
      )}
    </span>
  );
}
