import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
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
import { useT } from '@/i18n/I18nProvider';
import { formatDuration } from '@/lib/format';
import type { LessonAttachmentRead, LessonNoteRead } from '@/types/api';
import { env } from '@/lib/env';
import {
  completionStore,
  useCompletedLessons,
} from '@/features/learning/completionStore';

type Tab = 'transcripts' | 'notes' | 'downloads';

export function LessonPlayerPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const t = useT();
  const course = useCourseDetail(slug);
  const curriculum = useCourseCurriculum(slug);
  const enrollments = useMyEnrollments({ size: 50 });
  const playback = useLessonPlayback(lessonId);
  const [tab, setTab] = useState<Tab>('transcripts');

  const tabs: TabItem<Tab>[] = [
    { value: 'transcripts', label: t('learning.lesson.transcripts') },
    { value: 'notes', label: t('learning.lesson.notes') },
    { value: 'downloads', label: t('learning.lesson.downloads') },
  ];

  const enrollment = enrollments.data?.items.find(
    (e) => e.course.slug === slug,
  );
  const update = useUpdateLessonProgress(enrollment?.id);

  // Re-mint the playback URL on token expiry / IP change errors.
  function refreshPlayback() {
    void playback.refetch();
  }

  // Refresh the token ahead of `expires_at`. Default TTL is 30 min; we
  // refresh 2 min early, but never sooner than 30 s after the current
  // mint to avoid hammering /playback if the backend issues a short TTL.
  useEffect(() => {
    if (!playback.data?.expires_at) return;
    const expiresAt = new Date(playback.data.expires_at).getTime();
    const delay = Math.max(30_000, expiresAt - Date.now() - 120_000);
    const t = window.setTimeout(refreshPlayback, delay);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback.data?.expires_at]);

  function onProgress(positionSeconds: number, duration: number) {
    if (!enrollment || !lessonId) return;
    const completed = duration > 0 && positionSeconds >= duration - 1;
    update.mutate({
      lessonId,
      payload: {
        last_position_seconds: Math.floor(positionSeconds),
        watched_seconds: Math.floor(positionSeconds),
        completed,
      },
    });
    // Mirror the backend write in the local completion cache so the
    // sequential lock in the curriculum nav updates immediately.
    if (completed) {
      completionStore.markComplete(enrollment.id, lessonId);
    }
  }

  // Sequential gate: a lesson is unlocked only if every preceding lesson
  // (across all sections, in curriculum order) is in the local completion
  // cache. The first lesson is always unlocked.
  const completedIds = useCompletedLessons(enrollment?.id);
  const orderedLessonIds = useMemo(
    () =>
      (curriculum.data?.sections ?? []).flatMap((s) =>
        s.lessons.map((l) => l.id),
      ),
    [curriculum.data],
  );
  const firstLockedIndex = useMemo(() => {
    for (let i = 0; i < orderedLessonIds.length; i++) {
      if (!completedIds.has(orderedLessonIds[i])) return i;
    }
    return orderedLessonIds.length; // everything completed
  }, [orderedLessonIds, completedIds]);
  const currentIndex = lessonId ? orderedLessonIds.indexOf(lessonId) : -1;
  const isLockedLesson =
    currentIndex >= 0 && currentIndex > firstLockedIndex;

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
        <p className="text-sm text-ink-500">{t('common.unavailable')}</p>
      </div>
    );
  }

  // Direct URL to a locked lesson → bounce to the next available one.
  // We can't compute this until curriculum has loaded, hence after the
  // loading gate above.
  if (isLockedLesson && curriculum.data && orderedLessonIds.length > 0) {
    const targetId = orderedLessonIds[firstLockedIndex] ?? orderedLessonIds[0];
    return (
      <Navigate to={`/courses/${slug}/lessons/${targetId}`} replace />
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
      ? t('learning.lesson.comingSoon')
      : null;

  const playbackErrLabel = apiErrLabel ?? noVideoLabel;

  // Authoritative total duration comes only from /playback
  // (total_segments × segment_seconds). When the backend hasn't supplied
  // those fields we hand `null` to the player and let it use
  // <video>.duration directly — that's correct for VOD manifests. We
  // intentionally do NOT fall back to `lesson.duration_seconds`: that's a
  // rough hint from the instructor (sometimes a default like "2 min") and
  // showing it as the player's clock makes the timeline look wrong when
  // the real video is shorter or longer.
  const segs = playback.data?.total_segments ?? 0;
  const segSec = playback.data?.segment_seconds ?? 0;
  const computedDuration = segs > 0 && segSec > 0 ? segs * segSec : 0;
  const authoritativeDuration = computedDuration > 0 ? computedDuration : null;

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100vh-72px)] min-h-0 flex-col bg-white">
      <header className="border-b border-ink-200 px-6 py-3">
        <Breadcrumb
          items={[
            { label: t('learning.lesson.coursesBreadcrumb'), to: '/learning-path' },
            { label: course.data.title, to: `/courses/${slug}/learn` },
            { label: lesson?.title ?? t('learning.lesson.lessonLabel') },
          ]}
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <CurriculumNav
          curriculum={curriculum.data}
          courseSlug={slug!}
          activeId={lessonId}
          completedIds={completedIds}
          enforceSequentialLock
        />

        <main className="min-w-0 flex-1 overflow-auto px-6 py-6">
          <div className="mx-auto max-w-4xl space-y-5">
            <VideoPlayer
              src={playback.data?.hls_url ?? null}
              ready={(playback.data?.hls_status ?? 'pending') === 'ready'}
              onRequestRefresh={refreshPlayback}
              onProgress={onProgress}
              errorLabel={playbackErrLabel}
              duration={authoritativeDuration}
            />

            {playback.data?.hls_status === 'failed' && (
              <div className="rounded-md border border-danger-500/40 bg-danger-50 px-3 py-2 text-sm text-danger-600">
                {t('learning.lesson.videoFailed')}
              </div>
            )}

            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-ink-900">
                  {t('learning.lesson.lessonLabel')} {lesson?.order ?? '—'}:{' '}
                  {lesson?.title ?? t('learning.lesson.loadingLesson')}
                </h1>
                {lesson && (
                  <p className="mt-1 text-xs text-ink-500">
                    {formatDuration(Math.round(lesson.duration_seconds / 60))} ·{' '}
                    {lesson.type}
                  </p>
                )}
              </div>
            </header>

            <Tabs items={tabs} value={tab} onChange={(v) => setTab(v as Tab)} variant="underline" />

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
  const t = useT();
  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Badge tone="brand">{t('learning.lesson.transcripts.all')}</Badge>
          <Badge>{t('learning.lesson.transcripts.language')}</Badge>
        </div>
        <div className="w-full max-w-xs">
          <Input
            type="search"
            placeholder={t('learning.lesson.transcripts.searchPlaceholder')}
            leftSlot={<SearchIcon />}
          />
        </div>
      </header>

      <article className="prose prose-sm mt-4 max-w-none space-y-3 text-sm leading-relaxed text-ink-700">
        <p>{t('learning.lesson.transcripts.body1')}</p>
        <p>{t('learning.lesson.transcripts.body2')}</p>
      </article>
    </section>
  );
}

function NotesTab({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const t = useT();
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
        placeholder={t('learning.lesson.notePlaceholder')}
      />
      {create.error instanceof ApiError && (
        <p className="text-sm text-danger-600">
          {create.error.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button onClick={add} disabled={!draft.trim()} loading={create.isPending}>
          {t('learning.lesson.saveNote')}
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
            <p className="mt-2">{t('learning.lesson.emptyNotes')}</p>
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
                  {user?.full_name ?? t('common.you')}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{n.body}</p>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(n.id)}
                aria-label={t('learning.lesson.deleteNote')}
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
  const t = useT();
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
          <p className="mt-2">{t('learning.lesson.emptyDownloads')}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink-900">{t('learning.lesson.downloads')}</h2>
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
                <span className="text-xs text-ink-400">{t('learning.lesson.unavailable')}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
