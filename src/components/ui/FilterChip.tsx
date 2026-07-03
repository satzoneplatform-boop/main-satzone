import type { ReactNode } from 'react';
import { CloseIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

interface FilterChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({ children, onRemove, className }: FilterChipProps) {
  const t = useT();
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
          aria-label={t('ui.removeFilter')}
          onClick={onRemove}
          className="-my-0.5 -mr-1 grid size-5 place-items-center rounded-full text-ink-500 transition-colors duration-150 hover:bg-ink-200 hover:text-ink-700"
        >
          <CloseIcon className="size-3" />
        </button>
      )}
    </span>
  );
}
