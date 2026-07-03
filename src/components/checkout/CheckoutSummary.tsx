import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { CheckIcon, LockIcon } from '@/components/icons';
import { formatPrice } from '@/lib/format';
import type { CourseDetail } from '@/types/api';
import type { PromocodePreview } from '@/api/promocodes';
import { useT } from '@/i18n/I18nProvider';

interface CheckoutSummaryProps {
  course: CourseDetail;
  onSubmit: () => void;
  loading?: boolean;
  ctaLabel?: string;
  /** Applied promo preview — server-computed amounts drive the breakdown. */
  promo?: PromocodePreview | null;
}

/**
 * Sticky order summary for checkout — course, an itemized price breakdown,
 * and trust indicators. Built so the promo-code discount row (Phase 3) can
 * slot into the breakdown without restructuring.
 */
export function CheckoutSummary({
  course,
  onSubmit,
  loading,
  ctaLabel,
  promo,
}: CheckoutSummaryProps) {
  const t = useT();
  const reduce = useReducedMotion();

  const hasDiscount =
    course.discount_price_cents != null &&
    course.discount_price_cents < course.price_cents &&
    !course.is_free;
  // Price the promo builds on: the course's own discounted price if any.
  const prePromoCents = hasDiscount ? course.discount_price_cents! : course.price_cents;
  const basePrice = formatPrice(course.price_cents, course.currency, course.is_free);
  const finalCents = promo ? promo.final_amount_cents : prePromoCents;
  const total = formatPrice(finalCents, course.currency, course.is_free);
  const resolvedCta = ctaLabel ?? t('checkout.summary.enrollNow');

  const trust = [
    t('checkout.summary.trust.secure'),
    t('checkout.summary.trust.instant'),
    t('checkout.summary.trust.certificate'),
  ];

  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
        <div className="border-b border-ink-100 bg-ink-50/60 px-5 py-4">
          <h2 className="text-base font-semibold text-navy-900">
            {t('checkout.summary.title')}
          </h2>
        </div>

        <div className="p-5">
          <div className="flex gap-3">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold text-navy-900">
                {course.title}
              </p>
              {course.instructor && (
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink-500">
                  <Avatar
                    src={course.instructor.avatar_url}
                    name={course.instructor.full_name}
                    size={16}
                  />
                  {course.instructor.full_name}
                </span>
              )}
            </div>
          </div>

          {/* Price breakdown */}
          <dl className="mt-5 space-y-2.5 border-t border-ink-100 pt-4 text-sm">
            <Row label={t('checkout.summary.coursePrice')} value={basePrice} />
            {hasDiscount && (
              <Row
                label={t('checkout.summary.courseDiscount')}
                value={`−${formatPrice(course.price_cents - course.discount_price_cents!, course.currency, false)}`}
                accent="success"
              />
            )}
            <AnimatePresence initial={false}>
              {promo && (
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Row
                    label={t('checkout.summary.promoDiscount', { code: promo.code })}
                    value={`−${formatPrice(promo.discount_cents, promo.currency, false)}`}
                    accent="success"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
            <span className="text-sm font-semibold text-navy-900">
              {t('checkout.summary.total')}
            </span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={total}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-xl font-bold text-brand-600"
              >
                {total}
              </motion.span>
            </AnimatePresence>
          </div>

          <Button fullWidth size="lg" className="mt-5" loading={loading} onClick={onSubmit}>
            {resolvedCta}
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <LockIcon className="size-3.5" />
            {t('checkout.summary.secureNote')}
          </p>
        </div>
      </section>

      <ul className="space-y-2.5 rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
        {trust.map((line) => (
          <li key={line} className="flex items-center gap-2.5 text-sm text-ink-700">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-50 text-success-600">
              <CheckIcon className="size-3.5" />
            </span>
            {line}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'success';
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={
          accent === 'success' ? 'font-semibold text-success-600' : 'font-medium text-navy-900'
        }
      >
        {value}
      </dd>
    </div>
  );
}
