import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
import { ApiError } from '@/api/errors';
import { rewriteHlsUrl } from '@/lib/hls';
import { Spinner } from '@/components/ui/Spinner';

interface CoursePreviewPlayerProps {
  /** Course slug — fed to /courses/{slug}/preview-playback when the user hits play. */
  slug: string;
  /** Image shown until the user clicks play (and on failure). */
  poster?: string | null;
  /** Accessible label for screen readers. */
  title?: string;
}

/**
 * Course-detail preview player. Per FRONTEND.md §5.2, the preview is a
 * direct MP4 — NOT HLS — served with byte-range support. The
 * `preview_playback_url` on CourseDetail is a relative path the
 * frontend must `GET` (Bearer auth) to mint a short-lived signed
 * `stream_url`; that URL goes into `<video src={...} controls />` and
 * the browser handles ranged playback natively.
 *
 * UX: render the poster + a play overlay first so we don't burn a
 * preview token on every page view. On click, fetch the signed URL
 * and swap to the actual <video>. On failure (no preview uploaded,
 * course not published, token expired in the cold-start race) we
 * fall back to the poster with a small error label.
 */
export function CoursePreviewPlayer({
  slug,
  poster,
  title,
}: CoursePreviewPlayerProps) {
  const [stage, setStage] = useState<'idle' | 'playing'>('idle');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const mint = useMutation({
    mutationFn: () => coursesApi.previewPlayback(slug),
    onSuccess: (res) => {
      // Re-host the signed URL onto the API origin the app actually uses.
      // The backend builds stream_url from its own API_BASE_URL, which may
      // differ from the public origin (or default to localhost) — without
      // this the <video src> would point at the wrong host in production.
      setStreamUrl(rewriteHlsUrl(res.stream_url));
      setStage('playing');
    },
  });

  function onPlay() {
    if (mint.isPending || stage === 'playing') return;
    mint.mutate();
  }

  if (stage === 'playing' && streamUrl) {
    return (
      <video
        src={streamUrl}
        controls
        autoPlay
        playsInline
        preload="metadata"
        poster={poster ?? undefined}
        aria-label={title}
        className="h-full w-full bg-ink-900 object-cover"
        onError={() => {
          // Token expired or IP changed mid-playback — drop back to the
          // poster; user can click play to re-mint.
          setStage('idle');
          setStreamUrl(null);
        }}
      />
    );
  }

  // Friendly label for the most common preview failures.
  const errorLabel = mint.error instanceof ApiError ? previewErrorLabel(mint.error) : null;

  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={mint.isPending}
      className="group relative block h-full w-full overflow-hidden bg-ink-900"
      aria-label={title ? `Play preview: ${title}` : 'Play course preview'}
    >
      {poster ? (
        <img
          src={poster}
          alt=""
          className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
        />
      ) : (
        <div className="grid h-full place-items-center text-4xl">📘</div>
      )}

      {/* Play-button overlay */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center bg-ink-900/30 transition-colors group-hover:bg-ink-900/40"
      >
        {mint.isPending ? (
          <Spinner size="lg" className="text-white" />
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-white/95 text-ink-900 shadow-lg transition-transform group-hover:scale-105">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </span>

      {errorLabel && (
        <span className="absolute inset-x-0 bottom-0 bg-ink-900/80 px-3 py-2 text-center text-xs text-white">
          {errorLabel}
        </span>
      )}
    </button>
  );
}

/** Map an ApiError from /preview-playback to a short user-facing label. */
function previewErrorLabel(err: ApiError): string {
  switch (err.code) {
    case 'course_preview_missing':
      return 'No preview available yet.';
    case 'course_not_published':
      return 'Preview not available — course is in draft.';
    case 'rate_limited':
      return 'Too many requests — try again in a minute.';
    default:
      return 'Preview unavailable. Try again later.';
  }
}
