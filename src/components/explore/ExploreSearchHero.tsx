import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { SearchIcon } from '@/components/icons';
import { useCourseSearch } from '@/features/explore/hooks';
import { cn } from '@/lib/cn';

const SCOPE_TABS = [
  { value: 'class', label: 'Class' },
  { value: 'specialization', label: 'Specialization' },
  { value: 'pre_certificate', label: 'Pre Certificate' },
  { value: 'web_course', label: 'Web Course' },
] as const satisfies readonly TabItem<string>[];

type Scope = (typeof SCOPE_TABS)[number]['value'];

export function ExploreSearchHero() {
  const [scope, setScope] = useState<Scope>('class');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

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
    <section className="relative isolate overflow-hidden rounded-3xl border border-ink-200 bg-white px-6 py-14 text-center">
      <BackdropPattern />

      <h1 className="relative text-3xl font-semibold tracking-tight text-ink-900">
        Find your next skill
      </h1>
      <p className="relative mt-2 text-sm text-ink-500">
        Discover all courses we have for inspire institution and partners.
      </p>

      <div ref={ref} className="relative mx-auto mt-8 w-full max-w-2xl">
        <form onSubmit={onSubmit}>
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border bg-white px-3 shadow-[var(--shadow-card)] transition-colors',
              open ? 'border-brand-500 ring-2 ring-brand-100' : 'border-ink-200',
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
              placeholder="Search class, lesson or specialty topic"
              className="h-12 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </div>
        </form>

        {open && query.trim().length > 1 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-ink-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex">
              <Tabs items={SCOPE_TABS} value={scope} onChange={(v) => setScope(v as Scope)} />
            </div>

            <ul className="max-h-72 overflow-auto">
              {suggestions.isLoading && (
                <li className="px-3 py-2 text-sm text-ink-500">Searching…</li>
              )}
              {suggestions.data?.items.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-500">No matches.</li>
              )}
              {suggestions.data?.items.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/courses/${c.slug}`);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-800 hover:bg-ink-50"
                  >
                    <span className="size-2 rounded-full bg-teal-500" />
                    {c.title}
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

function BackdropPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.06]"
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0F172B" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="800" height="400" fill="url(#grid)" />
    </svg>
  );
}
