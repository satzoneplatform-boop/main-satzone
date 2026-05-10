import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className, id, checked, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;

  return (
    <label htmlFor={inputId} className={cn('flex cursor-pointer items-center gap-3', className)}>
      <span className="relative grid place-items-center">
        <input
          ref={ref}
          id={inputId}
          type="radio"
          checked={checked}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className={cn(
            'grid size-5 place-items-center rounded-full border transition-colors',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-100',
            checked
              ? 'border-brand-600'
              : 'border-ink-300',
          )}
        >
          {checked && <span className="size-2.5 rounded-full bg-brand-600" />}
        </span>
      </span>
      {label && <span className="text-sm text-ink-900">{label}</span>}
    </label>
  );
});

interface RadioGroupProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  name: string;
}

export function RadioGroup<T extends string>({ value, onChange, options, name }: RadioGroupProps<T>) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          label={opt.label}
          checked={opt.value === value}
          onChange={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}
