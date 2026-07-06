import { forwardRef, useId, useMemo, useState } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { code: 'UZ', dial: '+998', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: 'KZ', dial: '+7', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: 'KG', dial: '+996', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: 'TJ', dial: '+992', flag: '🇹🇯', name: 'Tajikistan' },
  { code: 'TM', dial: '+993', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
];

export interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange?: (e164: string) => void;
  defaultCountry?: string;
  /** Restrict the dial-code dropdown to this list of ISO-3166 codes. */
  countries?: string[];
  error?: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
  disabled?: boolean;
}

/** Match a stored e.164 number against the longest known dial-code prefix. */
function detectCountry(value: string, choices: Country[]): Country | null {
  if (!value) return null;
  const match = [...choices]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => value.startsWith(c.dial));
  return match ?? null;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      label,
      value = '',
      onChange,
      defaultCountry = 'UZ',
      countries,
      error,
      placeholder,
      required,
      name,
      disabled,
    },
    ref,
  ) {
    const t = useT();
    const reactId = useId();
    const inputId = `phone-${reactId}`;

    // Filter the dropdown if the caller scoped it (e.g. UZ-only).
    const choices = useMemo(
      () =>
        countries && countries.length > 0
          ? COUNTRIES.filter((c) => countries.includes(c.code))
          : COUNTRIES,
      [countries],
    );

    const [country, setCountry] = useState<Country>(() => {
      // Prefer the country whose dial-code actually matches the stored value
      // — otherwise the dropdown ends up showing one prefix while the input
      // contains a different one (e.g. selector "+62" next to "+998…").
      const detected = detectCountry(value, choices);
      if (detected) return detected;
      return (
        choices.find((c) => c.code === defaultCountry) ?? choices[0] ?? COUNTRIES[0]
      );
    });

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
            'flex items-stretch rounded-xl border bg-white shadow-[var(--shadow-input)]',
            'focus-within:ring-2 focus-within:ring-brand-100',
            error
              ? 'border-danger-500 focus-within:border-danger-500'
              : 'border-ink-200 focus-within:border-brand-500',
          )}
        >
          <label className="relative flex items-center gap-1.5 rounded-l-xl bg-ink-50 px-3 text-sm text-ink-700">
            <span className="text-base leading-none" aria-hidden>{country.flag}</span>
            <span className="font-medium">{country.dial}</span>
            {choices.length > 1 && <ChevronDownIcon className="text-ink-400" />}
            <select
              aria-label={t('ui.countryCode')}
              value={country.code}
              onChange={(e) => {
                const next = choices.find((c) => c.code === e.target.value);
                if (next) {
                  setCountry(next);
                  emit(localNumber, next);
                }
              }}
              className={cn(
                'absolute inset-0 opacity-0',
                choices.length > 1 ? 'cursor-pointer' : 'pointer-events-none',
              )}
              disabled={disabled || choices.length <= 1}
            >
              {choices.map((c) => (
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
            placeholder={placeholder ?? t('ui.phonePlaceholder')}
            className="h-11 w-full bg-transparent px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none disabled:cursor-not-allowed disabled:text-ink-400"
          />
        </div>
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  },
);
