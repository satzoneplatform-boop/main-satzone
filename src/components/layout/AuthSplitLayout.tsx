import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { CheckIcon, StarIcon } from '@/components/icons';
import { staggerContainer, transitions } from '@/components/motion/variants';
import { useT } from '@/i18n/I18nProvider';
import { LanguageDropdown } from './LanguageDropdown';

interface AuthSplitLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Split-panel layout used by Sign Up / Sign In screens.
 *
 * Left: bespoke navy brand panel with the shield/acorn pattern, the SATZONE
 * value proposition, and a student testimonial (reuses the landing i18n keys
 * so it stays localized). Right: the form column, which fades in.
 *
 * Sized for laptops (≥1280 px). On smaller widths the brand panel collapses.
 */
export function AuthSplitLayout({ children, footer }: AuthSplitLayoutProps) {
  const t = useT();
  const reduce = useReducedMotion();

  const bullets = [
    t('landing.hero.bullet1'),
    t('landing.hero.bullet2'),
    t('landing.hero.bullet3'),
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(560px,1fr)] lg:p-6">
      <div className="hidden lg:block">
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-navy-900 p-10 text-white">
          <div className="pointer-events-none absolute inset-0 bg-brand-pattern opacity-60" />
          <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full brand-glow blur-2xl" />
          <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />

          <motion.div
            variants={staggerContainer(0.1, 0.05)}
            initial="hidden"
            animate="visible"
            className="relative flex h-full flex-col"
          >
            <PanelItem>
              <Logo withWordmark size={30} variant="white" />
            </PanelItem>

            <div className="flex flex-1 flex-col justify-center py-10">
              <PanelItem>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-300">
                  <StarIcon className="size-3.5" />
                  {t('landing.hero.tag')}
                </span>
              </PanelItem>
              <PanelItem>
                <h2 className="mt-6 max-w-md text-4xl font-bold leading-[1.1] tracking-tight">
                  {t('landing.hero.title')}
                </h2>
              </PanelItem>
              <PanelItem>
                <ul className="mt-8 space-y-3.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-white/80">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success-500/20 text-success-500">
                        <CheckIcon className="size-3.5" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </PanelItem>
            </div>

            <PanelItem>
              <figure className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <div className="flex gap-0.5 text-warn-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="size-3.5" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-white/80">
                  “{t('landing.testimonials.q1.body')}”
                </blockquote>
                <figcaption className="mt-3 flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
                    {t('landing.testimonials.q1.initials')}
                  </span>
                  <div className="text-xs">
                    <p className="font-semibold text-white">
                      {t('landing.testimonials.q1.author')}
                    </p>
                    <p className="text-white/50">{t('landing.testimonials.q1.role')}</p>
                  </div>
                </figcaption>
              </figure>
            </PanelItem>
          </motion.div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex justify-end px-4 pt-4 lg:px-8">
          <LanguageDropdown variant="light" />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 lg:px-12">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.base, delay: 0.1 }}
            className="w-full max-w-[400px]"
          >
            {children}
          </motion.div>
        </div>
        {footer && (
          <div className="mx-auto w-full max-w-[400px] px-6 pb-6 text-center text-xs leading-relaxed text-ink-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function PanelItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: transitions.base },
      }}
    >
      {children}
    </motion.div>
  );
}
