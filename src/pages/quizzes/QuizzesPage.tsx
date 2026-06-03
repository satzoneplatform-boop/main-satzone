import { Link } from 'react-router-dom';
import { ArrowRightIcon, FlagIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';

/**
 * Quiz-games landing — for now hardcoded to the "SAT Zone" course since
 * that's the only one shipping with quiz sets. When other courses get
 * quiz sets, swap this to fetch the list from the backend (a new
 * `/courses?has_quiz_sets=true` query would be ideal).
 */
const COURSES = [
  {
    slug: 'sat-zone',
    title: 'SAT Zone',
    subtitle: 'SAT Math vocabulary — 12 topics, 400+ word pairs',
    accent: 'from-brand-500 via-brand-600 to-brand-700',
  },
];

export function QuizzesPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {t('quizzes.title')}
        </h1>
        <p className="max-w-2xl text-sm text-ink-500">
          {t('quizzes.subtitle')}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {COURSES.map((c) => (
          <Link
            key={c.slug}
            to={`/quizzes/${c.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
          >
            <div
              className={`relative h-32 bg-gradient-to-br ${c.accent}`}
            >
              <FlagIcon className="absolute right-4 top-4 size-10 text-white/60" />
            </div>
            <div className="flex flex-1 flex-col gap-1 p-5">
              <h2 className="text-lg font-semibold text-ink-900">{c.title}</h2>
              <p className="text-sm text-ink-500">{c.subtitle}</p>
              <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-medium text-brand-600 transition-transform group-hover:translate-x-0.5">
                {t('quizzes.open')} <ArrowRightIcon />
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
