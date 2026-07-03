import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { SearchIcon } from '@/components/icons';
import { useCourseSearch } from '@/features/explore/hooks';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

type Scope = 'class' | 'specialization' | 'pre_certificate' | 'web_course';

export function ExploreSearchHero() {
  const t = useT();
  const [scope, setScope] = useState<Scope>('class');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const scopeTabs: TabItem<Scope>[] = [
    { value: 'class', label: t('explore.scope.class') },
    { value: 'specialization', label: t('explore.scope.specialization') },
    { value: 'pre_certificate', label: t('explore.scope.preCertificate') },
    { value: 'web_course', label: t('explore.scope.webCourse') },
  ];

  const suggestions = useCourseSearch(
    { search: query, size: 6 },
    query.trim().length > 1,
  );

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/explore/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-navy-900 px-6 py-16 text-center text-white">
      <div className="pointer-events-none absolute inset-0 bg-brand-pattern opacity-60" />
      <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full brand-glow blur-2xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />

      <h1 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
        {t('explore.hero.title')}
      </h1>
      <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/60 sm:text-base">
        {t('explore.hero.subtitle')}
      </p>

      <div ref={ref} className="relative mx-auto mt-8 w-full max-w-2xl">
        <form onSubmit={onSubmit}>
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border bg-white px-3 shadow-xl transition-colors',
              open ? 'border-brand-500 ring-2 ring-brand-400/40' : 'border-transparent',
            )}
          >
            <SearchIcon className="text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={t('explore.hero.placeholder')}
              className="h-12 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
            <button
              type="submit"
              className="my-1.5 hidden h-9 shrink-0 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:inline-flex"
            >
              {t('explore.hero.cta')}
            </button>
          </div>
        </form>

        {open && query.trim().length > 1 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-ink-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex">
              <Tabs items={scopeTabs} value={scope} onChange={(v) => setScope(v as Scope)} />
            </div>

            <ul className="max-h-72 overflow-auto">
              {suggestions.isLoading && (
                <li className="px-3 py-2 text-sm text-ink-500">{t('explore.searching')}</li>
              )}
              {suggestions.data?.items.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-500">{t('explore.noMatches')}</li>
              )}
              {suggestions.data?.items.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/courses/${c.slug}`);
                      setOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-800 transition-colors duration-150 hover:bg-ink-50"
                  >
                    <span className="size-2 shrink-0 rounded-full bg-brand-500" />
                    <span className="min-w-0 truncate">{c.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
