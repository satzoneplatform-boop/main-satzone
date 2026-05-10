import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  useAssessment,
  useAssessmentHistory,
} from '@/features/learning/hooks';
import { CurriculumNav } from '@/components/learning/CurriculumNav';
import { useCourseCurriculum, useCourseDetail } from '@/features/course/hooks';
import { StartAssessmentModal } from './StartAssessmentModal';
import { formatDuration } from '@/lib/format';

/**
 * Assessment overview / "before you start" page (Figma nodes 14115:50188 + 14115:49788).
 *
 * Shows attempt history stats at the top, a hero summary card, and the
 * questions list (read-only preview from /assessments/:id; backend strips
 * `is_correct` from options per FRONTEND.md §4.8).
 */
export function AssessmentOverviewPage() {
  const { slug, assessmentId } = useParams<{ slug: string; assessmentId: string }>();
  const assessment = useAssessment(assessmentId);
  const history = useAssessmentHistory(assessmentId);
  const course = useCourseDetail(slug);
  const curriculum = useCourseCurriculum(slug);
  const navigate = useNavigate();
  const [startOpen, setStartOpen] = useState(false);

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
        <p className="text-sm text-ink-500">This assessment is unavailable.</p>
      </div>
    );
  }

  const a = assessment.data;
  const attempts = history.data ?? [];
  const best = attempts.reduce((max, s) => (s.score_percent > max ? s.score_percent : max), 0);
  const lastScore = attempts[0]?.score_percent ?? 0;
  const attemptsUsed = attempts.length;
  const attemptsAllowed = a.max_attempts; // null = unlimited

  const stats = [
    { label: 'Final score', value: `${Math.round(lastScore)}/100` },
    { label: 'Best grade', value: `${Math.round(best)} (${grade(best)})` },
    {
      label: 'Attempts',
      value:
        attemptsAllowed == null
          ? `${attemptsUsed} / ∞`
          : `${attemptsUsed}/${attemptsAllowed}`,
    },
    { label: 'Time limit', value: a.time_limit_minutes ? `${a.time_limit_minutes} Min` : '—' },
    { label: 'Passing score', value: `${a.pass_percent}` },
  ];

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100vh-72px)] min-h-0 flex-col bg-white">
      <header className="border-b border-ink-200 px-6 py-3">
        <Breadcrumb
          items={[
            { label: 'My learnings', to: '/learning-path' },
            { label: course.data?.title ?? 'Course', to: `/courses/${slug}/learn` },
            { label: 'Assessment' },
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
                  disabled={
                    attemptsAllowed != null && attemptsUsed >= attemptsAllowed
                  }
                >
                  {attemptsUsed > 0 ? 'Next attempt' : 'Start assessment'}
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <h1 className="text-xl font-semibold text-ink-900">{a.title}</h1>
              {a.description && (
                <p className="mt-2 max-w-2xl text-sm text-ink-500">{a.description}</p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4 sm:grid-cols-3">
                <Detail label="Assessment Type" value="Multiple choice" />
                <Detail
                  label="Estimated Time"
                  value={
                    a.time_limit_minutes
                      ? `${formatDuration(a.time_limit_minutes)}`
                      : 'No limit'
                  }
                />
                <Detail
                  label="Number of questions"
                  value={`${a.questions.length} questions`}
                />
              </div>
            </section>

            {a.questions.slice(0, 3).map((q, i) => (
              <article
                key={q.id}
                className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <p className="text-sm font-semibold text-ink-900">
                  {i + 1}. {q.prompt}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-ink-600">
                  {q.options.map((o) => (
                    <li key={o.id} className="flex items-center gap-2">
                      <span className="size-4 rounded-full border border-ink-300" />
                      {o.text}
                    </li>
                  ))}
                </ul>
              </article>
            ))}

            {a.questions.length > 3 && (
              <p className="text-center text-sm text-ink-500">
                {a.questions.length - 3} more questions in this assessment.
              </p>
            )}
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

function grade(score: number): string {
  if (score >= 90) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Try again';
}
