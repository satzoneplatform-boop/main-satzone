import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { CourseHero } from '@/components/course/CourseHero';
import { CourseStats } from '@/components/course/CourseStats';
import { InstructorCard } from '@/components/course/InstructorCard';
import { PricingCard } from '@/components/course/PricingCard';
import { PopularCourseCard } from '@/components/explore/PopularCourseCard';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { CheckIcon } from '@/components/icons';
import {
  useCourseCurriculum,
  useCourseDetail,
  useRelatedCourses,
} from '@/features/course/hooks';
import { useMyEnrollments } from '@/features/learning/hooks';
import { enrollmentsApi } from '@/api/enrollments';
import { ApiError } from '@/api/errors';
import { formatPrice } from '@/lib/format';
import { launchConfetti } from '@/lib/confetti';
import { useT } from '@/i18n/I18nProvider';
import { useAuth } from '@/features/auth/AuthProvider';

type Tab = 'overview' | 'instructor' | 'courses' | 'schedule' | 'testimonials';

export function CourseDetailPage() {
  const t = useT();
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const course = useCourseDetail(slug);
  const curriculum = useCourseCurriculum(slug);
  const related = useRelatedCourses(slug);
  const myEnrollments = useMyEnrollments({ size: 50 });
  const [tab, setTab] = useState<Tab>('overview');

  const TABS: TabItem<Tab>[] = useMemo(
    () => [
      { value: 'overview', label: t('course.tabs.overview') },
      { value: 'instructor', label: t('course.tabs.instructor') },
      { value: 'courses', label: t('course.tabs.courses') },
      { value: 'schedule', label: t('course.tabs.schedule') },
      { value: 'testimonials', label: t('course.tabs.testimonials') },
    ],
    [t],
  );

  const isEnrolled = Boolean(
    myEnrollments.data?.items.some((e) => e.course.slug === slug),
  );

  const enroll = useMutation({
    mutationFn: (courseId: string) => enrollmentsApi.enroll(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      // The confetti overlay lives outside the React tree, so it plays on
      // across the navigation to the learn page.
      launchConfetti();
      navigate(`/courses/${slug}/learn`);
    },
  });

  function onCtaClick() {
    if (!course.data) return;
    if (isEnrolled) {
      navigate(`/courses/${slug}/learn`);
      return;
    }
    if (course.data.is_free) {
      enroll.mutate(course.data.id);
      return;
    }
    // Paid course → go through checkout flow.
    navigate(`/courses/${slug}/checkout`);
  }

  if (course.isLoading) {
    return <DetailSkeleton />;
  }

  if (course.error || !course.data) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-ink-500">{t('course.detail.unavailable')}</p>
      </div>
    );
  }

  const c = course.data;

  // Server-provided prices only — mirror the PricingCard's discount logic.
  const hasDiscount =
    c.discount_price_cents != null &&
    c.discount_price_cents < c.price_cents &&
    !c.is_free;
  const barPrice = c.is_free
    ? t('course.pricing.free')
    : formatPrice(
        hasDiscount ? c.discount_price_cents! : c.price_cents,
        c.currency,
        false,
      );
  const ctaLabel = isEnrolled
    ? t('course.pricing.continueLearning')
    : c.is_free
      ? t('course.pricing.enrollFree')
      : t('course.pricing.enrollNow');

  return (
    // pb-20 keeps content clear of the mobile action bar (hidden ≥lg).
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb
          items={[
            { label: t('course.breadcrumb.explore'), to: '/explore' },
            { label: c.title },
          ]}
        />
        {(user?.role === 'instructor' || user?.role === 'admin') && (
          <Link
            to={`/instructor/courses/${slug}/assessments`}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-700 shadow-[var(--shadow-input)] transition-colors duration-150 hover:bg-ink-50"
          >
            {t('course.detail.manageAssessments')}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <CourseHero course={c} />
          <CourseStats course={c} curriculum={curriculum.data} />

          <div>
            <Tabs items={TABS} value={tab} onChange={(v) => setTab(v as Tab)} variant="underline" />
            <div className="mt-6">
              {tab === 'overview' && <OverviewSection course={c} />}
              {tab === 'instructor' && c.instructor && <InstructorCard instructor={c.instructor} />}
              {tab === 'courses' && <CurriculumPlaceholder />}
              {tab === 'schedule' && <SchedulePlaceholder />}
              {tab === 'testimonials' && <TestimonialsPlaceholder />}
            </div>
          </div>

          {c.instructor && tab === 'overview' && (
            <InstructorCard instructor={c.instructor} />
          )}
        </div>

        <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <PricingCard
            course={c}
            onStart={onCtaClick}
            isEnrolled={isEnrolled}
            loading={enroll.isPending}
          />
          {enroll.error instanceof ApiError && (
            <p className="text-sm text-danger-600">
              {t('course.detail.enrollFailed', { message: enroll.error.message })}
            </p>
          )}
        </div>
      </div>

      {related.data && related.data.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight text-navy-900">
            {t('course.relatedCourses')}
          </h2>
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
            {related.data.slice(0, 4).map((rc) => (
              <StaggerItem key={rc.id} className="h-full [&>*]:h-full">
                <PopularCourseCard course={rc} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* Mobile buy bar — the desktop sticky card collapses into this fixed
          action bar below lg. It sits above the BottomNav (h-14 + safe area)
          so it never covers it. */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-ink-200 bg-white px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-baseline gap-2">
              <span className="truncate text-lg font-semibold text-ink-900">
                {barPrice}
              </span>
              {hasDiscount && (
                <span className="text-xs text-ink-400 line-through">
                  {formatPrice(c.price_cents, c.currency, false)}
                </span>
              )}
            </p>
            <p className="truncate text-xs text-ink-500">
              {isEnrolled
                ? t('course.pricing.enrolledHint')
                : c.is_free
                  ? t('course.pricing.freeHint')
                  : t('course.pricing.paidHint')}
            </p>
          </div>
          <Button
            onClick={onCtaClick}
            loading={enroll.isPending}
            className="shrink-0"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Truthful loading frame that mirrors the hero + stats + pricing layout. */
function DetailSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <Skeleton className="h-4 w-56" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-14" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewSection({ course }: { course: ReturnType<typeof useCourseDetail>['data'] & {} }) {
  const t = useT();
  const c = course;
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-base font-semibold text-navy-900">{t('course.detail.whatLearn')}</h3>
        <p className="mt-1 text-sm text-ink-500">
          {c.description || t('course.detail.whatLearnFallback')}
        </p>
        {c.learning_outcomes?.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {c.learning_outcomes.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-success-50 text-success-600">
                  <CheckIcon className="size-3" />
                </span>
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold text-navy-900">{t('course.detail.shareableCertificate')}</h3>
          <p className="mt-2 text-sm text-ink-500">
            {t('course.detail.shareableCertificateDesc')}
          </p>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold text-navy-900">{t('course.detail.skillsGain')}</h3>
          {c.tags?.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {c.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-ink-100 px-2 py-1 text-xs font-medium text-ink-700"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-500">{t('course.detail.skillsGainFallback')}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function CurriculumPlaceholder() {
  const t = useT();
  return (
    <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
      {t('course.detail.curriculumSoon')}
    </p>
  );
}
function SchedulePlaceholder() {
  const t = useT();
  return (
    <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
      {t('course.detail.scheduleSoon')}
    </p>
  );
}
function TestimonialsPlaceholder() {
  const t = useT();
  return (
    <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
      {t('course.detail.testimonialsSoon')}
    </p>
  );
}
