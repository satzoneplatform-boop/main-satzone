import { createContext } from 'react';
import type { TranslationKey } from './en';

export type Locale = 'en' | 'uz' | 'ru';

export type Vars = Record<string, string | number>;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
