import { Logo } from '@/components/brand/Logo';
import { StarIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';
import { AnimatedBackdrop } from './AnimatedBackdrop';
import { RotatingSlogan } from './RotatingSlogan';
import { InstructorCard } from './InstructorCard';
import { TestimonialCarousel } from './TestimonialCarousel';
import { sloganKeys } from './config';

/**
 * Left brand panel for the auth split screen, over a living backdrop. The
 * instructor card is the focal point: the hero is intentionally minimal
 * (badge + headline + rotating slogan) and the instructor zone takes the
 * flexible space so the large portrait reads first. Bottom pins the compact
 * testimonial carousel. `min-h-0` + clip keep the panel from scrolling.
 */
export function MarketingPanel() {
  const t = useT();

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-3xl p-8 text-white xl:p-9"
      style={{ background: 'linear-gradient(160deg, #163B6E 0%, #1E4E8C 50%, #2A67B0 100%)' }}
    >
      <AnimatedBackdrop />

      <div className="relative z-10 flex h-full flex-col">
        {/* 1. Header */}
        <Logo withWordmark size={30} variant="white" />

        {/* 2. Hero — minimal, so it doesn't compete with the instructor */}
        <div className="mt-5 shrink-0">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-100">
            <StarIcon className="size-3.5" />
            {t('landing.hero.tag')}
          </span>

          <h2 className="mt-4 max-w-md text-3xl font-bold leading-[1.1] tracking-tight xl:text-4xl">
            {t('landing.hero.title')}
          </h2>

          <RotatingSlogan keys={sloganKeys} className="mt-3 max-w-md" />
        </div>

        {/* 3. Instructor — focal point; grows to fill and centres the card */}
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-4">
          <InstructorCard />
        </div>

        {/* 4. Testimonial carousel */}
        <TestimonialCarousel />
      </div>
    </div>
  );
}
