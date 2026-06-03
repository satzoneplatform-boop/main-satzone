import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Hls from 'hls.js';
import { ApiError } from '@/api/errors';
import { Spinner } from '@/components/ui/Spinner';
import { rewriteHlsUrl } from '@/lib/hls';
import { LessonVideoPlayer } from './LessonVideoPlayer';

/**
 * hls.js custom loader that rewrites every fetched URL through the API
 * proxy origin.
 *
 * Necessary because the manifest the backend serves embeds **absolute**
 * URLs for the AES-128 key and segments. Even after we rewrite the
 * master playlist URL, hls.js follows those absolute links cross-origin,
 * which bypasses the dev proxy and breaks the IP binding (token has
 * `cip: "::1"`, but the direct fetch shows the public NAT IP).
 *
 * The wrapper intercepts every `load(context)` call and rewrites
 * `context.url` before delegating to the default XHR loader. Applies
 * uniformly to manifest, playlists, segments, and the AES key.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRewritingLoader(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Base: any = Hls.DefaultConfig.loader;
  return class extends Base {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load(context: any, config: any, callbacks: any) {
      if (context?.url) {
        context.url = rewriteHlsUrl(context.url);
      }
      super.load(context, config, callbacks);
    }
  };
}

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
  /** Authoritative total duration (seconds) — overrides <video>.duration for sliding manifests. */
  duration?: number | null;
}

/**
 * Lesson video player.
 *
 * Wires hls.js (or native HLS on Safari) to a token-stamped manifest URL
 * minted by /lessons/:id/playback (FRONTEND.md §5.1). The chrome (custom
 * controls, free scrub, capped rate at 2×) is rendered by `LessonVideoPlayer`
 * and we attach hls.js to the `<video>` element it exposes via
 * `onVideoElement`.
 */
export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    { src, ready, onRequestRefresh, onProgress, errorLabel, duration },
    ref,
  ) {
    const [video, setVideo] = useState<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const lastTickRef = useRef(0);
    const fatalCountRef = useRef(0);
    const [error, setError] = useState<string | null>(null);

    // Keep the latest callbacks behind refs so the hls attach effect
    // doesn't tear down and re-create the player every time the parent
    // re-renders with fresh inline functions. The parent re-renders
    // frequently — every progress mutation, every refetch — and a stable
    // attach is required for hls.js to actually start playback.
    const onRequestRefreshRef = useRef(onRequestRefresh);
    const onProgressRef = useRef(onProgress);
    useEffect(() => {
      onRequestRefreshRef.current = onRequestRefresh;
      onProgressRef.current = onProgress;
    });

    useImperativeHandle(ref, () => ({
      reload: () => onRequestRefreshRef.current(),
    }));

    // Reset fatal counter whenever a new src is in play — a successful
    // re-mint means we're starting over.
    useEffect(() => {
      fatalCountRef.current = 0;
    }, [src]);

    useEffect(() => {
      if (!video || !src || !ready) return;

      setError(null);
      const playSrc = rewriteHlsUrl(src);

      // Prefer hls.js whenever it's supported so the rewriting loader
      // intercepts every fetch (manifest, segments, AES key). Native HLS
      // (Safari) cannot be intercepted — it follows the *absolute* key
      // and segment URIs embedded in the manifest by the backend, which
      // bypasses the dev/reverse proxy and breaks IP-bound token
      // verification (you get `401 playback_ip_mismatch` on the key
      // fetch even though the manifest itself loaded fine).
      if (!Hls.isSupported()) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = playSrc;
          return () => {
            video.removeAttribute('src');
            video.load();
          };
        }
        setError('Your browser does not support HLS playback.');
        return;
      }

      const hls = new Hls({
        // The token is in the URL; no Authorization header needed —
        // backend signs the manifest, segments, and AES-128 key against
        // the same `?t=` query string.
        autoStartLoad: true,
        capLevelToPlayerSize: true,
        // Route manifest, playlists, segments, and the AES-128 key
        // through the same proxy origin as the rest of the API. The
        // backend embeds absolute URLs in the manifest, and the playback
        // token is IP-bound — without this rewrite the key/segments
        // bypass the proxy, the backend sees a different source IP, and
        // every fetch 401s.
        loader: makeRewritingLoader(),
      });
      hlsRef.current = hls;
      hls.loadSource(playSrc);
      hls.attachMedia(video);

      // Bounded to 4 fatals per src — covers transient network drops,
      // playback_ip_mismatch (network swap), playback_token_expired
      // (TTL crossed). After 4 we surface a permanent error rather than
      // loop the re-mint forever.
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        fatalCountRef.current += 1;
        if (fatalCountRef.current > 4) {
          setError('Playback failed. Please refresh the page.');
          return;
        }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          onRequestRefreshRef.current();
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
    }, [video, src, ready]);

    // Progress reporting — bound directly on the underlying <video>. The
    // backend computes completion from the segment watermark, not from
    // this PUT (FRONTEND.md §5.1) — sending `completed: true` is fine but
    // not authoritative; refetch enrollment/curriculum to unlock the next
    // lesson.
    useEffect(() => {
      if (!video) return;
      const flush = () => {
        const now = video.currentTime;
        lastTickRef.current = now;
        onProgressRef.current?.(now, video.duration || 0);
      };
      const onTime = () => {
        const now = video.currentTime;
        if (Math.abs(now - lastTickRef.current) >= 10) {
          lastTickRef.current = now;
          onProgressRef.current?.(now, video.duration || 0);
        }
      };
      const onEnded = () =>
        onProgressRef.current?.(video.duration || 0, video.duration || 0);
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') flush();
      };
      video.addEventListener('timeupdate', onTime);
      video.addEventListener('pause', flush);
      video.addEventListener('ended', onEnded);
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        video.removeEventListener('timeupdate', onTime);
        video.removeEventListener('pause', flush);
        video.removeEventListener('ended', onEnded);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }, [video]);

    const handleVideoElement = useCallback((el: HTMLVideoElement | null) => {
      setVideo(el);
    }, []);

    const upstreamErr = errorLabel ?? null;
    const overlay = upstreamErr ? (
      <div className="absolute inset-0 grid place-items-center px-6 text-center text-white/85">
        <p className="max-w-md text-sm">{upstreamErr}</p>
      </div>
    ) : !ready ? (
      <div className="absolute inset-0 grid place-items-center text-center text-white/85">
        <div>
          <Spinner size="lg" className="text-white" />
          <p className="mt-3 text-sm">Video processing — this can take a minute.</p>
        </div>
      </div>
    ) : error ? (
      <div className="absolute inset-0 grid place-items-center text-center text-white/85">
        <p className="text-sm">{error}</p>
      </div>
    ) : null;

    return (
      <LessonVideoPlayer
        className="rounded-2xl"
        onVideoElement={handleVideoElement}
        overlay={overlay}
        duration={duration}
      />
    );
  },
);

/**
 * Map an ApiError from /lessons/:id/playback to a friendly label.
 *
 * Token / IP errors (playback_ip_mismatch, playback_token_expired, ...) and
 * segment-level checks (segment_skip_blocked, segment_rate_exceeded) are
 * handled implicitly by the HLS-error → re-mint loop in VideoPlayer — they
 * shouldn't reach this function. The two codes the UI handles explicitly
 * are `not_enrolled` and `lesson_video_missing`; everything else falls
 * through to the server's `err.message`.
 */
export function playbackErrorLabel(err: ApiError | null): string | null {
  if (!err) return null;
  switch (err.code) {
    case 'not_enrolled':
      return 'Enroll in this course to watch the lesson.';
    case 'lesson_video_missing':
      return 'The instructor has not uploaded this lesson yet.';
    default:
      return err.message ?? 'Playback failed. Please refresh and try again.';
  }
}
