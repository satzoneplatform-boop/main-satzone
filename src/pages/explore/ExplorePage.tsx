import { CategoryCard } from '@/components/explore/CategoryCard';
import { ExploreSearchHero } from '@/components/explore/ExploreSearchHero';
import { PopularCourseCard } from '@/components/explore/PopularCourseCard';
import { Spinner } from '@/components/ui/Spinner';
import {
  useCategories,
  usePopularCourses,
} from '@/features/explore/hooks';
import { useT } from '@/i18n/I18nProvider';

export function ExplorePage() {
  const categories = useCategories();
  const popular = usePopularCourses(100);
  const t = useT();

  return (
    <div className="space-y-8">
      <ExploreSearchHero />

      <Section title={t('explore.section.categories')}>
        {categories.isLoading ? (
          <div className="grid place-items-center py-6">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(categories.data ?? []).slice(0, 6).map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        )}
      </Section>

      <Section title={t('explore.section.popular')}>
        {popular.isLoading ? (
          <SkeletonRow />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(popular.data?.items ?? []).map((c) => (
              <PopularCourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-56 animate-pulse rounded-2xl border border-ink-200 bg-white"
        />
      ))}
    </div>
  );
}
