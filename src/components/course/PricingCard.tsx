import { Button } from '@/components/ui/Button';
import { CheckIcon } from '@/components/icons';
import { CoursePreviewPlayer } from './CoursePreviewPlayer';
import type { CourseDetail } from '@/types/api';
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
  const priceLabel = course.is_free
    ? t('course.pricing.free')
    : `${course.currency} ${(course.price_cents / 100).toFixed(2)}`;

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

  // Preview-media preference: HLS video first, then thumbnail, then emoji.
  const hasPreview =
    course.has_preview_video && Boolean(course.preview_playback_url);

  return (
    <aside className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
      <div className="aspect-[16/9] overflow-hidden bg-ink-100">
        {hasPreview ? (
          <CoursePreviewPlayer
            src={course.preview_playback_url!}
            poster={course.thumbnail_url}
            title={course.title}
          />
        ) : course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">📘</div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-2xl font-semibold text-ink-900">{priceLabel}</p>
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
