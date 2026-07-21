import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  LightbulbIcon,
  PathIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
} from '@/components/icons';
import { LanguageDropdown } from '@/components/layout/LanguageDropdown';
import { CountUp } from '@/components/motion/CountUp';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { staggerContainer, transitions } from '@/components/motion/variants';
import { ResultsSection } from '@/components/results/ResultsSection';
import { instructor } from '@/components/auth/marketing/config';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

/**
 * Public marketing landing page shown at `/`.
 *
 * Rebuilt for the SATZONE brand: deep-navy hero with animated gradient mesh,
 * an animated SAT score dashboard, count-up proof metrics, a Learn → Practice
 * → Prepare → Achieve journey, instructor spotlight, and live CMS-managed
 * results. Authed users redirect to the dashboard.
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
        {/* Section order keeps color bands continuous: navy hero → light
            content → one navy band (journey + instructor) → light results. */}
        <HeroSection />
        <MetricsBand />
        <BlueprintStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <JourneySection />
        <InstructorSection />
        <ResultsSection />
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
          <a href="#features" className="lp-nav-link transition-colors hover:opacity-100 hover:text-current">
            {t('landing.nav.features')}
          </a>
          <a href="#journey" className="lp-nav-link transition-colors hover:text-current">
            {t('landing.nav.howItWorks')}
          </a>
          <a href="#results" className="lp-nav-link transition-colors hover:text-current">
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
    <section className="relative -mt-16 overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 pt-16 text-white">
      {/* Animated mesh gradient + drifting orbs backdrop */}
      <div className="lp-mesh pointer-events-none absolute inset-0 opacity-90" />
      <div className="lp-orb lp-orb--a absolute -left-32 top-6 h-80 w-80 bg-brand-500/25" />
      <div className="lp-orb lp-orb--b absolute -right-24 bottom-0 h-96 w-96 bg-accent-500/20" />
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
              <span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">
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
                <Button size="lg" className="lp-cta" rightIcon={<ArrowRightIcon />}>
                  {t('landing.hero.ctaPrimary')}
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="ghost"
                  className="lp-btn-glass border border-white/25 text-white hover:bg-white/10"
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
          <Tilt>
            <HeroScoreCard />
          </Tilt>
        </motion.div>
      </div>
    </section>
  );
}

function HeroItem({ children }: { children: ReactNode }) {
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
      {/* pb-12 keeps the floating streak chip over padding, not the R&W bar. */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 pb-12 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl">
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
/* Motion helpers                                                             */
/* -------------------------------------------------------------------------- */

/** Pointer-tracking 3D tilt for focal cards. Springs back to flat on leave. */
function Tilt({ children, max = 9 }: { children: ReactNode; max?: number }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * max);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * max);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
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
    // Floating glass proof-band, pulled up over the hero's bottom edge on
    // desktop so the navy → white hand-off feels layered instead of stacked.
    <section className="relative z-10 px-4 sm:px-6">
      <Stagger
        className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 rounded-2xl border border-ink-100 bg-white/85 px-6 py-9 shadow-[0_28px_70px_-30px_rgb(13_27_61/0.45)] backdrop-blur-md lg:-mt-14 lg:grid-cols-4 lg:divide-x lg:divide-ink-100"
        stagger={0.1}
      >
        {metrics.map((m) => (
          <StaggerItem key={m.label} className="text-center lg:px-6">
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

/**
 * Slim infinite strip spelling out the anatomy of the Digital SAT — sections,
 * question counts, timing, score scale. The page trains for a very specific
 * exam; this strip says "we know it cold" with facts, not slogans. Pauses on
 * hover.
 */
function BlueprintStrip() {
  const t = useT();
  const items = [
    t('landing.blueprint.b1'),
    t('landing.blueprint.b2'),
    t('landing.blueprint.b3'),
    t('landing.blueprint.b4'),
    t('landing.blueprint.b5'),
    t('landing.blueprint.b6'),
  ];
  return (
    <div className="mt-12 overflow-hidden border-y border-ink-100 bg-white py-4">
      <div className="lp-marquee">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-10 pr-10">
            {items.map((label) => (
              <li
                key={label}
                className="flex items-center gap-3 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-ink-500"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-accent-400" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Features                                                                    */
/* -------------------------------------------------------------------------- */

function FeaturesSection() {
  const t = useT();
  const features = [
    { icon: <PathIcon className="size-6" />, key: 'f1', viz: <AdaptivePlanViz /> },
    { icon: <FlagIcon className="size-6" />, key: 'f2', viz: null },
    { icon: <TrendingUpIcon className="size-6" />, key: 'f3', viz: null },
    { icon: <UsersIcon className="size-6" />, key: 'f4', viz: <MentorNoteViz /> },
  ] as const;

  return (
    <section id="features" className="bg-gradient-to-b from-white via-ink-50 to-white py-24">
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

        {/* Bento layout: the first and last cards stretch wide on desktop. */}
        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.09}>
          {features.map((f, i) => (
            <StaggerItem key={f.key} className={cn(i === 0 || i === 3 ? 'lg:col-span-2' : '')}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="lp-card group relative h-full overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)] lg:p-7"
              >
                {/* Soft corner glow that wakes up on hover */}
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-brand-100/80 to-accent-100/40 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <div
                  className={cn(
                    f.viz &&
                      'lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center lg:gap-10',
                  )}
                >
                  <div>
                    <div className="lp-icon grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      {f.icon}
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-navy-900">
                      {t(`landing.features.${f.key}.title` as never)}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
                      {t(`landing.features.${f.key}.body` as never)}
                    </p>
                  </div>
                  {f.viz ? (
                    <div className="hidden lg:block" aria-hidden>
                      {f.viz}
                    </div>
                  ) : null}
                </div>
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/**
 * Mini product vignette for the wide "Adaptive learning" card: a today's-plan
 * panel with mastery bars, the weakest topic flagged as up next. Decorative
 * (aria-hidden by the caller) — it shows the product instead of describing it.
 */
function AdaptivePlanViz() {
  const t = useT();
  const rows = [
    { label: t('landing.features.f1.viz.r1'), pct: 42, focus: true },
    { label: t('landing.features.f1.viz.r2'), pct: 68, focus: false },
    { label: t('landing.features.f1.viz.r3'), pct: 86, focus: false },
  ];
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-600">{t('landing.features.f1.viz.title')}</p>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
          {t('landing.features.f1.viz.badge')}
        </span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span className={cn('truncate', r.focus ? 'font-semibold text-navy-900' : 'text-ink-500')}>
                {r.label}
              </span>
              {r.focus ? (
                <span className="shrink-0 rounded-full bg-accent-500/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-accent-600">
                  {t('landing.features.f1.viz.focus')}
                </span>
              ) : null}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                style={{ width: `${r.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Mini product vignette for the wide "Expert mentors" card: one line of real
 * mentor feedback from the same instructor featured further down the page.
 */
function MentorNoteViz() {
  const t = useT();
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/80 p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-accent-500 text-[11px] font-bold text-white">
          {instructor.initials}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-semibold text-navy-900">
            {t('auth.brand.instructor.name')}
          </p>
          <p className="text-[10px] text-ink-400">{t('landing.features.f4.viz.meta')}</p>
        </div>
      </div>
      <p className="mt-3 rounded-lg rounded-tl-none border border-ink-100 bg-white px-3 py-2.5 text-[11px] leading-relaxed text-ink-600">
        {t('landing.features.f4.viz.quote')}
      </p>
    </div>
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
    // Top half of the navy band — flows seamlessly into InstructorSection.
    <section id="journey" className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950 py-24 text-white">
      <div className="lp-mesh pointer-events-none absolute inset-0 opacity-70" />
      <div className="lp-orb lp-orb--a absolute -left-20 top-16 h-72 w-72 bg-brand-500/20" />
      <div className="lp-orb lp-orb--c absolute -right-16 bottom-10 h-80 w-80 bg-accent-500/15" />
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

        {/* Growth motif — the acorn grows into a tree as it scrolls into view */}
        <GrowingTree />

        <Stagger className="mt-10 grid gap-5 sm:mt-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
          {stages.map((s, i) => (
            <StaggerItem key={s.key}>
              <div className="lp-card group relative h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.07]">
                <span className="text-xs font-bold text-white/30">
                  0{i + 1}
                </span>
                <div className="lp-icon mt-2 grid size-12 place-items-center rounded-xl bg-brand-500/15 text-brand-300 group-hover:bg-brand-500/25 group-hover:text-brand-200">
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

/**
 * The brand story drawn live: a ground line sweeps left → right and the four
 * growth stages (acorn → sprout → sapling → tree) draw themselves in
 * sequence, each one taller than the last, ending with fruit popping into the
 * tree's crown. Each stage sits above its matching card in the grid below.
 * Static (fully grown) when the user prefers reduced motion.
 */
function GrowingTree() {
  const reduce = useReducedMotion();
  const viewport = { once: true, amount: 0.5 } as const;
  const ease = [0.22, 1, 0.36, 1] as const;

  /** Stroke that draws itself in. */
  const draw = (delay: number, duration = 0.7) => ({
    initial: reduce ? undefined : { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport,
    transition: { delay, duration, ease },
  });
  /** Element that springs up from its base. */
  const pop = (delay: number) => ({
    initial: reduce ? undefined : { scale: 0, opacity: 0 },
    whileInView: { scale: 1, opacity: 1 },
    viewport,
    transition: { delay, type: 'spring' as const, stiffness: 260, damping: 18 },
    style: { transformBox: 'fill-box' as const, transformOrigin: '50% 100%' },
  });

  // Stage timing: ground line first, then each plant ~0.5s after the last.
  const at = (stage: number, step = 0) => 0.4 + stage * 0.5 + step * 0.15;

  // Plants reuse the brand growth glyphs (24×24), scaled up per stage and
  // anchored to the ground line at y=132.
  const stages = [
    { x: 100, scale: 1.9, baseY: 18 },
    { x: 300, scale: 2.6, baseY: 20 },
    { x: 500, scale: 3.4, baseY: 20 },
    { x: 700, scale: 4.4, baseY: 21 },
  ].map((s) => ({ ...s, tx: s.x - 12 * s.scale, ty: 132 - s.baseY * s.scale }));

  return (
    // Full-width of the card grid so each growth stage stands above its own
    // card. Hidden on phones — at that scale the glyphs shrink to noise.
    <div className="relative mt-14 mb-2 hidden sm:block">
      <svg
        viewBox="0 0 800 150"
        className="lp-tree-glow w-full"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <defs>
          {/* userSpaceOnUse: a horizontal line has a zero-height bounding
              box, which makes objectBoundingBox gradients render nothing. */}
          <linearGradient id="growth-ground" gradientUnits="userSpaceOnUse" x1="20" y1="132" x2="780" y2="132">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0" />
            <stop offset="18%" stopColor="var(--color-brand-400)" stopOpacity="0.45" />
            <stop offset="82%" stopColor="var(--color-accent-400)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ground line */}
        <motion.path d="M20 132 H780" stroke="url(#growth-ground)" strokeWidth={2} {...draw(0, 1.3)} />

        {/* Root dots marking each stage on the ground */}
        {stages.map((s, i) => (
          <motion.circle
            key={`dot-${s.x}`}
            cx={s.x}
            cy={132}
            r={4}
            className="fill-accent-400"
            {...pop(at(i))}
          />
        ))}

        <g stroke="currentColor" strokeWidth={3} className="text-accent-400">
          {/* 01 · Acorn */}
          <g transform={`translate(${stages[0].tx} ${stages[0].ty}) scale(${stages[0].scale})`}>
            <motion.path vectorEffect="non-scaling-stroke" d="M7 9c0-1.2 2.2-2 5-2s5 .8 5 2c0 .7-.5 1-1.2 1H8.2C7.5 10 7 9.7 7 9Z" {...draw(at(0, 1))} />
            <motion.path vectorEffect="non-scaling-stroke" d="M8.5 10.5c.3 3 1.7 5.6 3.5 6.8 1.8-1.2 3.2-3.8 3.5-6.8" {...draw(at(0, 2))} />
            <motion.path vectorEffect="non-scaling-stroke" d="M12 7V5" {...draw(at(0, 3), 0.3)} />
          </g>

          {/* 02 · Sprout */}
          <g transform={`translate(${stages[1].tx} ${stages[1].ty}) scale(${stages[1].scale})`}>
            <motion.path vectorEffect="non-scaling-stroke" d="M12 20v-7" {...draw(at(1, 1), 0.5)} />
            <motion.path vectorEffect="non-scaling-stroke" d="M12 13c-.4-2.6-2.3-4-4.5-4 0 2.6 1.8 4 4.5 4Z" {...draw(at(1, 2))} />
            <motion.path vectorEffect="non-scaling-stroke" d="M12 12c.4-2.6 2.3-4 4.5-4 0 2.6-1.8 4-4.5 4Z" {...draw(at(1, 3))} />
          </g>

          {/* 03 · Sapling */}
          <g transform={`translate(${stages[2].tx} ${stages[2].ty}) scale(${stages[2].scale})`}>
            <motion.path vectorEffect="non-scaling-stroke" d="M12 20v-9" {...draw(at(2, 1), 0.5)} />
            <motion.path vectorEffect="non-scaling-stroke" d="M12 14c-1.6-.6-2.6-2-2.8-3.8C11 10.4 12 11.8 12 14Z" {...draw(at(2, 2))} />
            <motion.path vectorEffect="non-scaling-stroke" d="M12 12c1.6-.6 2.6-2 2.8-3.8C13 8.4 12 9.8 12 12Z" {...draw(at(2, 3))} />
            <motion.circle vectorEffect="non-scaling-stroke" cx="12" cy="6.5" r="2.5" {...draw(at(2, 4))} />
          </g>

          {/* 04 · Tree */}
          <g transform={`translate(${stages[3].tx} ${stages[3].ty}) scale(${stages[3].scale})`}>
            <motion.path vectorEffect="non-scaling-stroke" d="M12 21v-5" {...draw(at(3, 1), 0.5)} />
            <motion.circle vectorEffect="non-scaling-stroke" cx="12" cy="9" r="5" {...draw(at(3, 2), 0.9)} />
            <motion.path vectorEffect="non-scaling-stroke" d="M12 16a6 6 0 1 0-4.2-1.7" {...draw(at(3, 3), 0.9)} />
            <motion.path vectorEffect="non-scaling-stroke" d="M12 16a6 6 0 0 0 4.2-1.7" {...draw(at(3, 4))} />
            {/* Fruit — the payoff */}
            <motion.circle cx="10.2" cy="8" r="0.7" className="fill-accent-400" stroke="none" {...pop(at(3, 6))} />
            <motion.circle cx="13.8" cy="10.4" r="0.7" className="fill-brand-300" stroke="none" {...pop(at(3, 7))} />
            <motion.circle cx="12.4" cy="6.1" r="0.7" className="fill-accent-300" stroke="none" {...pop(at(3, 8))} />
          </g>
        </g>
      </svg>
    </div>
  );
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
        <div className="relative mt-14">
          {/* Dashed path behind the step cards, visible in the gaps */}
          <div
            className="pointer-events-none absolute left-[8%] right-[8%] top-12 hidden border-t-2 border-dashed border-brand-200/70 md:block"
            aria-hidden
          />
        <Stagger as="ol" className="relative grid gap-6 md:grid-cols-3" stagger={0.1}>
          {steps.map((n) => (
            <StaggerItem as="li" key={n}>
              <div className="lp-card group relative h-full rounded-2xl border border-ink-200 bg-white p-7 shadow-[var(--shadow-card)] hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]">
                <span className="lp-icon grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-base font-bold text-white shadow-[0_6px_16px_-4px_rgb(37_99_235/0.5)]">
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
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Meet your instructor                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Instructor spotlight — the "learn from someone who's been there" section.
 * Photo path/initials come from the shared instructor config (same source as
 * the auth marketing panel) so swapping the photo updates both places.
 */
function InstructorSection() {
  const t = useT();
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(instructor.photoUrl) && !photoFailed;

  const chips = [
    t('landing.instructor.chip1'),
    t('landing.instructor.chip2'),
    t('landing.instructor.chip3'),
  ];

  const stats = [
    { to: 2, suffix: '+', icon: <ClockIcon className="size-6" />, label: t('landing.instructor.stat.years') },
    { to: 500, suffix: '+', icon: <UsersIcon className="size-6" />, label: t('landing.instructor.stat.students') },
    { to: 44, suffix: '+', icon: <BookIcon className="size-6" />, label: t('landing.instructor.stat.mocks') },
    { to: 1480, icon: <TrendingUpIcon className="size-6" />, label: t('landing.instructor.stat.avgScore') },
  ];

  return (
    // Bottom half of the navy band — picks up where JourneySection ends.
    <section id="instructor" className="relative overflow-hidden bg-gradient-to-b from-navy-950 to-navy-900 py-24 text-white">
      <div className="lp-mesh pointer-events-none absolute inset-0 opacity-70" />
      <div className="lp-orb lp-orb--b absolute -left-16 bottom-10 h-72 w-72 bg-brand-500/20" />
      <div className="lp-orb lp-orb--a absolute -right-20 top-16 h-80 w-80 bg-accent-500/15" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          {/* Portrait with floating name card */}
          <Reveal>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative mx-auto w-full max-w-md"
            >
              {/* Offset outline for depth, echoing the brand pattern */}
              <div
                className="pointer-events-none absolute -left-4 -top-4 h-40 w-40 rounded-tl-3xl border-l-2 border-t-2 border-brand-400/40"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -inset-6 opacity-60 blur-3xl"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgb(59 130 246 / 0.4), transparent 65%)' }}
                aria-hidden
              />
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-navy-800 shadow-[0_32px_80px_-32px_rgb(37_99_235/0.6)]">
                {showPhoto ? (
                  <img
                    src={instructor.photoUrl}
                    alt={t(instructor.photoAltKey)}
                    loading="lazy"
                    onError={() => setPhotoFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-600/40 to-accent-500/25 text-7xl font-bold text-white/90"
                    role="img"
                    aria-label={t(instructor.photoAltKey)}
                  >
                    {instructor.initials}
                  </div>
                )}
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-navy-900/85 px-5 py-4 backdrop-blur sm:right-auto sm:min-w-[240px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">
                  {t('landing.instructor.badge')}
                </p>
                <p className="mt-1 text-xl font-bold leading-tight">{t('auth.brand.instructor.name')}</p>
                <p className="mt-0.5 text-sm text-white/60">{t('auth.brand.instructor.role')}</p>
              </div>
            </motion.div>
          </Reveal>

          {/* Story, specialties, stats, CTA */}
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
              {t('landing.instructor.eyebrow')}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {t('landing.instructor.title')}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t('landing.instructor.bio')}
            </p>

            <ul className="mt-8 flex flex-wrap gap-3">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/90"
                >
                  <CheckIcon className="size-4 text-accent-400" />
                  {chip}
                </li>
              ))}
            </ul>

            <hr className="my-9 border-white/10" />

            <Stagger as="ul" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4" stagger={0.08}>
              {stats.map((s) => (
                <StaggerItem as="li" key={s.label}>
                  <div className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-brand-300">
                    {s.icon}
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </p>
                  <p className="mt-1.5 text-sm text-white/60">{s.label}</p>
                </StaggerItem>
              ))}
            </Stagger>

            <div className="mt-10">
              <Link to="/sign-up">
                <Button size="lg" className="lp-cta" rightIcon={<ArrowRightIcon />}>
                  {t('landing.instructor.cta')}
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
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
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 px-6 py-16 text-center text-white sm:px-12">
          <div className="lp-mesh pointer-events-none absolute inset-0 opacity-80" />
          <div className="lp-orb lp-orb--a absolute -left-10 top-0 h-64 w-64 bg-brand-500/25" />
          <div className="lp-orb lp-orb--b absolute -right-10 bottom-0 h-72 w-72 bg-accent-500/20" />
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
                <Button size="lg" className="lp-cta" rightIcon={<ArrowRightIcon />}>
                  {t('landing.cta.button')}
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button
                  size="lg"
                  variant="ghost"
                  className="lp-btn-glass border border-white/25 text-white hover:bg-white/10"
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
          <a href="#features" className="lp-nav-link hover:text-navy-900">
            {t('landing.nav.features')}
          </a>
          <a href="#journey" className="lp-nav-link hover:text-navy-900">
            {t('landing.nav.howItWorks')}
          </a>
          <a href="#results" className="lp-nav-link hover:text-navy-900">
            {t('landing.nav.testimonials')}
          </a>
          <Link to="/contacts" className="lp-nav-link hover:text-navy-900">
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
