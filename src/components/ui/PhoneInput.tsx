import { forwardRef, useId, useState } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'UZ', dial: '+998', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
];

export interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange?: (e164: string) => void;
  defaultCountry?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
  disabled?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      label,
      value = '',
      onChange,
      defaultCountry = 'ID',
      error,
      placeholder = 'Enter number',
      required,
      name,
      disabled,
    },
    ref,
  ) {
    const reactId = useId();
    const inputId = `phone-${reactId}`;
    const [country, setCountry] = useState<Country>(
      () => COUNTRIES.find((c) => c.code === defaultCountry) ?? COUNTRIES[0],
    );

    // Strip the dial-code prefix from the e.164 string for display.
    const localNumber = value.startsWith(country.dial)
      ? value.slice(country.dial.length).replace(/^[\s-]+/, '')
      : value;

    const emit = (next: string, nextCountry = country) => {
      onChange?.(`${nextCountry.dial}${next.replace(/[^0-9]/g, '')}`);
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
            {label}
            {required && <span className="ml-0.5 text-danger-500">*</span>}
          </label>
        )}
        <div
          className={cn(
            'flex items-stretch rounded-lg border bg-white shadow-[var(--shadow-input)]',
            'focus-within:ring-2 focus-within:ring-brand-100',
            error
              ? 'border-danger-500 focus-within:border-danger-500'
              : 'border-ink-200 focus-within:border-brand-500',
          )}
        >
          <label className="relative flex items-center gap-1.5 rounded-l-lg bg-ink-50 px-3 text-sm text-ink-700">
            <span className="text-base leading-none" aria-hidden>{country.flag}</span>
            <span className="font-medium">{country.dial}</span>
            <ChevronDownIcon className="text-ink-400" />
            <select
              aria-label="Country dial code"
              value={country.code}
              onChange={(e) => {
                const next = COUNTRIES.find((c) => c.code === e.target.value);
                if (next) {
                  setCountry(next);
                  emit(localNumber, next);
                }
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={disabled}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dial})
                </option>
              ))}
            </select>
          </label>

          <input
            ref={ref}
            id={inputId}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={disabled}
            required={required}
            value={localNumber}
            onChange={(e) => emit(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full bg-transparent px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  },
);
