import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import {
  CloseIcon,
  DownloadIcon,
  SearchIcon,
} from '@/components/icons';
import {
  VideoPlayer,
  playbackErrorLabel,
} from '@/components/player/VideoPlayer';
import { CurriculumNav } from '@/components/learning/CurriculumNav';
import { ApiError } from '@/api/errors';
import {
  useCourseCurriculum,
  useCourseDetail,
} from '@/features/course/hooks';
import {
  useCreateLessonNote,
  useDeleteLessonNote,
  useLessonAttachments,
  useLessonNotes,
  useLessonPlayback,
  useMyEnrollments,
  useUpdateLessonProgress,
} from '@/features/learning/hooks';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatDuration } from '@/lib/format';
import type { LessonAttachmentRead, LessonNoteRead } from '@/types/api';
import { env } from '@/lib/env';

const TABS = [
  { value: 'transcripts', label: 'Transcripts' },
  { value: 'notes', label: 'Notes' },
  { value: 'downloads', label: 'Downloads' },
] as const satisfies readonly TabItem<string>[];

type Tab = (typeof TABS)[number]['value'];

export function LessonPlayerPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const course = useCourseDetail(slug);
  const curriculum = useCourseCurriculum(slug);
  const enrollments = useMyEnrollments({ size: 50 });
  const playback = useLessonPlayback(lessonId);
  const [tab, setTab] = useState<Tab>('transcripts');

  const enrollment = enrollments.data?.items.find(
    (e) => e.course.slug === slug,
  );
  const update = useUpdateLessonProgress(enrollment?.id);

  // Re-mint the playback URL on token expiry / IP change errors.
  function refreshPlayback() {
    void playback.refetch();
  }

  // Auto-refresh shortly before the token expires (FRONTEND.md §5.1).
  useEffect(() => {
    if (!playback.data?.expires_at) return;
    const expiresAt = new Date(playback.data.expires_at).getTime();
    const refreshAt = expiresAt - 60_000; // 1 min early
    const delay = Math.max(0, refreshAt - Date.now());
    const t = window.setTimeout(refreshPlayback, delay);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback.data?.expires_at]);

  function onProgress(positionSeconds: number, duration: number) {
    if (!enrollment || !lessonId) return;
    update.mutate({
      lessonId,
      payload: {
        last_position_seconds: Math.floor(positionSeconds),
        watched_seconds: Math.floor(positionSeconds),
        completed: duration > 0 && positionSeconds >= duration - 1,
      },
    });
  }

  const lesson = useMemo(() => {
    return curriculum.data?.sections
      .flatMap((s) => s.lessons)
      .find((l) => l.id === lessonId);
  }, [curriculum.data, lessonId]);

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
        <p className="text-sm text-ink-500">Course unavailable.</p>
      </div>
    );
  }

  // Prefer a freshly-loaded data state over a stale error: if the latest
  // fetch returned data, suppress any leftover error from earlier attempts.
  const playbackErr =
    playback.error instanceof ApiError && !playback.data ? playback.error : null;
  const apiErrLabel = playbackErrorLabel(playbackErr);

  // Backend can return 200 OK with `hls_status` null/undefined when no video
  // has been uploaded for this lesson — treat that as "coming soon" rather
  // than spinning forever.
  const noVideoLabel =
    playback.data && !playback.data.hls_url && playback.data.hls_status !== 'pending'
      ? 'Coming soon — the instructor hasn’t uploaded this video yet.'
      : null;

  const playbackErrLabel = apiErrLabel ?? noVideoLabel;

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100vh-72px)] min-h-0 flex-col bg-white">
      <header className="border-b border-ink-200 px-6 py-3">
        <Breadcrumb
          items={[
            { label: 'My learnings', to: '/learning-path' },
            { label: course.data.title, to: `/courses/${slug}/learn` },
            { label: lesson?.title ?? 'Lesson' },
          ]}
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <CurriculumNav
          curriculum={curriculum.data}
          courseSlug={slug!}
          activeId={lessonId}
        />

        <main className="min-w-0 flex-1 overflow-auto px-6 py-6">
          <div className="mx-auto max-w-4xl space-y-5">
            <VideoPlayer
              src={playback.data?.hls_url ?? null}
              ready={(playback.data?.hls_status ?? 'pending') === 'ready'}
              onRequestRefresh={refreshPlayback}
              onProgress={onProgress}
              errorLabel={playbackErrLabel}
            />

            {playback.data?.hls_status === 'failed' && (
              <div className="rounded-md border border-danger-500/40 bg-danger-50 px-3 py-2 text-sm text-danger-600">
                Video packaging failed for this lesson — please contact the
                instructor.
              </div>
            )}

            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-ink-900">
                  Lesson {lesson?.order ?? '—'}: {lesson?.title ?? 'Loading'}
                </h1>
                {lesson && (
                  <p className="mt-1 text-xs text-ink-500">
                    {formatDuration(Math.round(lesson.duration_seconds / 60))} ·{' '}
                    {lesson.type}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    /* save-note action handled in the Notes tab below */
                    setTab('notes');
                  }}
                >
                  Save note
                </Button>
                <Button variant="ghost" className="text-danger-600">
                  Report issue
                </Button>
              </div>
            </header>

            <Tabs items={TABS} value={tab} onChange={(v) => setTab(v as Tab)} variant="underline" />

            {tab === 'transcripts' && <TranscriptsTab />}
            {tab === 'notes' && lessonId && <NotesTab lessonId={lessonId} />}
            {tab === 'downloads' && lessonId && <DownloadsTab lessonId={lessonId} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function TranscriptsTab() {
  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Badge tone="brand">All transcript</Badge>
          <Badge>English</Badge>
        </div>
        <div className="w-full max-w-xs">
          <Input
            type="search"
            placeholder="Search transcript"
            leftSlot={<SearchIcon />}
          />
        </div>
      </header>

      <article className="prose prose-sm mt-4 max-w-none space-y-3 text-sm leading-relaxed text-ink-700">
        <p>
          In this lesson we focus on one of the most critical skills in strategic thinking:
          framing business problems in ways that lead to clearer decision-making.
        </p>
        <p>
          Strong framing starts by stripping away assumptions and asking what we’re truly trying
          to solve. The transcript will populate from the lesson video once the backend ships
          captions.
        </p>
      </article>
    </section>
  );
}

function NotesTab({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const notesQuery = useLessonNotes(lessonId);
  const create = useCreateLessonNote(lessonId);
  const remove = useDeleteLessonNote(lessonId);
  const [draft, setDraft] = useState('');

  function add() {
    const body = draft.trim();
    if (!body) return;
    create.mutate(
      { body },
      {
        onSuccess: () => setDraft(''),
      },
    );
  }

  const notes = notesQuery.data ?? [];

  return (
    <section className="space-y-4">
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write a note for this lesson…"
      />
      {create.error instanceof ApiError && (
        <p className="text-sm text-danger-600">
          Couldn’t save note: {create.error.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button onClick={add} disabled={!draft.trim()} loading={create.isPending}>
          Save note
        </Button>
      </div>

      {notesQuery.isLoading ? (
        <div className="grid place-items-center py-10">
          <Spinner />
        </div>
      ) : notes.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-ink-50 py-16 text-center text-sm text-ink-500">
          <div>
            <span aria-hidden className="text-4xl">📗</span>
            <p className="mt-2">You haven’t added a note yet</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n: LessonNoteRead) => (
            <li
              key={n.id}
              className="flex gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-[var(--shadow-input)]"
            >
              <Avatar name={user?.full_name} src={user?.avatar_url} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">
                  {user?.full_name ?? 'You'}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{n.body}</p>
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Resolve an attachment's `file_key` to a downloadable URL.
 *  - Absolute http(s) URL → use as-is (S3 presigned, etc.).
 *  - Otherwise treat as a key under the backend's `/media/` mount
 *    (FRONTEND.md §1 — local-storage mode serves files at `/media/...`).
 */
function attachmentDownloadUrl(att: LessonAttachmentRead): string | null {
  if (!att.file_key) return null;
  if (/^https?:\/\//i.test(att.file_key)) return att.file_key;
  // Vite dev proxy forwards /media/* to the backend; in prod, same-origin reverse-proxy.
  // Strip any leading slash from the key before joining.
  const key = att.file_key.replace(/^\/+/, '');
  // If the key already starts with "media/", don't double it up.
  return key.startsWith('media/') ? `/${key}` : `/media/${key}`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function fileKindLabel(att: LessonAttachmentRead): string {
  if (att.mime_type) {
    const m = att.mime_type;
    if (m.includes('pdf')) return 'PDF';
    if (m.includes('word')) return 'DOCX';
    if (m.includes('zip')) return 'ZIP';
    if (m.startsWith('image/')) return m.split('/')[1].toUpperCase();
  }
  const ext = att.file_key?.split('.').pop();
  return ext ? ext.slice(0, 4).toUpperCase() : 'FILE';
}

function DownloadsTab({ lessonId }: { lessonId: string }) {
  const attachments = useLessonAttachments(lessonId);
  const items = attachments.data ?? [];

  // Suppress unused-import warning for `env` — kept available for future
  // signed-download endpoint wiring.
  void env;

  if (attachments.isLoading) {
    return (
      <div className="grid place-items-center py-10">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-ink-50 py-16 text-center text-sm text-ink-500">
        <div>
          <span aria-hidden className="text-4xl">📎</span>
          <p className="mt-2">No downloadable resources for this lesson</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink-900">Download</h2>
      </header>
      <ul className="divide-y divide-ink-100 rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
        {items.map((file) => {
          const url = attachmentDownloadUrl(file);
          return (
            <li
              key={file.id}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-ink-100 text-xs font-semibold text-ink-700">
                  {fileKindLabel(file)}
                </span>
                <div>
                  <p className="font-medium text-ink-900">{file.title}</p>
                  <p className="text-xs text-ink-500">
                    {formatBytes(file.file_size_bytes)}
                  </p>
                </div>
              </div>
              {url ? (
                <a
                  href={url}
                  download={file.title}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Download ${file.title}`}
                  className="grid size-8 place-items-center rounded-md text-ink-500 hover:bg-ink-50 hover:text-ink-700"
                >
                  <DownloadIcon />
                </a>
              ) : (
                <span className="text-xs text-ink-400">Unavailable</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
