import { CategoryCard } from '@/components/explore/CategoryCard';
import { DegreeCard } from '@/components/explore/DegreeCard';
import { ExploreSearchHero } from '@/components/explore/ExploreSearchHero';
import { PopularCourseCard } from '@/components/explore/PopularCourseCard';
import { Spinner } from '@/components/ui/Spinner';
import {
  useCategories,
  usePopularCourses,
  usePrograms,
} from '@/features/explore/hooks';

export function ExplorePage() {
  const categories = useCategories();
  const popular = usePopularCourses(4);
  const programs = usePrograms(3);

  return (
    <div className="space-y-8">
      <ExploreSearchHero />

      <Section title="Explore categories">
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

      <Section title="Popular courses for you">
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

      <Section title="Get your dream degree">
        {programs.isLoading ? (
          <SkeletonRow />
        ) : programs.data?.items.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.data.items.map((p) => (
              <DegreeCard key={p.id} program={p} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-500">
            Programs are coming soon — check back shortly.
          </p>
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
