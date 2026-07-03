import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { useCourseCurriculum, useCourseDetail } from '@/features/course/hooks';
import { adminApi, instructorApi } from '@/api/instructor';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';
import type {
  AssessmentStatus,
  AssessmentSummary,
  AssessmentUpdatePayload,
} from '@/types/api';

/**
 * Instructor diagnostic view: lists every assessment attached to a course
 * and highlights which ones are visible to students.
 *
 * An assessment is visible only when ALL three hold (per the backend's
 * `assessment_service.get_section_quiz_for_student`):
 *   1. `status === 'published'`
 *   2. `is_section_quiz === true`
 *   3. `section_id` points to a real section in the course
 *
 * The page lets you edit the three fields inline and PATCH them through
 * `/instructor/assessments/{id}`.
 */
export function AssessmentsAdminPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const t = useT();
  const course = useCourseDetail(slug);
  const curriculum = useCourseCurriculum(slug);

  const assessments = useQuery({
    queryKey: ['instructor', 'assessments', course.data?.id],
    queryFn: () => instructorApi.listCourseAssessments(course.data!.id, { size: 100 }),
    enabled: !!course.data?.id,
    staleTime: 30_000,
  });

  if (user && user.role !== 'instructor' && user.role !== 'admin') {
    return (
      <div className="grid place-items-center py-24 text-center">
        <div>
          <p className="text-sm font-semibold text-navy-900">{t('admin.assess.instructorsOnly')}</p>
          <p className="mt-1 text-sm text-ink-500">{t('admin.assess.instructorsOnlyBody')}</p>
        </div>
      </div>
    );
  }

  if (course.isLoading || curriculum.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-8 w-96 max-w-full" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!course.data) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-ink-500">{t('admin.assess.courseNotFound')}</p>
      </div>
    );
  }

  const sections = curriculum.data?.sections ?? [];
  const sectionLabel = (id: string | null): string => {
    if (!id) return t('admin.assess.sectionNone');
    const s = sections.find((x) => x.id === id);
    return s
      ? t('admin.assess.moduleLabel', { n: s.order, title: s.title })
      : t('admin.assess.sectionUnknown');
  };

  const items = assessments.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: t('nav.explore'), to: '/explore' },
          { label: course.data.title, to: `/courses/${slug}` },
          { label: t('admin.assess.breadcrumb') },
        ]}
      />

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">
          {t('admin.assess.title', { course: course.data.title })}
        </h1>
        <p className="max-w-2xl text-sm text-ink-500">{t('admin.assess.intro')}</p>
      </header>

      <div className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-600">
        {t('admin.assess.signedInAs', {
          email: user?.email ?? '—',
          role: user?.role ?? '—',
        })}
      </div>

      {assessments.isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : assessments.error instanceof ApiError ? (
        <div className="rounded-2xl border border-danger-500/40 bg-danger-50 p-6 text-sm text-danger-600">
          <p className="font-semibold">{t('admin.assess.loadErrorTitle')}</p>
          <p className="mt-1 text-xs">
            {t('admin.assess.loadErrorMeta', {
              status: assessments.error.status,
              code: assessments.error.code,
            })}
          </p>
          <p className="mt-1 text-xs">{assessments.error.message}</p>
          {assessments.error.status === 403 && (
            <>
              <p className="mt-3 text-xs text-ink-700">{t('admin.assess.forbiddenHint')}</p>
              {user?.role === 'admin' && course.data && (
                <TakeOwnershipButton
                  courseId={course.data.id}
                  fallbackName={user.full_name || user.email}
                />
              )}
            </>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-center text-sm text-ink-500">
          <p>{t('admin.assess.emptyTitle')}</p>
          <p className="mt-2 text-xs">{t('admin.assess.emptyBody')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <AssessmentRow
              key={a.id}
              assessment={a}
              sectionLabel={sectionLabel}
              sections={sections}
              courseId={course.data!.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AssessmentRow({
  assessment: a,
  sectionLabel,
  sections,
  courseId,
}: {
  assessment: AssessmentSummary;
  sectionLabel: (id: string | null) => string;
  sections: { id: string; order: number; title: string }[];
  courseId: string;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const visible = useMemo(
    () =>
      a.status === 'published' &&
      a.is_section_quiz &&
      !!a.section_id &&
      sections.some((s) => s.id === a.section_id),
    [a, sections],
  );

  const reasons: string[] = [];
  if (a.status !== 'published') {
    reasons.push(t('admin.assess.reason.status', { status: a.status }));
  }
  if (!a.is_section_quiz) reasons.push(t('admin.assess.reason.notSectionQuiz'));
  if (!a.section_id) reasons.push(t('admin.assess.reason.noSection'));
  else if (!sections.some((s) => s.id === a.section_id)) {
    reasons.push(t('admin.assess.reason.foreignSection'));
  }

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 truncate text-base font-semibold text-navy-900">{a.title}</h2>
            <StatusBadge status={a.status} />
            {a.is_section_quiz ? (
              <Badge tone="brand">{t('admin.assess.badge.sectionQuiz')}</Badge>
            ) : (
              <Badge tone="neutral">{t('admin.assess.badge.notSectionQuiz')}</Badge>
            )}
            {visible ? (
              <Badge tone="success">{t('admin.assess.badge.visible')}</Badge>
            ) : (
              <Badge tone="danger">{t('admin.assess.badge.hidden')}</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {t('admin.assess.meta.section')}:{' '}
            <span className="font-medium text-ink-700">{sectionLabel(a.section_id)}</span>
            {' · '}
            {a.questions_count === 1
              ? t('admin.assess.meta.question', { n: a.questions_count })
              : t('admin.assess.meta.questions', { n: a.questions_count })}
            {' · '}
            {t('admin.assess.meta.pass', { pct: a.pass_percent })}
            {a.time_limit_minutes
              ? ` · ${t('admin.assess.meta.minutes', { n: a.time_limit_minutes })}`
              : ''}
          </p>
          {!visible && reasons.length > 0 && (
            <p className="mt-2 text-xs text-danger-600">
              {t('admin.assess.hiddenBecause', { reasons: reasons.join('; ') })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={() => navigate(`/assessments/${a.id}`)}
          >
            {t('admin.assess.preview')}
          </Button>
          <Button
            variant={editing ? 'ghost' : 'outline'}
            size="sm"
            className="min-h-11"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
          >
            {editing ? t('admin.assess.closeEdit') : t('admin.assess.edit')}
          </Button>
        </div>
      </div>

      {editing && (
        <EditPanel
          assessment={a}
          sections={sections}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            void queryClient.invalidateQueries({
              queryKey: ['instructor', 'assessments', courseId],
            });
            // Bust the student-facing section-quiz cache for the relevant
            // sections so the curriculum nav picks the change up.
            void queryClient.invalidateQueries({ queryKey: ['section'] });
            setEditing(false);
          }}
        />
      )}
    </li>
  );
}

function EditPanel({
  assessment: a,
  sections,
  onCancel,
  onSaved,
}: {
  assessment: AssessmentSummary;
  sections: { id: string; order: number; title: string }[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [status, setStatus] = useState<AssessmentStatus>(a.status);
  const [isSectionQuiz, setIsSectionQuiz] = useState<boolean>(a.is_section_quiz);
  const [sectionId, setSectionId] = useState<string>(a.section_id ?? '');

  const save = useMutation({
    mutationFn: (payload: AssessmentUpdatePayload) =>
      instructorApi.updateAssessment(a.id, payload),
    onSuccess: () => onSaved(),
  });

  function onSave() {
    const payload: AssessmentUpdatePayload = {
      status,
      is_section_quiz: isSectionQuiz,
      section_id: sectionId === '' ? null : sectionId,
    };
    save.mutate(payload);
  }

  const dirty =
    status !== a.status ||
    isSectionQuiz !== a.is_section_quiz ||
    (a.section_id ?? '') !== sectionId;

  const oneClickPublishable =
    !(a.status === 'published' && a.is_section_quiz && a.section_id);

  return (
    <div className="mt-4 grid gap-4 rounded-xl border border-ink-200 bg-ink-50 p-4 sm:grid-cols-3">
      <Select
        label={t('admin.assess.field.section')}
        options={[
          { value: '', label: t('admin.assess.sectionNoneOption') },
          ...sections.map((s) => ({
            value: s.id,
            label: t('admin.assess.moduleLabel', { n: s.order, title: s.title }),
          })),
        ]}
        value={sectionId}
        onChange={(e) => setSectionId(e.target.value)}
      />
      <Select
        label={t('admin.assess.field.status')}
        options={[
          { value: 'draft', label: t('admin.assess.status.draft') },
          { value: 'published', label: t('admin.assess.status.published') },
          { value: 'archived', label: t('admin.assess.status.archived') },
        ]}
        value={status}
        onChange={(e) => setStatus(e.target.value as AssessmentStatus)}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-900">
          {t('admin.assess.field.sectionQuiz')}
        </span>
        <div className="flex h-11 items-center">
          <Switch
            checked={isSectionQuiz}
            onChange={setIsSectionQuiz}
            label={t('admin.assess.field.sectionQuizToggle')}
          />
          <span className="ml-2 text-xs text-ink-500">
            {isSectionQuiz ? t('admin.assess.yes') : t('admin.assess.no')}
          </span>
        </div>
      </div>

      <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 pt-3">
        {oneClickPublishable && sections.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={() => {
              setStatus('published');
              setIsSectionQuiz(true);
              if (!sectionId) setSectionId(sections[0].id);
            }}
          >
            {t('admin.assess.prefill')}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {save.error instanceof ApiError && (
            <span role="alert" className="text-xs text-danger-600">
              {save.error.message}
            </span>
          )}
          <Button variant="ghost" size="sm" className="min-h-11" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            className="min-h-11"
            onClick={onSave}
            disabled={!dirty}
            loading={save.isPending}
          >
            {t('admin.assess.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AssessmentStatus }) {
  const t = useT();
  if (status === 'published') {
    return <Badge tone="success">{t('admin.assess.status.published')}</Badge>;
  }
  if (status === 'archived') {
    return <Badge tone="neutral">{t('admin.assess.status.archived')}</Badge>;
  }
  return <Badge tone="warn">{t('admin.assess.status.draft')}</Badge>;
}

/**
 * Admin-only escape hatch: when the assessments list 403s with
 * "you do not own this course," let the admin reassign the course to
 * their own instructor profile (creating one if it doesn't exist).
 */
function TakeOwnershipButton({
  courseId,
  fallbackName,
}: {
  courseId: string;
  fallbackName: string;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const reassign = useMutation({
    mutationFn: async () => {
      // 1) Ensure my instructor profile exists (PUT is idempotent upsert).
      //    Send only `name` so existing fields aren't clobbered with nulls.
      const profile = await instructorApi.upsertMyProfile({
        name: fallbackName || 'Admin',
      });
      // 2) Reassign course ownership to that profile.
      await adminApi.updateCourse(courseId, { instructor_id: profile.id });
    },
    onSuccess: () => {
      // Refetch the list — the 403 should be gone now.
      void queryClient.invalidateQueries({
        queryKey: ['instructor', 'assessments', courseId],
      });
    },
  });

  return (
    <div className="mt-3 flex flex-col items-start gap-2">
      <Button
        size="sm"
        className="min-h-11"
        onClick={() => reassign.mutate()}
        loading={reassign.isPending}
      >
        {t('admin.assess.takeOwnership')}
      </Button>
      {reassign.error instanceof ApiError && (
        <p role="alert" className="text-xs text-danger-600">
          {t('admin.assess.reassignFailed', { message: reassign.error.message })}
        </p>
      )}
      {reassign.isSuccess && (
        <p role="status" className="text-xs text-success-600">
          {t('admin.assess.reassignSuccess')}
        </p>
      )}
    </div>
  );
}
