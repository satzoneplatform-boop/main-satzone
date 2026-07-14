import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  FlagIcon,
  LightbulbIcon,
  PathIcon,
  StarIcon,
} from '@/components/icons';
import { LanguageDropdown } from '@/components/layout/LanguageDropdown';
import { CountUp } from '@/components/motion/CountUp';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { staggerContainer, transitions } from '@/components/motion/variants';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

const STUDENT_RESULTS = [
  {
    id: 1,
    photo:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2.6&w=640&h=640&q=80',
    before: 1260,
    after: 1480,
    gain: 220,
    weeks: 8,
    destination: 'New York University',
  },
  {
    id: 2,
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2.4&w=640&h=640&q=80',
    before: 1180,
    after: 1450,
    gain: 270,
    weeks: 10,
    destination: 'University of Toronto',
  },
  {
    id: 3,
    photo:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=facearea&facepad=2.4&w=640&h=640&q=80',
    before: 1320,
    after: 1520,
    gain: 200,
    weeks: 7,
    destination: 'Bocconi University',
  },
] as const;

/**
 * Public marketing landing page shown at `/`.
 *
 * Rebuilt for the SATZONE brand: deep-navy hero with the shield/acorn brand
 * pattern, an animated SAT score dashboard, count-up proof metrics, and a
 * Learn → Practice → Prepare → Achieve journey. Authed users redirect to
 * the dashboard.
 */
export function LandingPage() {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicTopBar />
      <main className="flex-1">
        <HeroSection />
        <MetricsBand />
        <FeaturesSection />
        <JourneySection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FinalCtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Scroll-aware header                                                        */
/* -------------------------------------------------------------------------- */

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function PublicTopBar() {
  const t = useT();
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-colors duration-300',
        scrolled
          ? 'border-b border-ink-100 bg-white/85 backdrop-blur'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" aria-label={t('landing.nav.homeAria')} className="shrink-0">
          <Logo withWordmark size={30} variant={scrolled ? 'color' : 'white'} />
        </Link>

        <nav
          className={cn(
            'ml-8 hidden items-center gap-7 text-sm font-medium lg:flex',
            scrolled ? 'text-ink-600' : 'text-white/80',
          )}
        >
          <a href="#features" className="transition-colors hover:opacity-100 hover:text-current">
            {t('landing.nav.features')}
          </a>
          <a href="#journey" className="transition-colors hover:text-current">
            {t('landing.nav.howItWorks')}
          </a>
          <a href="#testimonials" className="transition-colors hover:text-current">
            {t('landing.nav.testimonials')}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageDropdown />
          <Link to="/sign-in" className="hidden sm:block">
            <Button
              size="sm"
              variant="ghost"
              className={scrolled ? undefined : 'text-white hover:bg-white/10'}
            >
              {t('landing.nav.signIn')}
            </Button>
          </Link>
          <Link to="/sign-up">
            <Button size="sm">{t('landing.nav.signUp')}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function HeroSection() {
  const t = useT();
  const reduce = useReducedMotion();

  return (
    <section className="relative -mt-16 overflow-hidden bg-navy-900 pt-16 text-white">
      {/* Brand pattern + glow backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-brand-pattern opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full brand-glow blur-2xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white/[0.03]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <motion.div
          variants={staggerContainer(0.1, 0.05)}
          initial="hidden"
          animate="visible"
        >
          <HeroItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-300 backdrop-blur">
              <StarIcon className="size-3.5" />
              {t('landing.hero.tag')}
            </span>
          </HeroItem>

          <HeroItem>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {t('landing.hero.titleLine1')}
              <br />
              <span className="bg-gradient-to-r from-brand-300 via-accent-400 to-brand-400 bg-clip-text text-transparent">
                {t('landing.hero.titleLine2')}
              </span>
            </h1>
          </HeroItem>

          <HeroItem>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t('landing.hero.subtitle')}
            </p>
          </HeroItem>

          <HeroItem>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/sign-up">
                <Button size="lg" rightIcon={<ArrowRightIcon />}>
                  {t('landing.hero.ctaPrimary')}
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border border-white/25 text-white hover:bg-white/10"
                >
                  {t('landing.hero.ctaSecondary')}
                </Button>
              </a>
            </div>
          </HeroItem>

          <HeroItem>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
              {[
                t('landing.hero.bullet1'),
                t('landing.hero.bullet2'),
                t('landing.hero.bullet3'),
              ].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-success-500/20 text-success-500">
                    <CheckIcon className="size-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </HeroItem>
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...transitions.base, delay: 0.25 }}
        >
          <HeroScoreCard />
        </motion.div>
      </div>
    </section>
  );
}

function HeroItem({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: transitions.base },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Floating SAT score dashboard — the premium hero visual. */
function HeroScoreCard() {
  const t = useT();
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              {t('landing.hero.scoreLabel')}
            </p>
            <p className="mt-1 text-sm text-white/70">{t('landing.hero.scoreCaption')}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success-500/15 px-2.5 py-1 text-xs font-semibold text-success-500">
            <ArrowRightIcon className="size-3 -rotate-45" />
            {t('landing.hero.scoreDelta')}
          </span>
        </div>

        {/* Ring + trend */}
        <div className="mt-6 flex items-center gap-6">
          <ScoreRing
            value={1500}
            max={1600}
            size={132}
            label="/ 1600"
            valueClassName="text-white"
            ringClassName="text-accent-500"
            trackClassName="text-white/10"
          />
          <div className="min-w-0 flex-1">
            <TrendSparkline />
            <p className="mt-3 text-xs text-white/50">{t('landing.hero.trendCaption')}</p>
          </div>
        </div>

        {/* Subject bars */}
        <div className="mt-6 space-y-4">
          <SubjectBar label={t('landing.hero.subjectMath')} value={780} max={800} />
          <SubjectBar label={t('landing.hero.subjectRW')} value={720} max={800} />
        </div>
      </div>

      {/* Floating streak chip */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.6, ...transitions.base }}
        className="absolute -bottom-5 -left-2 flex items-center gap-2.5 rounded-2xl border border-ink-100 bg-white p-3 pr-4 shadow-[var(--shadow-dropdown)] sm:-left-5"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <FlagIcon className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-navy-900">
            <CountUp to={42} /> {t('landing.hero.streakDays')}
          </p>
          <p className="text-xs text-ink-500">{t('landing.hero.streakCaption')}</p>
        </div>
      </motion.div>
    </div>
  );
}

function SubjectBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold text-white">
          <CountUp to={value} /> <span className="text-white/40">/ {max}</span>
        </span>
      </div>
      <ProgressBar
        value={value}
        max={max}
        trackClassName="bg-white/10"
        fillClassName="bg-gradient-to-r from-brand-400 to-accent-500"
      />
    </div>
  );
}

/** Animated line that draws itself in. */
function TrendSparkline() {
  const reduce = useReducedMotion();
  const points = '0,44 22,40 44,34 66,36 88,26 110,22 132,12 154,6';
  return (
    <svg viewBox="0 0 154 52" className="h-14 w-full" fill="none" aria-hidden>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-brand-400)" />
          <stop offset="100%" stopColor="var(--color-accent-500)" />
        </linearGradient>
      </defs>
      <motion.polyline
        points={points}
        stroke="url(#spark)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.circle
        cx="154"
        cy="6"
        r="3.5"
        fill="var(--color-accent-500)"
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7 }}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Metrics band                                                               */
/* -------------------------------------------------------------------------- */

function MetricsBand() {
  const t = useT();
  const metrics = [
    { to: 25000, suffix: '+', sep: true, label: t('landing.metrics.students') },
    { to: 180, prefix: '+', label: t('landing.metrics.avgGain') },
    { to: 12000, suffix: '+', sep: true, label: t('landing.metrics.questions') },
    { to: 1570, label: t('landing.metrics.topScore') },
  ];
  return (
    <section className="border-b border-ink-100 bg-white">
      <Stagger
        className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 lg:grid-cols-4"
        stagger={0.1}
      >
        {metrics.map((m) => (
          <StaggerItem key={m.label} className="text-center sm:text-left">
            <p className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              <CountUp
                to={m.to}
                prefix={m.prefix ?? ''}
                suffix={m.suffix ?? ''}
                separator={m.sep}
              />
            </p>
            <p className="mt-1 text-sm text-ink-500">{m.label}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Features                                                                    */
/* -------------------------------------------------------------------------- */

function FeaturesSection() {
  const t = useT();
  const features = [
    { icon: <PathIcon className="size-6" />, key: 'f1' },
    { icon: <FlagIcon className="size-6" />, key: 'f2' },
    { icon: <StarIcon className="size-6" />, key: 'f3' },
    { icon: <LightbulbIcon className="size-6" />, key: 'f4' },
  ] as const;

  return (
    <section id="features" className="bg-ink-50/60 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            {t('landing.nav.features')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-base text-ink-500">{t('landing.features.subtitle')}</p>
        </Reveal>

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
          {features.map((f) => (
            <StaggerItem key={f.key}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="group h-full rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  {f.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy-900">
                  {t(`landing.features.${f.key}.title` as never)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {t(`landing.features.${f.key}.body` as never)}
                </p>
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Journey — Learn → Practice → Prepare → Achieve                             */
/* -------------------------------------------------------------------------- */

function JourneySection() {
  const t = useT();
  const stages = [
    { key: 'j1', icon: <BookIcon className="size-6" />, stage: 'acorn' as const },
    { key: 'j2', icon: <LightbulbIcon className="size-6" />, stage: 'sprout' as const },
    { key: 'j3', icon: <FlagIcon className="size-6" />, stage: 'sapling' as const },
    { key: 'j4', icon: <StarIcon className="size-6" />, stage: 'tree' as const },
  ] as const;

  return (
    <section id="journey" className="relative overflow-hidden bg-navy-900 py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-brand-pattern opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">
            {t('landing.nav.howItWorks')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.journey.title')}
          </h2>
          <p className="mt-4 text-base text-white/60">{t('landing.journey.subtitle')}</p>
        </Reveal>

        {/* Growth motif */}
        <GrowthStages />

        <Stagger className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
          {stages.map((s, i) => (
            <StaggerItem key={s.key}>
              <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                <span className="text-xs font-bold text-white/30">
                  0{i + 1}
                </span>
                <div className="mt-2 grid size-12 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                  {s.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {t(`landing.journey.${s.key}.title` as never)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {t(`landing.journey.${s.key}.body` as never)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/** Acorn → sprout → sapling → tree, revealing in sequence with a connector. */
function GrowthStages() {
  const reduce = useReducedMotion();
  const stages: Array<'acorn' | 'sprout' | 'sapling' | 'tree'> = [
    'acorn',
    'sprout',
    'sapling',
    'tree',
  ];
  return (
    <div className="relative mx-auto mt-14 mb-2 flex max-w-3xl items-end justify-between">
      {/* connector line */}
      <div className="absolute inset-x-8 bottom-6 -z-0 h-px bg-gradient-to-r from-brand-500/0 via-brand-400/40 to-brand-500/0" />
      {stages.map((stage, i) => (
        <motion.div
          key={stage}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 12 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.15 * i, type: 'spring', stiffness: 220, damping: 20 }}
          className="relative z-10 grid size-14 place-items-center rounded-full border border-white/10 bg-navy-800 text-accent-400"
        >
          <GrowthGlyph stage={stage} />
        </motion.div>
      ))}
    </div>
  );
}

function GrowthGlyph({ stage }: { stage: 'acorn' | 'sprout' | 'sapling' | 'tree' }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (stage) {
    case 'acorn':
      return (
        <svg {...common}>
          <path d="M7 9c0-1.2 2.2-2 5-2s5 .8 5 2c0 .7-.5 1-1.2 1H8.2C7.5 10 7 9.7 7 9Z" />
          <path d="M8.5 10.5c.3 3 1.7 5.6 3.5 6.8 1.8-1.2 3.2-3.8 3.5-6.8" />
          <path d="M12 7V5" />
        </svg>
      );
    case 'sprout':
      return (
        <svg {...common}>
          <path d="M12 20v-7" />
          <path d="M12 13c-.4-2.6-2.3-4-4.5-4 0 2.6 1.8 4 4.5 4Z" />
          <path d="M12 12c.4-2.6 2.3-4 4.5-4 0 2.6-1.8 4-4.5 4Z" />
        </svg>
      );
    case 'sapling':
      return (
        <svg {...common}>
          <path d="M12 20v-9" />
          <path d="M12 14c-1.6-.6-2.6-2-2.8-3.8C11 10.4 12 11.8 12 14Z" />
          <path d="M12 12c1.6-.6 2.6-2 2.8-3.8C13 8.4 12 9.8 12 12Z" />
          <circle cx="12" cy="6.5" r="2.5" />
        </svg>
      );
    case 'tree':
      return (
        <svg {...common}>
          <path d="M12 21v-5" />
          <path d="M12 16a6 6 0 1 0-4.2-1.7" />
          <path d="M12 16a6 6 0 0 0 4.2-1.7" />
          <circle cx="12" cy="9" r="5" />
        </svg>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* How it works (3 steps)                                                     */
/* -------------------------------------------------------------------------- */

function HowItWorksSection() {
  const t = useT();
  const steps = [1, 2, 3] as const;
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            {t('landing.steps.title')}
          </h2>
          <p className="mt-4 text-base text-ink-500">{t('landing.steps.subtitle')}</p>
        </Reveal>
        <Stagger as="ol" className="mt-14 grid gap-6 md:grid-cols-3" stagger={0.1}>
          {steps.map((n) => (
            <StaggerItem as="li" key={n}>
              <div className="relative h-full rounded-2xl border border-ink-200 bg-white p-7 shadow-[var(--shadow-card)]">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-base font-bold text-white shadow-[0_6px_16px_-4px_rgb(37_99_235/0.5)]">
                  {n}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-navy-900">
                  {t(`landing.steps.s${n}.title` as never)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {t(`landing.steps.s${n}.body` as never)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Testimonials                                                                */
/* -------------------------------------------------------------------------- */

function TestimonialsSection() {
  const t = useT();
  return (
    <section id="testimonials" className="bg-ink-50/60 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            {t('landing.testimonials.title')}
          </h2>
          <p className="mt-4 text-base text-ink-500">{t('landing.testimonials.subtitle')}</p>
        </Reveal>
        <Stagger className="mt-14 grid gap-5 md:grid-cols-3" stagger={0.1}>
          {STUDENT_RESULTS.map((result) => (
            <StaggerItem key={result.id}>
              <figure className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-50">
                  <img
                    src={result.photo}
                    alt={t(`landing.testimonials.q${result.id}.photoAlt` as never)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 shadow-[var(--shadow-dropdown)] backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase text-ink-500">
                      {t('landing.testimonials.score')}
                    </p>
                    <p className="text-xl font-bold text-navy-900">
                      {result.after}
                      <span className="ml-1 text-xs font-semibold text-success-600">
                        +{result.gain}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <ResultStat label={t('landing.testimonials.before')} value={result.before} />
                    <ResultStat label={t('landing.testimonials.after')} value={result.after} />
                    <ResultStat
                      label={t('landing.testimonials.time')}
                      value={`${result.weeks} ${t('landing.testimonials.weeks')}`}
                    />
                  </div>
                  <blockquote className="mt-5 text-sm leading-relaxed text-ink-700">
                    “{t(`landing.testimonials.q${result.id}.body` as never)}”
                  </blockquote>
                  <figcaption className="mt-auto pt-6">
                    <p className="text-sm font-semibold text-navy-900">
                      {t(`landing.testimonials.q${result.id}.author` as never)}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {t(`landing.testimonials.q${result.id}.role` as never)}
                    </p>
                    <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-xs font-medium text-ink-600">
                      {t('landing.testimonials.destination')}: {result.destination}
                    </p>
                  </figcaption>
                </div>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function ResultStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-ink-50 px-2 py-3">
      <p className="text-[11px] font-semibold uppercase text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-navy-900">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Final CTA                                                                   */
/* -------------------------------------------------------------------------- */

function FinalCtaSection() {
  const t = useT();
  return (
    <section className="px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-navy-900 px-6 py-16 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-brand-pattern opacity-60" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full brand-glow blur-2xl" />
          <div className="relative">
            <Logo size={52} variant="white" className="mx-auto" />
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
              {t('landing.cta.subtitle')}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to="/sign-up">
                <Button size="lg" rightIcon={<ArrowRightIcon />}>
                  {t('landing.cta.button')}
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border border-white/25 text-white hover:bg-white/10"
                >
                  {t('landing.nav.signIn')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */

function PublicFooter() {
  const t = useT();
  return (
    <footer className="border-t border-ink-100 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row">
        <div className="max-w-xs">
          <Logo withWordmark size={28} />
          <p className="mt-4 text-sm text-ink-500">{t('landing.footer.tagline')}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-500">
          <a href="#features" className="hover:text-navy-900">
            {t('landing.nav.features')}
          </a>
          <a href="#journey" className="hover:text-navy-900">
            {t('landing.nav.howItWorks')}
          </a>
          <a href="#testimonials" className="hover:text-navy-900">
            {t('landing.nav.testimonials')}
          </a>
          <Link to="/contacts" className="hover:text-navy-900">
            {t('landing.footer.contacts')}
          </Link>
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-ink-100 px-4 pt-6 text-sm text-ink-400 sm:px-6">
        {t('landing.footer.copyright')}
      </div>
    </footer>
  );
}
