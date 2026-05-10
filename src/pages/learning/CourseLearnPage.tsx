import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { ArrowRightIcon, CheckIcon, CloseIcon, PlayIcon } from '@/components/icons';
import {
  useCourseCurriculum,
  useCourseDetail,
} from '@/features/course/hooks';
import {
  useCourseNotes,
  useDeleteNote,
  useMyEnrollments,
} from '@/features/learning/hooks';
import authIllustration from '@/assets/auth-illustration.png';
import type {
  CurriculumRead,
  LessonNoteRead,
  LessonSummary,
  SectionRead,
} from '@/types/api';

const TABS = [
  { value: 'modules', label: 'Modules' },
  { value: 'outline', label: 'Outline' },
  { value: 'notes', label: 'Notes' },
  { value: 'messages', label: 'Messages' },
  { value: 'resources', label: 'Resources' },
] as const satisfies readonly TabItem<string>[];

type Tab = (typeof TABS)[number]['value'];

/**
 * Enrolled-learner course page (Figma node 14115:49231).
 *
 * Different from /courses/:slug — that route is the marketing/detail page
 * for prospective students. This route is for users who have already
 * enrolled and shows trial status, modules, and lesson navigation.
 */
export function CourseLearnPage() {
  const { slug } = useParams();
  const course = useCourseDetail(slug);
  const curriculum = useCourseCurriculum(slug);
  const enrollments = useMyEnrollments({ size: 50 });
  const [tab, setTab] = useState<Tab>('modules');

  const enrollment = enrollments.data?.items.find(
    (e) => e.course.slug === slug,
  );

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
        <p className="text-sm text-ink-500">This course is unavailable.</p>
      </div>
    );
  }

  const c = course.data;
  const sections = curriculum.data?.sections ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'My learnings', to: '/learning-path' },
          { label: c.title },
        ]}
      />

      <Hero
        course={c}
        progressPercent={enrollment?.progress_percent ?? 0}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ModulesNav sections={sections} />

        <div className="space-y-5">
          <Tabs items={TABS} value={tab} onChange={(v) => setTab(v as Tab)} variant="underline" />

          {tab === 'modules' && (
            <ModulesContent course={c} sections={sections} />
          )}
          {tab === 'outline' && <OutlinePlaceholder />}
          {tab === 'notes' && (
            <NotesTab
              courseId={c.id}
              courseSlug={c.slug}
              curriculum={curriculum.data}
            />
          )}
          {tab === 'messages' && <MessagesPlaceholder />}
          {tab === 'resources' && <ResourcesPlaceholder />}
        </div>
      </div>
    </div>
  );
}

function Hero({
  course,
  progressPercent,
}: {
  course: NonNullable<ReturnType<typeof useCourseDetail>['data']>;
  progressPercent: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)_260px]">
        <div className="hidden bg-brand-700/30 lg:block">
          <img src={authIllustration} alt="" className="h-full w-full object-cover" />
        </div>

        <div className="px-6 py-8">
          <div className="flex items-center gap-2 text-xs">
            {course.tags?.[0] && <Badge tone="brand">{course.tags[0]}</Badge>}
            <Badge tone="teal">{course.level}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight">
            {course.title}
          </h1>
          {course.subtitle && (
            <p className="mt-2 max-w-xl text-sm text-white/70">{course.subtitle}</p>
          )}
        </div>

        <div className="px-6 py-6">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-white/70">Progress</p>
            <p className="mt-1 text-sm">
              <span className="text-2xl font-semibold">{Math.round(progressPercent)}%</span>{' '}
              <span className="text-white/70">complete</span>
            </p>
            <ProgressBar
              value={progressPercent}
              className="mt-3"
              trackClassName="bg-white/20"
              fillClassName="bg-teal-300"
            />
            <p className="mt-3 text-xs text-white/70">
              Keep going — pick a lesson below to continue.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModulesNav({ sections }: { sections: SectionRead[] }) {
  return (
    <aside className="rounded-2xl border border-ink-200 bg-white p-3 text-sm shadow-[var(--shadow-card)]">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
        Course
      </p>
      <ul className="space-y-1">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#section-${s.id}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-ink-700 hover:bg-ink-50"
            >
              <span className="truncate">Module {s.order}: {s.title}</span>
            </a>
          </li>
        ))}
        <li className="pt-2">
          <SidebarRow label="Outline" />
          <SidebarRow label="Notes" />
          <SidebarRow label="Messages" />
          <SidebarRow label="Resources" />
        </li>
      </ul>
    </aside>
  );
}

function SidebarRow({ label }: { label: string }) {
  return (
    <div className="px-3 py-2 text-ink-700 hover:bg-ink-50 rounded-lg cursor-default">
      {label}
    </div>
  );
}

function ModulesContent({
  course,
  sections,
}: {
  course: NonNullable<ReturnType<typeof useCourseDetail>['data']>;
  sections: SectionRead[];
}) {
  return (
    <div className="space-y-6">
      <header className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold text-ink-900">What you’ll learn</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
            {(course.learning_outcomes ?? []).slice(0, 4).map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-base font-semibold text-ink-900">Skill you’ll gain</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {(course.tags ?? []).slice(0, 6).map((tag) => (
              <li key={tag}>
                <Badge tone="neutral">{tag}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {sections.map((section) => (
        <section
          key={section.id}
          id={`section-${section.id}`}
          className="rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]"
        >
          <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h3 className="text-base font-semibold text-ink-900">
              Module {section.order}: {section.title}
            </h3>
            <span className="text-xs text-ink-500">{section.lessons.length} lessons</span>
          </header>
          <ul className="divide-y divide-ink-100">
            {section.lessons.map((lesson) => (
              <li key={lesson.id}>
                <LessonRow courseSlug={course.slug} lesson={lesson} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function LessonRow({
  courseSlug,
  lesson,
}: {
  courseSlug: string;
  lesson: LessonSummary;
}) {
  // Backend doesn't expose per-lesson completion here; the curriculum endpoint
  // returns LessonSummary without a `completed` flag, so we render unchecked
  // until the player marks the user's progress.
  const completed = false;
  return (
    <Link
      to={`/courses/${courseSlug}/lessons/${lesson.id}`}
      className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-ink-50"
    >
      <span
        className={
          completed
            ? 'grid size-7 place-items-center rounded-md bg-success-50 text-success-600'
            : 'grid size-7 place-items-center rounded-md bg-ink-100 text-ink-500'
        }
      >
        {completed ? <CheckIcon className="size-4" /> : <PlayIcon className="size-3.5" />}
      </span>
      <span className="flex-1">
        <span className="block font-medium text-ink-900">
          Lesson {lesson.order}: {lesson.title}
        </span>
        <span className="block text-xs text-ink-500">
          {Math.max(1, Math.round(lesson.duration_seconds / 60))} min · {lesson.type}
        </span>
      </span>
      <ArrowRightIcon className="text-ink-400" />
    </Link>
  );
}

function OutlinePlaceholder() {
  return <PlaceholderTab>The outline view is coming soon.</PlaceholderTab>;
}

function NotesTab({
  courseId,
  courseSlug,
  curriculum,
}: {
  courseId: string;
  courseSlug: string;
  curriculum: CurriculumRead | undefined;
}) {
  const notesQuery = useCourseNotes(courseId);
  const remove = useDeleteNote(courseId);

  // Map lesson_id → { title, order } so each note can show which lesson it
  // belongs to and link directly to it.
  const lessonIndex = useMemo(() => {
    const map = new Map<string, { title: string; order: number }>();
    curriculum?.sections.forEach((s) =>
      s.lessons.forEach((l) => map.set(l.id, { title: l.title, order: l.order })),
    );
    return map;
  }, [curriculum]);

  if (notesQuery.isLoading) {
    return (
      <div className="grid place-items-center py-10">
        <Spinner />
      </div>
    );
  }

  const notes = notesQuery.data ?? [];

  if (notes.length === 0) {
    return (
      <PlaceholderTab>
        No notes yet. Open a lesson and use the Notes tab there to write one — it’ll
        show up here.
      </PlaceholderTab>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((n: LessonNoteRead) => {
        const meta = lessonIndex.get(n.lesson_id);
        return (
          <li
            key={n.id}
            className="rounded-2xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]"
          >
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/courses/${courseSlug}/lessons/${n.lesson_id}`}
                  className="block text-sm font-semibold text-ink-900 hover:underline"
                >
                  {meta
                    ? `Lesson ${meta.order}: ${meta.title}`
                    : 'Lesson'}
                </Link>
                <p className="text-xs text-ink-500">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(n.id)}
                aria-label="Delete note"
                disabled={remove.isPending}
                className="text-ink-400 hover:text-ink-700 disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </header>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">{n.body}</p>
          </li>
        );
      })}
    </ul>
  );
}

function MessagesPlaceholder() {
  return <PlaceholderTab>Course messages will appear here once the backend ships.</PlaceholderTab>;
}
function ResourcesPlaceholder() {
  return <PlaceholderTab>Lesson resources are available inside each lesson’s Downloads tab.</PlaceholderTab>;
}

function PlaceholderTab({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
      {children}
    </p>
  );
}
