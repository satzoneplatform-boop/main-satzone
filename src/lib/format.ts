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
 */
export function formatPrice(
  priceCents: number,
  currency = 'USD',
  isFree = false,
): string {
  if (isFree || priceCents === 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(priceCents / 100);
  } catch {
    return `$${(priceCents / 100).toFixed(0)}`;
  }
}
