import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LockIcon } from '@/components/icons';
import {
  useAssessment,
  useAssessmentHistory,
  useMyEnrollments,
} from '@/features/learning/hooks';
import { useCompletedLessons } from '@/features/learning/completionStore';
import { CurriculumNav } from '@/components/learning/CurriculumNav';
import { useCourseCurriculum, useCourseDetail } from '@/features/course/hooks';
import { StartAssessmentModal } from './StartAssessmentModal';
import { formatDuration } from '@/lib/format';
import { useT } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/en';

/**
 * Assessment overview / "before you start" page (Figma nodes 14115:50188 + 14115:49788).
 *
 * Shows attempt history stats at the top and a hero summary card. Question
 * prompts/options are deliberately NOT rendered here — they're only shown
 * inside the runner after the student clicks Start and accepts the honor
 * code, to prevent pre-reading the test before the timer starts.
 *
 * (The backend's `GET /assessments/{id}` still returns the questions
 * inline — they're in the network payload — but the UI hides them. If a
 * stricter hide is needed, the backend would need a metadata-only endpoint.)
 */
export function AssessmentOverviewPage() {
  const t = useT();
  const { slug, assessmentId } = useParams<{ slug: string; assessmentId: string }>();
  const assessment = useAssessment(assessmentId);
  const history = useAssessmentHistory(assessmentId);
  const course = useCourseDetail(slug);
  const curriculum = useCourseCurriculum(slug);
  const enrollments = useMyEnrollments({ size: 50 });
  const navigate = useNavigate();
  const [startOpen, setStartOpen] = useState(false);

  // Sequential-lock signal — same source of truth as CurriculumNav and the
  // lesson player. Must be called unconditionally (rules of hooks).
  const enrollmentId = enrollments.data?.items.find(
    (e) => e.course.slug === slug,
  )?.id;
  const completedIds = useCompletedLessons(enrollmentId);

  if (assessment.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!assessment.data) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-ink-500">{t('assessment.overview.unavailable')}</p>
      </div>
    );
  }

  const a = assessment.data;
  const attempts = history.data ?? [];
  const best = attempts.reduce((max, s) => (s.score_percent > max ? s.score_percent : max), 0);
  const lastScore = attempts[0]?.score_percent ?? 0;
  const attemptsUsed = attempts.length;
  const attemptsAllowed = a.max_attempts; // null = unlimited
  const alreadyPassed = attempts.some(
    (s) => s.passed || s.score_percent >= a.pass_percent,
  );

  // Lock the quiz until every lesson in its section is completed (or the
  // user has already passed it once — retakes stay open up to max_attempts).
  // Falls through (unlocked) if curriculum hasn't loaded yet or assessment
  // isn't bound to a section, to avoid blocking the page in edge states.
  const section = a.section_id
    ? curriculum.data?.sections.find((s) => s.id === a.section_id)
    : null;
  const sectionLessonsCompleted = section
    ? section.lessons.every((l) => completedIds.has(l.id))
    : true;
  const locked = !sectionLessonsCompleted && !alreadyPassed;

  const stats = [
    { label: t('assessment.overview.finalScore'), value: `${Math.round(lastScore)}/100` },
    { label: t('assessment.overview.bestGrade'), value: `${Math.round(best)} (${grade(best, t)})` },
    {
      label: t('assessment.overview.attempts'),
      value:
        attemptsAllowed == null
          ? `${attemptsUsed} / ∞`
          : `${attemptsUsed}/${attemptsAllowed}`,
    },
    {
      label: t('assessment.overview.timeLimit'),
      value: a.time_limit_minutes
        ? t('assessment.overview.minutes', { n: a.time_limit_minutes })
        : t('assessment.overview.dash'),
    },
    { label: t('assessment.overview.passingScore'), value: `${a.pass_percent}` },
  ];

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100vh-72px)] min-h-0 flex-col bg-white">
      <header className="border-b border-ink-200 px-6 py-3">
        <Breadcrumb
          items={[
            { label: t('learning.lesson.coursesBreadcrumb'), to: '/learning-path' },
            { label: course.data?.title ?? t('course.breadcrumb.course'), to: `/courses/${slug}/learn` },
            { label: t('course.breadcrumb.assessment') },
          ]}
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <CurriculumNav
          curriculum={curriculum.data}
          courseSlug={slug!}
          activeId={assessmentId}
        />

        <main className="min-w-0 flex-1 overflow-auto px-6 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <section className="grid grid-cols-2 gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)] sm:grid-cols-5">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-semibold text-ink-900">{s.value}</p>
                  <p className="mt-1 text-xs text-ink-500">{s.label}</p>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-5 sm:flex sm:justify-end">
                <Button
                  onClick={() => setStartOpen(true)}
                  leftIcon={locked ? <LockIcon className="size-4" /> : undefined}
                  disabled={
                    locked ||
                    (attemptsAllowed != null && attemptsUsed >= attemptsAllowed)
                  }
                >
                  {locked
                    ? t('assessment.overview.lockedCta')
                    : attemptsUsed > 0
                      ? t('assessment.overview.nextAttempt')
                      : t('assessment.overview.startAssessment')}
                </Button>
              </div>
            </section>

            {locked && (
              <section className="flex items-start gap-3 rounded-2xl border border-warn-500/40 bg-yellow-50 p-4 text-sm text-ink-700">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-warn-500/15 text-warn-500">
                  <LockIcon className="size-4" />
                </span>
                <div>
                  <p className="font-semibold text-ink-900">
                    {t('assessment.overview.lockedTitle')}
                  </p>
                  <p className="mt-0.5 text-xs">
                    {t('assessment.overview.lockedBody')}
                  </p>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <h1 className="text-xl font-semibold text-ink-900">{a.title}</h1>
              {a.description && (
                <p className="mt-2 max-w-2xl text-sm text-ink-500">{a.description}</p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4 sm:grid-cols-3">
                <Detail label={t('assessment.overview.assessmentType')} value={t('assessment.overview.multipleChoice')} />
                <Detail
                  label={t('assessment.overview.estimatedTime')}
                  value={
                    a.time_limit_minutes
                      ? `${formatDuration(a.time_limit_minutes)}`
                      : t('assessment.overview.noLimit')
                  }
                />
                <Detail
                  label={t('assessment.overview.numberOfQuestions')}
                  value={t('assessment.overview.questionsCount', { n: a.questions.length })}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-dashed border-ink-200 bg-ink-50 p-8 text-center">
              <p className="text-sm font-medium text-ink-900">
                {t('assessment.overview.questionsHiddenTitle')}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {t('assessment.overview.questionsHiddenBody', {
                  n: a.questions.length,
                })}
              </p>
            </section>
          </div>
        </main>
      </div>

      <StartAssessmentModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onStart={() => {
          setStartOpen(false);
          navigate(`/courses/${slug}/assessments/${assessmentId}/take`);
        }}
        timeLimitMinutes={a.time_limit_minutes ?? undefined}
        attemptsRemaining={
          attemptsAllowed == null ? undefined : attemptsAllowed - attemptsUsed
        }
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900">
        <Badge tone="brand">{value}</Badge>
      </p>
    </div>
  );
}

function grade(score: number, t: (k: TranslationKey) => string): string {
  if (score >= 90) return t('assessment.grade.great');
  if (score >= 70) return t('assessment.grade.good');
  if (score >= 50) return t('assessment.grade.fair');
  return t('assessment.grade.tryAgain');
}
