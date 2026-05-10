import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, containerClassName, id, value, ...rest },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? reactId;
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-900">
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative rounded-lg border bg-white shadow-[var(--shadow-input)] transition-colors',
          'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100',
          error ? 'border-danger-500' : 'border-ink-200',
        )}
      >
        <select
          ref={ref}
          id={selectId}
          value={value}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            'h-11 w-full appearance-none rounded-lg bg-transparent px-3 pr-9 text-sm text-ink-900 focus:outline-none',
            !value && 'text-ink-400',
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
      </div>
      {error ? (
        <p className="text-xs text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});
