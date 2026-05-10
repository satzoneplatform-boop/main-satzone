import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import Hls from 'hls.js';
import { ApiError } from '@/api/errors';
import { Spinner } from '@/components/ui/Spinner';

export interface VideoPlayerHandle {
  /** Force re-mint of the playback URL (use on token expiry / IP mismatch). */
  reload: () => void;
}

interface VideoPlayerProps {
  /** Resolved HLS manifest URL (from /lessons/:id/playback). */
  src: string | null;
  /** Whether the backend has finished packaging. */
  ready: boolean;
  /** Called when the player wants a fresh token (token expired or IP changed). */
  onRequestRefresh: () => void;
  /** Tick the backend with playback position; called every ~10s. */
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
  /** Friendly label for an upstream playback API error (suppresses spinner). */
  errorLabel?: string | null;
  poster?: string;
}

/**
 * Lesson video player.
 *
 * Wires hls.js (or native HLS on Safari) to a token-stamped manifest URL
 * minted by /lessons/:id/playback (FRONTEND.md §5.1). On a fatal player
 * error or 401-style segment failure, calls `onRequestRefresh` so the
 * page can re-mint the token.
 *
 * Aligned to a 16:9 frame so the video stays correct on laptop widths
 * (e.g. 1280–1728 px) without letterboxing.
 */
export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    { src, ready, onRequestRefresh, onProgress, errorLabel, poster },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const lastTickRef = useRef(0);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      reload: () => {
        onRequestRefresh();
      },
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src || !ready) return;

      setError(null);

      // Native HLS support (Safari, iOS).
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        return () => {
          video.removeAttribute('src');
          video.load();
        };
      }

      if (!Hls.isSupported()) {
        setError('Your browser does not support HLS playback.');
        return;
      }

      const hls = new Hls({
        // The token is in the URL; no extra Authorization header needed
        // because the backend signs the manifest, segments, and AES-128 key
        // against the same `?t=` query string (FRONTEND.md §5.1).
        autoStartLoad: true,
        capLevelToPlayerSize: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        // Network failures usually mean the playback token expired or the
        // user's IP changed. Ask the parent to mint a new URL.
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          onRequestRefresh();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          setError('Playback failed. Please try again.');
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }, [src, ready, onRequestRefresh]);

    function onTimeUpdate() {
      if (!onProgress || !videoRef.current) return;
      const now = videoRef.current.currentTime;
      // Throttle to one tick per 10 s.
      if (Math.abs(now - lastTickRef.current) >= 10) {
        lastTickRef.current = now;
        onProgress(now, videoRef.current.duration || 0);
      }
    }

    function onEnded() {
      if (!videoRef.current || !onProgress) return;
      onProgress(videoRef.current.duration || 0, videoRef.current.duration || 0);
    }

    const upstreamErr = errorLabel ?? null;

    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-ink-900">
        {upstreamErr ? (
          <div className="grid h-full w-full place-items-center px-6 text-center text-white/80">
            <p className="max-w-md text-sm">{upstreamErr}</p>
          </div>
        ) : !ready ? (
          <div className="grid h-full w-full place-items-center text-center text-white/80">
            <div>
              <Spinner size="lg" className="text-white" />
              <p className="mt-3 text-sm">Video processing — this can take a minute.</p>
            </div>
          </div>
        ) : error ? (
          <div className="grid h-full w-full place-items-center text-center text-white/80">
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            playsInline
            poster={poster}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            className="h-full w-full bg-black object-contain"
          />
        )}
      </div>
    );
  },
);

/** Map an ApiError code from /lessons/:id/playback to a friendly label. */
export function playbackErrorLabel(err: ApiError | null): string | null {
  if (!err) return null;
  switch (err.code) {
    case 'lesson_video_missing':
      return 'Coming soon — the instructor hasn’t uploaded this video yet.';
    case 'hls_not_ready':
      return 'Video processing — please try again in a moment.';
    case 'lesson_key_missing':
      return 'This lesson’s video failed to package. Contact the instructor.';
    case 'not_enrolled':
      return 'Enroll in this course to watch this lesson.';
    case 'course_preview_missing':
      return 'No preview available for this course yet.';
    case 'course_not_published':
      return 'This course isn’t published yet.';
    case 'playback_ip_mismatch':
    case 'playback_token_expired':
    case 'invalid_playback_token':
    case 'missing_playback_token':
    case 'playback_resource_mismatch':
    case 'playback_scope_mismatch':
      return 'Refreshing your stream…';
    case 'rate_limited':
      return 'Too many requests right now — wait about a minute, then refresh.';
    default:
      // Surface the underlying code so callers can see what backend returned
      // (otherwise the generic fallback hides real bugs in dev).
      return `Playback failed (${err.code}). ${err.message ?? 'Please refresh and try again.'}`;
  }
}
