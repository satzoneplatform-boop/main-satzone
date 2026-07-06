import { CategoryCard } from '@/components/explore/CategoryCard';
import { ExploreSearchHero } from '@/components/explore/ExploreSearchHero';
import { PopularCourseCard } from '@/components/explore/PopularCourseCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { useCategories, usePopularCourses } from '@/features/explore/hooks';
import { useT } from '@/i18n/I18nProvider';
import type { CourseSummary } from '@/types/api';

export function ExplorePage() {
  const categories = useCategories();
  const popular = usePopularCourses(100);
  const t = useT();

  const allCourses = popular.data?.items ?? [];
  const featured = allCourses.filter((c) => c.is_featured).slice(0, 4);
  const rest = featured.length > 0 ? allCourses.filter((c) => !c.is_featured) : allCourses;

  return (
    <div className="space-y-10">
      <Reveal onView={false}>
        <ExploreSearchHero />
      </Reveal>

      <Section title={t('explore.section.categories')}>
        {categories.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-[76px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <Stagger
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            stagger={0.05}
          >
            {(categories.data ?? []).slice(0, 6).map((c) => (
              <StaggerItem key={c.id} className="h-full [&>*]:h-full">
                <CategoryCard category={c} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Section>

      {featured.length > 0 && (
        <Section title={t('explore.section.featured')}>
          <CourseGrid courses={featured} />
        </Section>
      )}

      <Section title={t('explore.section.popular')}>
        {popular.isLoading ? (
          <SkeletonRow />
        ) : popular.isError ? (
          <div className="grid place-items-center rounded-2xl border border-ink-200 bg-white px-4 py-12 text-center shadow-[var(--shadow-card)]">
            <div className="max-w-sm">
              <h3 className="text-base font-semibold text-ink-900">
                {t('explore.results.errorTitle')}
              </h3>
              <p className="mt-2 text-sm text-ink-500">{t('explore.results.errorBody')}</p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => void popular.refetch()}
              >
                {t('explore.results.retry')}
              </Button>
            </div>
          </div>
        ) : rest.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
            {t('explore.section.empty')}
          </p>
        ) : (
          <CourseGrid courses={rest} />
        )}
      </Section>
    </div>
  );
}

function CourseGrid({ courses }: { courses: CourseSummary[] }) {
  return (
    <Stagger
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      stagger={0.06}
    >
      {courses.map((c) => (
        <StaggerItem key={c.id} className="h-full [&>*]:h-full">
          <PopularCourseCard course={c} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <Reveal>
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-navy-900">{title}</h2>
        </header>
      </Reveal>
      {children}
    </section>
  );
}

/** Skeletons matching the course card frame (image + copy lines). */
function SkeletonRow() {
  return (
    <div aria-hidden className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]"
        >
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
