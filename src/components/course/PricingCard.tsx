import { Button } from '@/components/ui/Button';
import { CheckIcon } from '@/components/icons';
import { CoursePreviewPlayer } from './CoursePreviewPlayer';
import { CourseThumbnail } from './CourseThumbnail';
import type { CourseDetail } from '@/types/api';
import { formatPrice } from '@/lib/format';
import { useT } from '@/i18n/I18nProvider';

interface PricingCardProps {
  course: CourseDetail;
  onStart: () => void;
  loading?: boolean;
  /** True when the current user already has an active enrollment for this course. */
  isEnrolled?: boolean;
  /** Override the CTA label (e.g. while a parent is in a custom flow). */
  ctaLabel?: string;
}

export function PricingCard({
  course,
  onStart,
  loading,
  isEnrolled,
  ctaLabel,
}: PricingCardProps) {
  const t = useT();
  // Server-provided prices only: the course's own discounted price, if any.
  const hasDiscount =
    course.discount_price_cents != null &&
    course.discount_price_cents < course.price_cents &&
    !course.is_free;
  const priceLabel = course.is_free
    ? t('course.pricing.free')
    : formatPrice(
        hasDiscount ? course.discount_price_cents! : course.price_cents,
        course.currency,
        false,
      );

  // CTA copy:
  //  - already enrolled            → "Continue learning"
  //  - free course, not enrolled   → "Enroll for free"
  //  - paid course, not enrolled   → "Enroll now"
  const resolvedCta =
    ctaLabel ??
    (isEnrolled
      ? t('course.pricing.continueLearning')
      : course.is_free
        ? t('course.pricing.enrollFree')
        : t('course.pricing.enrollNow'));

  // Preview-media preference: direct MP4 preview when one is available
  // (signed URL is minted on click), else thumbnail image, else emoji.
  const hasPreview = course.has_preview_video;

  return (
    <aside className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
      <div className="aspect-[16/9] overflow-hidden bg-ink-100">
        {hasPreview ? (
          <CoursePreviewPlayer
            slug={course.slug}
            poster={course.thumbnail_url}
            title={course.title}
          />
        ) : (
          <CourseThumbnail url={course.thumbnail_url} title={course.title} markSize={48} />
        )}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink-900">{priceLabel}</span>
            {hasDiscount && (
              <span
                className="text-sm text-ink-400 line-through"
                aria-label={t('course.pricing.originalPrice', {
                  price: formatPrice(course.price_cents, course.currency, false),
                })}
              >
                {formatPrice(course.price_cents, course.currency, false)}
              </span>
            )}
          </p>
          <p className="text-xs text-ink-500">
            {isEnrolled
              ? t('course.pricing.enrolledHint')
              : course.is_free
                ? t('course.pricing.freeHint')
                : t('course.pricing.paidHint')}
          </p>
        </div>

        <ul className="space-y-2 text-sm text-ink-700">
          <Perk>{t('course.pricing.perk.fullAccess')}</Perk>
          <Perk>{t('course.pricing.perk.projects')}</Perk>
          <Perk>{t('course.pricing.perk.certificate')}</Perk>
          <Perk>{t('course.pricing.perk.lifetime')}</Perk>
        </ul>

        <Button fullWidth size="lg" onClick={onStart} loading={loading}>
          {resolvedCta}
        </Button>
      </div>
    </aside>
  );
}

function Perk({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-success-50 text-success-600">
        <CheckIcon className="size-3" />
      </span>
      <span>{children}</span>
    </li>
  );
}
