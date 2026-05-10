import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftSlot, rightSlot, className, containerClassName, id, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-white px-3 transition-colors',
          'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100',
          'shadow-[var(--shadow-input)]',
          error
            ? 'border-danger-500 focus-within:border-danger-500 focus-within:ring-red-100'
            : 'border-ink-200',
        )}
      >
        {leftSlot && <span className="text-ink-400">{leftSlot}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400',
            'focus:outline-none disabled:cursor-not-allowed disabled:text-ink-400',
            className,
          )}
          {...rest}
        />
        {rightSlot && <span className="text-ink-400">{rightSlot}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
