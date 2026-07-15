import type { TranslationKey } from '@/i18n/en';

/**
 * Seed data for the auth-panel testimonial carousel. Add an entry by appending
 * one object here plus its three i18n keys (quote/name/city) in en/uz/ru.
 * Translatable text is referenced by key; structural data is inline.
 */
export interface Testimonial {
  id: string;
  /** 1–5, renders that many amber stars. */
  stars: number;
  /** SAT score, shown as "SAT {score} · {city}". */
  score: number;
  quoteKey: TranslationKey;
  nameKey: TranslationKey;
  cityKey: TranslationKey;
  /** Initials fallback for the avatar circle. */
  initials: string;
  /** Optional avatar image path under /public. */
  avatarUrl?: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 'r1',
    stars: 5,
    score: 1480,
    quoteKey: 'auth.brand.review.1.quote',
    nameKey: 'auth.brand.review.1.name',
    cityKey: 'auth.brand.review.1.city',
    initials: 'AK',
  },
  {
    id: 'r2',
    stars: 5,
    score: 1450,
    quoteKey: 'auth.brand.review.2.quote',
    nameKey: 'auth.brand.review.2.name',
    cityKey: 'auth.brand.review.2.city',
    initials: 'JT',
  },
  {
    id: 'r3',
    stars: 4,
    score: 1390,
    quoteKey: 'auth.brand.review.3.quote',
    nameKey: 'auth.brand.review.3.name',
    cityKey: 'auth.brand.review.3.city',
    initials: 'MR',
  },
  {
    id: 'r4',
    stars: 5,
    score: 1520,
    quoteKey: 'auth.brand.review.4.quote',
    nameKey: 'auth.brand.review.4.name',
    cityKey: 'auth.brand.review.4.city',
    initials: 'SN',
  },
  {
    id: 'r5',
    stars: 4,
    score: 1340,
    quoteKey: 'auth.brand.review.5.quote',
    nameKey: 'auth.brand.review.5.name',
    cityKey: 'auth.brand.review.5.city',
    initials: 'DA',
  },
  {
    id: 'r6',
    stars: 5,
    score: 1420,
    quoteKey: 'auth.brand.review.6.quote',
    nameKey: 'auth.brand.review.6.name',
    cityKey: 'auth.brand.review.6.city',
    initials: 'BX',
  },
];
