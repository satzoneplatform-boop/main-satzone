import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { CourseHero } from '@/components/course/CourseHero';
import { CourseStats } from '@/components/course/CourseStats';
import { InstructorCard } from '@/components/course/InstructorCard';
import { PricingCard } from '@/components/course/PricingCard';
import { PopularCourseCard } from '@/components/explore/PopularCourseCard';
import { CheckIcon } from '@/components/icons';
import {
  useCourseCurriculum,
  useCourseDetail,
  useRelatedCourses,
} from '@/features/course/hooks';
import { useMyEnrollments } from '@/features/learning/hooks';
import { enrollmentsApi } from '@/api/enrollments';
import { ApiError } from '@/api/errors';
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
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (course.error || !course.data) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-ink-500">{t('course.detail.unavailable')}</p>
      </div>
    );
  }

  const c = course.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb
          items={[
            { label: t('course.breadcrumb.explore'), to: '/explore' },
            { label: t('course.breadcrumb.searchResults'), to: '/explore/search' },
            { label: t('course.breadcrumb.detail') },
          ]}
        />
        {(user?.role === 'instructor' || user?.role === 'admin') && (
          <Link
            to={`/instructor/courses/${slug}/assessments`}
            className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
          >
            Manage assessments
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

        <div className="space-y-3">
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
          <h2 className="mb-4 text-lg font-semibold text-ink-900">{t('course.relatedCourses')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.data.slice(0, 4).map((rc) => (
              <PopularCourseCard key={rc.id} course={rc} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OverviewSection({ course }: { course: ReturnType<typeof useCourseDetail>['data'] & {} }) {
  const t = useT();
  const c = course;
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-base font-semibold text-ink-900">{t('course.detail.whatLearn')}</h3>
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
          <h3 className="text-base font-semibold text-ink-900">{t('course.detail.shareableCertificate')}</h3>
          <p className="mt-2 text-sm text-ink-500">
            {t('course.detail.shareableCertificateDesc')}
          </p>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold text-ink-900">{t('course.detail.skillsGain')}</h3>
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
