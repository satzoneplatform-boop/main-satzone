import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Convert a backend `duration_minutes` (int) into a short human label.
 *  90  -> "1h 30m"
 *  45  -> "45m"
 *  600 -> "10h"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/**
 * Format `price_cents` with the given ISO 4217 code.
 * Returns "Free" when `is_free` is true.
 *
 * UZS is rendered as a plain grouped amount with a trailing "sum"
 * (e.g. "100 sum") rather than the default ISO presentation ("UZS 100").
 */
export function formatPrice(
  priceCents: number,
  currency = 'USD',
  isFree = false,
): string {
  if (isFree || priceCents === 0) return 'Free';
  const amount = priceCents / 100;
  if (currency.toUpperCase() === 'UZS') {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} sum`;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(0)}`;
  }
}
