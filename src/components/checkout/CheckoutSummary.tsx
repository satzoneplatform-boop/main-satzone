import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import type { CourseDetail } from '@/types/api';

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
  ctaLabel = 'Start free trial',
}: CheckoutSummaryProps) {
  const monthly = formatPrice(course.price_cents, course.currency, course.is_free);
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-base font-semibold text-ink-900">Summary</h2>

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
          <Row label="Subcription type" value="Monthly" />
          <Row
            label="Monthly subcription"
            value={course.is_free ? 'Free' : `${monthly} (After trial)`}
          />
          <Row label="Total trial" value="7-Days Free trial" />
        </ul>

        <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
          <span className="text-sm font-medium text-ink-900">Todays total</span>
          <span className="text-lg font-semibold text-brand-600">$0.00</span>
        </div>

        <Button fullWidth size="lg" className="mt-4" loading={loading} onClick={onSubmit}>
          {ctaLabel}
        </Button>
      </section>

      <section className="flex gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-sm shadow-[var(--shadow-card)]">
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500">
          ⓘ
        </span>
        <div>
          <p className="font-semibold text-ink-900">About the payment</p>
          <p className="mt-1 text-xs text-ink-500">
            Your subscription starts today with a 7-day free trial. If you choose to cancel during
            the trial, you can do so from My Account before the trial ends and you won’t be charged.
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
