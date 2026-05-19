import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { useCourseCurriculum, useCourseDetail } from '@/features/course/hooks';
import { adminApi, instructorApi } from '@/api/instructor';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthProvider';
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
          <p className="text-sm font-semibold text-ink-900">Instructors only</p>
          <p className="mt-1 text-sm text-ink-500">
            This page is restricted to instructor and admin accounts.
          </p>
        </div>
      </div>
    );
  }

  if (course.isLoading || curriculum.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course.data) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-ink-500">Course not found.</p>
      </div>
    );
  }

  const sections = curriculum.data?.sections ?? [];
  const sectionLabel = (id: string | null): string => {
    if (!id) return '— none —';
    const s = sections.find((x) => x.id === id);
    return s ? `Module ${s.order}: ${s.title}` : 'Unknown section';
  };

  const items = assessments.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Explore', to: '/explore' },
          { label: course.data.title, to: `/courses/${slug}` },
          { label: 'Assessments admin' },
        ]}
      />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Assessments — {course.data.title}
        </h1>
        <p className="max-w-2xl text-sm text-ink-500">
          For an assessment to appear under a module on the student side, it
          needs <b>status&nbsp;=&nbsp;published</b>, <b>is_section_quiz&nbsp;=&nbsp;true</b>,
          and a valid <b>section</b>. Misconfigured ones are flagged below.
        </p>
      </header>

      <div className="rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-600">
        Signed in as <b>{user?.email ?? '—'}</b> · role:{' '}
        <b className="text-ink-900">{user?.role ?? '—'}</b>
      </div>

      {assessments.isLoading ? (
        <div className="grid place-items-center py-12">
          <Spinner />
        </div>
      ) : assessments.error instanceof ApiError ? (
        <div className="rounded-2xl border border-danger-500/40 bg-danger-50 p-6 text-sm text-danger-600">
          <p className="font-semibold">Couldn’t load assessments.</p>
          <p className="mt-1 text-xs">
            Status {assessments.error.status} · code{' '}
            <code>{assessments.error.code}</code>
          </p>
          <p className="mt-1 text-xs">{assessments.error.message}</p>
          {assessments.error.status === 403 && (
            <>
              <p className="mt-3 text-xs text-ink-700">
                The backend only returns assessments for courses owned by the
                authenticated instructor. If this is your account, make sure
                your instructor profile is set up (PUT /instructor/me/profile)
                and that you’re the instructor of this course.
              </p>
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
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
          <p>No assessments returned for this course.</p>
          <p className="mt-2 text-xs">
            The endpoint scopes results to the courses your instructor
            account owns — if assessments do exist server-side but live
            under a different instructor, this list will be empty.
          </p>
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
  if (a.status !== 'published') reasons.push(`status is "${a.status}"`);
  if (!a.is_section_quiz) reasons.push('is_section_quiz=false');
  if (!a.section_id) reasons.push('no section');
  else if (!sections.some((s) => s.id === a.section_id))
    reasons.push('section_id points to a section not in this course');

  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink-900">{a.title}</h2>
            <StatusBadge status={a.status} />
            {a.is_section_quiz ? (
              <Badge tone="brand">Section quiz</Badge>
            ) : (
              <Badge tone="neutral">Not a section quiz</Badge>
            )}
            {visible ? (
              <Badge tone="success">Visible to students</Badge>
            ) : (
              <Badge tone="danger">Hidden from students</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Section: <span className="font-medium text-ink-700">{sectionLabel(a.section_id)}</span>
            {' · '}
            {a.questions_count} question{a.questions_count === 1 ? '' : 's'}
            {' · '}
            pass {a.pass_percent}%
            {a.time_limit_minutes ? ` · ${a.time_limit_minutes} min` : ''}
          </p>
          {!visible && reasons.length > 0 && (
            <p className="mt-2 text-xs text-danger-600">
              Hidden because: {reasons.join('; ')}.
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/assessments/${a.id}`)}
          >
            Preview
          </Button>
          <Button
            variant={editing ? 'ghost' : 'outline'}
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? 'Close' : 'Edit'}
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
        label="Section"
        options={[
          { value: '', label: '— none (course-level) —' },
          ...sections.map((s) => ({
            value: s.id,
            label: `Module ${s.order}: ${s.title}`,
          })),
        ]}
        value={sectionId}
        onChange={(e) => setSectionId(e.target.value)}
      />
      <Select
        label="Status"
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' },
        ]}
        value={status}
        onChange={(e) => setStatus(e.target.value as AssessmentStatus)}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-900">Is section quiz</span>
        <div className="flex h-11 items-center">
          <Switch
            checked={isSectionQuiz}
            onChange={setIsSectionQuiz}
            label="Mark as section quiz"
          />
          <span className="ml-2 text-xs text-ink-500">
            {isSectionQuiz ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 pt-3">
        {oneClickPublishable && sections.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus('published');
              setIsSectionQuiz(true);
              if (!sectionId) setSectionId(sections[0].id);
            }}
          >
            Pre-fill: make visible (section 1, published)
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {save.error instanceof ApiError && (
            <span className="text-xs text-danger-600">
              {save.error.message}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={!dirty} loading={save.isPending}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AssessmentStatus }) {
  if (status === 'published') return <Badge tone="success">Published</Badge>;
  if (status === 'archived') return <Badge tone="neutral">Archived</Badge>;
  return <Badge tone="warn">Draft</Badge>;
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
        onClick={() => reassign.mutate()}
        loading={reassign.isPending}
      >
        Take ownership of this course (admin)
      </Button>
      {reassign.error instanceof ApiError && (
        <p className="text-xs text-danger-600">
          Reassign failed: {reassign.error.message}
        </p>
      )}
      {reassign.isSuccess && (
        <p className="text-xs text-success-600">
          Ownership transferred — reloading the list…
        </p>
      )}
    </div>
  );
}
