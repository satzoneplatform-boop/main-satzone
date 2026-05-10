import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CourseGridCard } from '@/components/explore/CourseGridCard';
import { EmptyResults } from '@/components/explore/EmptyResults';
import {
  DEFAULT_FILTERS,
  FilterDrawer,
  toCourseFilters,
  type FilterValue,
} from '@/components/explore/FilterDrawer';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { FilterIcon, SearchIcon } from '@/components/icons';
import { ApiError } from '@/api/errors';
import { api } from '@/api/client';
import { useCategories, useCourseSearch } from '@/features/explore/hooks';
import type { CourseFilters } from '@/api/courses';
import type { CourseSummary, EnrollmentRead } from '@/types/api';

const SCOPE_TABS = [
  { value: 'all', label: 'All courses' },
  { value: 'business', label: 'Trans business' },
  { value: 'pre_certificate', label: 'Pre Certificate' },
  { value: 'faq', label: 'FAQ' },
  { value: 'degree', label: 'Degree' },
] as const satisfies readonly TabItem<string>[];

type Scope = (typeof SCOPE_TABS)[number]['value'];

export function SearchResultsPage() {
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

  const items = search.data?.items ?? [];
  const total = search.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Explore', to: '/explore' },
          { label: 'Search Results' },
        ]}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Results for {q ? `“${q}”` : 'all courses'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {search.isLoading
              ? 'Searching…'
              : total === 0
                ? 'No results match this search.'
                : `There are ${total} results that match with this search`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={onSubmitSearch}>
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftSlot={<SearchIcon />}
              placeholder="Search class or project"
              containerClassName="min-w-[280px]"
              rightSlot={
                searchInput ? (
                  <button
                    type="button"
                    onClick={clearQuery}
                    className="text-ink-400 hover:text-ink-700"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                ) : undefined
              }
            />
          </form>
          <Button
            variant="outline"
            leftIcon={<FilterIcon />}
            onClick={() => setDrawerOpen(true)}
          >
            Filter
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs items={SCOPE_TABS} value={scope} onChange={(v) => setScope(v as Scope)} />
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
      </div>

      {search.isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyResults query={q} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((c) => (
            <CourseGridCard
              key={c.id}
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
          ))}
        </div>
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
