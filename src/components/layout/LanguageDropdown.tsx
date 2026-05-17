import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, GlobeIcon } from '@/components/icons';
import { useI18n, type Locale } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

const LANGUAGES: { value: Locale; labelKey: 'lang.en' | 'lang.uz' | 'lang.ru'; code: string }[] = [
  { value: 'en', labelKey: 'lang.en', code: 'EN' },
  { value: 'uz', labelKey: 'lang.uz', code: 'UZ' },
  { value: 'ru', labelKey: 'lang.ru', code: 'RU' },
];

type Variant = 'dark' | 'light';

interface LanguageDropdownProps {
  variant?: Variant;
}

export function LanguageDropdown({ variant = 'dark' }: LanguageDropdownProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeCode = LANGUAGES.find((l) => l.value === locale)?.code ?? 'EN';
  const isDark = variant === 'dark';

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('topbar.language')}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors',
          isDark
            ? 'border-ink-800 bg-ink-800/70 text-ink-300 hover:bg-ink-800 hover:text-white'
            : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
        )}
      >
        <GlobeIcon className="size-4" />
        <span className="text-xs font-semibold tracking-wide">{activeCode}</span>
        <ChevronDownIcon className={isDark ? 'text-ink-400' : 'text-ink-500'} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-44 overflow-hidden rounded-lg border border-ink-200 bg-white text-ink-900 shadow-lg"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              type="button"
              role="menuitemradio"
              aria-checked={lang.value === locale}
              onClick={() => {
                setLocale(lang.value);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm',
                'hover:bg-ink-50',
                lang.value === locale && 'bg-brand-50 text-brand-700 font-medium',
              )}
            >
              <span>{t(lang.labelKey)}</span>
              <span className="text-xs text-ink-500">{lang.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
