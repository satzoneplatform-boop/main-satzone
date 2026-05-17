import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import type { CourseDetail } from '@/types/api';
import { useT } from '@/i18n/I18nProvider';

interface CheckoutSummaryProps {
  course: CourseDetail;
  onSubmit: () => void;
  loading?: boolean;
  ctaLabel?: string;
}

export function CheckoutSummary({
  course,
  onSubmit,
  loading,
  ctaLabel,
}: CheckoutSummaryProps) {
  const t = useT();
  const monthly = formatPrice(course.price_cents, course.currency, course.is_free);
  const resolvedCta = ctaLabel ?? t('checkout.summary.startTrial');
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-base font-semibold text-ink-900">{t('checkout.summary.title')}</h2>

        <div className="mt-4 flex gap-3">
          <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            {course.instructor && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
                <Avatar
                  src={course.instructor.avatar_url}
                  name={course.instructor.full_name}
                  size={14}
                />
                {course.instructor.full_name}
              </span>
            )}
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink-900">
              {course.title}
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2.5 border-t border-ink-100 pt-4 text-sm">
          <Row label={t('checkout.summary.subscriptionType')} value={t('checkout.summary.monthly')} />
          <Row
            label={t('checkout.summary.monthlySubscription')}
            value={course.is_free
              ? t('course.pricing.free')
              : t('checkout.summary.afterTrial', { price: monthly })}
          />
          <Row label={t('checkout.summary.totalTrial')} value={t('checkout.summary.trialDays')} />
        </ul>

        <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
          <span className="text-sm font-medium text-ink-900">{t('checkout.summary.todaysTotal')}</span>
          <span className="text-lg font-semibold text-brand-600">$0.00</span>
        </div>

        <Button fullWidth size="lg" className="mt-4" loading={loading} onClick={onSubmit}>
          {resolvedCta}
        </Button>
      </section>

      <section className="flex gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-sm shadow-[var(--shadow-card)]">
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500">
          ⓘ
        </span>
        <div>
          <p className="font-semibold text-ink-900">{t('checkout.summary.aboutPayment')}</p>
          <p className="mt-1 text-xs text-ink-500">
            {t('checkout.summary.aboutPaymentBody')}
          </p>
        </div>
      </section>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3 text-ink-700">
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-medium text-ink-900">{value}</span>
    </li>
  );
}
