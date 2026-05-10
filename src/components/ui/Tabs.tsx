import { cn } from '@/lib/cn';

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'pill',
  className,
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex items-center gap-6 border-b border-ink-200', className)}>
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm font-medium transition-colors',
              item.value === value
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-ink-500 hover:text-ink-700',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 text-xs text-ink-400">({item.count})</span>
            )}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full bg-ink-100 p-1', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            item.value === value
              ? 'bg-white text-ink-900 shadow-[var(--shadow-input)]'
              : 'text-ink-500 hover:text-ink-700',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
