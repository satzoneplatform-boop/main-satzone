import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CourseGridCard } from '@/components/explore/CourseGridCard';
import { EmptyResults } from '@/components/explore/EmptyResults';
import { FilterDrawer } from '@/components/explore/FilterDrawer';
import {
  DEFAULT_FILTERS,
  toCourseFilters,
  type FilterValue,
} from '@/components/explore/filters';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { CloseIcon, FilterIcon, SearchIcon } from '@/components/icons';
import { ApiError } from '@/api/errors';
import { api } from '@/api/client';
import { useCategories, useCourseSearch } from '@/features/explore/hooks';
import { useT } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/en';
import type { CourseFilters } from '@/api/courses';
import type { CourseSummary, EnrollmentRead } from '@/types/api';

const SCOPE_VALUES = ['all', 'business', 'pre_certificate', 'faq', 'degree'] as const;
type Scope = (typeof SCOPE_VALUES)[number];

const SCOPE_LABEL_KEY: Record<Scope, TranslationKey> = {
  all: 'explore.results.tab.all',
  business: 'explore.results.tab.business',
  pre_certificate: 'explore.results.tab.preCertificate',
  faq: 'explore.results.tab.faq',
  degree: 'explore.results.tab.degree',
};

const LEVEL_CHIP_KEY: Record<string, TranslationKey> = {
  beginner: 'explore.filter.level.beginner',
  intermediate: 'explore.filter.level.intermediate',
  advanced: 'explore.filter.level.advanced',
};

const DURATION_CHIP_KEY: Record<string, TranslationKey> = {
  lt2h: 'explore.filter.duration.lt2h',
  '2_6h': 'explore.filter.duration.2to6h',
  gt6h: 'explore.filter.duration.gt6h',
};

export function SearchResultsPage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useCategories();

  const q = params.get('q') ?? '';
  const categorySlug = params.get('category');

  const [searchInput, setSearchInput] = useState(q);
  const [scope, setScope] = useState<Scope>('all');
  const [filters, setFilters] = useState<FilterValue>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Compose backend filters from URL + drawer state.
  const courseFilters = useMemo<CourseFilters>(() => {
    const f: CourseFilters = {
      search: q || undefined,
      category_slug: categorySlug || undefined,
      sort: 'popular',
      size: 20,
      ...toCourseFilters(filters),
    };
    return f;
  }, [q, categorySlug, filters]);

  const search = useCourseSearch(courseFilters);

  const enroll = useMutation<EnrollmentRead, ApiError, CourseSummary>({
    mutationFn: (course) =>
      api.post<EnrollmentRead>('/me/enrollments', { json: { course_id: course.id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });

  function onSubmitSearch(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchInput.trim()) next.set('q', searchInput.trim());
    else next.delete('q');
    setParams(next, { replace: true });
  }

  function clearQuery() {
    setSearchInput('');
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next, { replace: true });
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    if (categorySlug) {
      const next = new URLSearchParams(params);
      next.delete('category');
      setParams(next, { replace: true });
    }
  }

  const scopeTabs: TabItem<Scope>[] = SCOPE_VALUES.map((value) => ({
    value,
    label: t(SCOPE_LABEL_KEY[value]),
  }));

  const items = search.data?.items ?? [];
  const total = search.data?.total ?? 0;

  const activeFilterCount =
    (filters.level !== 'any' ? 1 : 0) +
    filters.topicIds.length +
    (filters.durationBucket !== 'any' ? 1 : 0) +
    (filters.isFree !== 'any' ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0 || Boolean(categorySlug);

  const topicName = (id: string) =>
    categories.data?.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: t('course.breadcrumb.explore'), to: '/explore' },
          { label: t('course.breadcrumb.searchResults') },
        ]}
      />

      <header className="space-y-4">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {q
              ? t('explore.results.titleQuery', { query: q })
              : t('explore.results.titleAll')}
          </h1>
          <p className="mt-1 text-sm text-ink-500" aria-live="polite">
            {search.isLoading
              ? t('explore.searching')
              : search.isError
                ? t('explore.results.errorTitle')
                : total === 0
                  ? t('explore.results.none')
                  : t('explore.results.count', { count: total })}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form onSubmit={onSubmitSearch} className="min-w-0 flex-1 sm:max-w-md">
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftSlot={<SearchIcon />}
              placeholder={t('explore.results.searchPlaceholder')}
              rightSlot={
                searchInput ? (
                  <button
                    type="button"
                    onClick={clearQuery}
                    className="grid size-8 place-items-center rounded-full text-ink-400 transition-colors duration-150 hover:text-ink-700"
                    aria-label={t('explore.results.clearSearch')}
                  >
                    <CloseIcon className="size-4" />
                  </button>
                ) : undefined
              }
            />
          </form>
          <Button
            variant="outline"
            leftIcon={<FilterIcon />}
            onClick={() => setDrawerOpen(true)}
            className="sm:shrink-0"
          >
            {t('explore.results.filter')}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                {t('explore.results.activeFilters', { count: activeFilterCount })}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-full overflow-x-auto">
          <Tabs items={scopeTabs} value={scope} onChange={(v) => setScope(v as Scope)} />
        </div>
        {categorySlug && (
          <FilterChip
            onRemove={() => {
              const next = new URLSearchParams(params);
              next.delete('category');
              setParams(next, { replace: true });
            }}
          >
            {categorySlug}
          </FilterChip>
        )}
        {filters.level !== 'any' && LEVEL_CHIP_KEY[filters.level] && (
          <FilterChip
            onRemove={() => setFilters((s) => ({ ...s, level: 'any' }))}
          >
            {t(LEVEL_CHIP_KEY[filters.level])}
          </FilterChip>
        )}
        {filters.topicIds.map((id) => (
          <FilterChip
            key={id}
            onRemove={() =>
              setFilters((s) => ({
                ...s,
                topicIds: s.topicIds.filter((tid) => tid !== id),
              }))
            }
          >
            {topicName(id)}
          </FilterChip>
        ))}
        {filters.durationBucket !== 'any' && (
          <FilterChip
            onRemove={() => setFilters((s) => ({ ...s, durationBucket: 'any' }))}
          >
            {t(DURATION_CHIP_KEY[filters.durationBucket])}
          </FilterChip>
        )}
        {filters.isFree !== 'any' && (
          <FilterChip onRemove={() => setFilters((s) => ({ ...s, isFree: 'any' }))}>
            {filters.isFree === 'free'
              ? t('explore.filter.price.free')
              : t('explore.filter.price.paid')}
          </FilterChip>
        )}
      </div>

      {search.isLoading ? (
        <ResultsSkeletonGrid />
      ) : search.isError ? (
        <div className="grid place-items-center rounded-2xl border border-ink-200 bg-white px-4 py-16 text-center shadow-[var(--shadow-card)]">
          <div className="max-w-sm">
            <h2 className="text-lg font-semibold text-ink-900">
              {t('explore.results.errorTitle')}
            </h2>
            <p className="mt-2 text-sm text-ink-500">{t('explore.results.errorBody')}</p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => void search.refetch()}
            >
              {t('explore.results.retry')}
            </Button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyResults
          query={q}
          onResetFilters={hasActiveFilters ? resetFilters : undefined}
        />
      ) : (
        <Stagger
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          stagger={0.05}
        >
          {items.map((c) => (
            <StaggerItem key={c.id} className="h-full [&>*]:h-full">
              <CourseGridCard
                course={c}
                onEnroll={(course) => {
                  enroll.mutate(course, {
                    onSuccess: () => navigate(`/courses/${course.slug}`),
                    onError: (err) => {
                      if (err.code === 'phone_not_verified') {
                        navigate('/verify-phone');
                      }
                    },
                  });
                }}
                enrollLoading={enroll.isPending && enroll.variables?.id === c.id}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories.data ?? []}
        initial={filters}
        onApply={setFilters}
      />
    </div>
  );
}

/** Card-shaped skeletons matching the result grid's layout and ratios. */
function ResultsSkeletonGrid() {
  return (
    <div
      aria-hidden
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]"
        >
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
