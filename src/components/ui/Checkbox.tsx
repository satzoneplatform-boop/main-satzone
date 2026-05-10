import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { CheckIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, checked, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;

  return (
    <label
      htmlFor={inputId}
      className={cn('flex cursor-pointer items-start gap-3', className)}
    >
      <span className="relative grid place-items-center pt-0.5">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className={cn(
            'grid size-5 place-items-center rounded-md border transition-colors',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-100',
            checked
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-ink-300 bg-white',
          )}
        >
          {checked && <CheckIcon className="size-3.5" />}
        </span>
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm text-ink-900">{label}</span>}
          {description && (
            <span className="text-xs text-ink-500">{description}</span>
          )}
        </span>
      )}
    </label>
  );
});
