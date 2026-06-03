import { Link, Navigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  FlagIcon,
  LightbulbIcon,
  StarIcon,
} from '@/components/icons';
import { LanguageDropdown } from '@/components/layout/LanguageDropdown';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';

/**
 * Public marketing landing page shown at `/`.
 *
 * Authed users are auto-redirected to `/dashboard` — the AuthProvider
 * persists the refresh token in localStorage and re-hydrates the session
 * on page load, so a returning visitor never sees the marketing page.
 */
export function LandingPage() {
  const t = useT();
  const { user, status } = useAuth();

  // Don't render anything until we know if the user is authed —
  // otherwise we'd flash the landing page for a returning visitor.
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
      <PublicTopBar isAuthed={false} />

      <main className="flex-1">
        <HeroSection isAuthed={false} />
        <FeaturesSection t={t} />
        <HowItWorksSection t={t} />
        <TestimonialsSection t={t} />
        <FinalCtaSection isAuthed={false} t={t} />
      </main>

      <PublicFooter t={t} />
    </div>
  );
}

function PublicTopBar({ isAuthed }: { isAuthed: boolean }) {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="SATZone home" className="shrink-0">
          <Logo withWordmark size={26} />
        </Link>

        <nav className="ml-8 hidden items-center gap-6 text-sm text-ink-600 lg:flex">
          <a href="#features" className="hover:text-ink-900">
            {t('landing.nav.features')}
          </a>
          <a href="#how" className="hover:text-ink-900">
            {t('landing.nav.howItWorks')}
          </a>
          <a href="#testimonials" className="hover:text-ink-900">
            {t('landing.nav.testimonials')}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageDropdown />
          {isAuthed ? (
            <Link to="/dashboard">
              <Button size="sm">{t('landing.nav.goDashboard')}</Button>
            </Link>
          ) : (
            <>
              <Link to="/sign-in" className="hidden sm:block">
                <Button size="sm" variant="ghost">
                  {t('landing.nav.signIn')}
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm">{t('landing.nav.signUp')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection({ isAuthed }: { isAuthed: boolean }) {
  const t = useT();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-teal-25">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-28">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <StarIcon className="size-3" />
            {t('landing.hero.tag')}
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
            {t('landing.hero.title')}
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink-500 sm:text-lg">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isAuthed ? (
              <Link to="/dashboard">
                <Button size="lg" rightIcon={<ArrowRightIcon />}>
                  {t('landing.nav.goDashboard')}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-up">
                  <Button size="lg" rightIcon={<ArrowRightIcon />}>
                    {t('landing.hero.ctaPrimary')}
                  </Button>
                </Link>
                <Link to="/sign-in">
                  <Button size="lg" variant="outline">
                    {t('landing.hero.ctaSecondary')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
            {[
              t('landing.hero.bullet1'),
              t('landing.hero.bullet2'),
              t('landing.hero.bullet3'),
            ].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-success-50 text-success-600">
                  <CheckIcon className="size-3.5" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/** Decorative hero artwork — pure SVG / divs so we don't ship an extra image. */
function HeroVisual() {
  return (
    <div className="relative hidden aspect-[5/4] w-full lg:block">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl" />
      <div className="absolute -left-6 top-12 w-64 rotate-[-4deg] rounded-2xl border border-ink-100 bg-white p-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-500">
          <span className="grid size-6 place-items-center rounded-md bg-brand-50 text-brand-600">
            <BookIcon className="size-4" />
          </span>
          Module 3: Algebra
        </div>
        <div className="mt-3 h-2 rounded-full bg-ink-100">
          <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
        </div>
        <p className="mt-3 text-xs text-ink-500">75% complete · 18/24 lessons</p>
      </div>
      <div className="absolute bottom-10 right-4 w-60 rotate-[5deg] rounded-2xl border border-ink-100 bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink-900">Module quiz</span>
          <span className="rounded-md bg-success-50 px-2 py-0.5 font-semibold text-success-600">
            Passed
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-ink-900">92</span>
          <span className="text-xs text-ink-500">/ 100</span>
        </div>
        <p className="mt-2 text-xs text-ink-500">Great job — try the next module.</p>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-white/15 backdrop-blur">
          <FlagIcon className="size-10 text-white" />
        </div>
        <p className="mt-4 text-sm font-semibold tracking-wider">SAT · IELTS · MORE</p>
      </div>
    </div>
  );
}

function FeaturesSection({ t }: { t: (k: never) => string } | { t: ReturnType<typeof useT> }) {
  // The `t` typing dodge keeps this section small — TS infers the right
  // signature from the parent's `useT()`.
  const tt = (k: string) => (t as ReturnType<typeof useT>)(k as never);
  const features = [
    {
      icon: <BookIcon />,
      title: tt('landing.features.f1.title'),
      body: tt('landing.features.f1.body'),
    },
    {
      icon: <FlagIcon />,
      title: tt('landing.features.f2.title'),
      body: tt('landing.features.f2.body'),
    },
    {
      icon: <LightbulbIcon />,
      title: tt('landing.features.f3.title'),
      body: tt('landing.features.f3.body'),
    },
    {
      icon: <StarIcon />,
      title: tt('landing.features.f4.title'),
      body: tt('landing.features.f4.body'),
    },
  ];

  return (
    <section id="features" className="border-y border-ink-100 bg-ink-50/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">
            {tt('landing.features.title')}
          </h2>
          <p className="mt-3 text-base text-ink-500">{tt('landing.features.subtitle')}</p>
        </header>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-500">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection({ t }: { t: ReturnType<typeof useT> }) {
  const steps = [1, 2, 3] as const;
  return (
    <section id="how" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">
            {t('landing.steps.title')}
          </h2>
          <p className="mt-3 text-base text-ink-500">{t('landing.steps.subtitle')}</p>
        </header>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((n) => (
            <li
              key={n}
              className="relative rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {n}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-900">
                {t(`landing.steps.s${n}.title` as never)}
              </h3>
              <p className="mt-2 text-sm text-ink-500">
                {t(`landing.steps.s${n}.body` as never)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TestimonialsSection({ t }: { t: ReturnType<typeof useT> }) {
  const quotes = [1, 2, 3] as const;
  return (
    <section id="testimonials" className="border-y border-ink-100 bg-ink-50/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">
            {t('landing.testimonials.title')}
          </h2>
          <p className="mt-3 text-base text-ink-500">
            {t('landing.testimonials.subtitle')}
          </p>
        </header>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {quotes.map((n) => (
            <figure
              key={n}
              className="flex h-full flex-col justify-between rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <blockquote className="text-sm text-ink-700">
                “{t(`landing.testimonials.q${n}.body` as never)}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {t(`landing.testimonials.q${n}.initials` as never)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {t(`landing.testimonials.q${n}.author` as never)}
                  </p>
                  <p className="text-xs text-ink-500">
                    {t(`landing.testimonials.q${n}.role` as never)}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection({
  isAuthed,
  t,
}: {
  isAuthed: boolean;
  t: ReturnType<typeof useT>;
}) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 p-8 text-center text-white sm:p-12">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t('landing.cta.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/80">
            {t('landing.cta.subtitle')}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {isAuthed ? (
              <Link to="/dashboard">
                <Button size="lg" rightIcon={<ArrowRightIcon />}>
                  {t('landing.nav.goDashboard')}
                </Button>
              </Link>
            ) : (
              <Link to="/sign-up">
                <Button size="lg" rightIcon={<ArrowRightIcon />}>
                  {t('landing.cta.button')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicFooter({ t }: { t: ReturnType<typeof useT> }) {
  return (
    <footer className="border-t border-ink-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 text-sm text-ink-500 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <Logo withWordmark size={22} />
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link to="/contacts" className="hover:text-ink-900">
            {t('landing.footer.contacts')}
          </Link>
          <a href="#features" className="hover:text-ink-900">
            {t('landing.nav.features')}
          </a>
          <a href="#how" className="hover:text-ink-900">
            {t('landing.nav.howItWorks')}
          </a>
        </nav>
        <p>{t('landing.footer.copyright')}</p>
      </div>
    </footer>
  );
}
