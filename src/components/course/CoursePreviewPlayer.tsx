import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { rewriteHlsUrl } from '@/lib/hls';

interface CoursePreviewPlayerProps {
  /** HLS manifest URL from CourseDetail.preview_playback_url. */
  src: string;
  /** Image shown before the user hits play. */
  poster?: string | null;
  /** Accessible label for screen readers. */
  title?: string;
}

/**
 * Lightweight HLS player for the course-detail preview clip.
 *
 * Smaller than the lesson player — no token re-mint loop, no progress
 * reporting, no custom chrome. Just `<video controls>` with hls.js (or
 * native HLS on Safari) wired up, plus URL rewriting so IP-bound preview
 * tokens stay aligned with the API proxy origin.
 *
 * On any fatal HLS error we fall back to the poster image so the card
 * isn't blank — preview failures shouldn't dominate the page.
 */
export function CoursePreviewPlayer({
  src,
  poster,
  title,
}: CoursePreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setFailed(false);
    const playSrc = rewriteHlsUrl(src);

    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: true });
      hls.loadSource(playSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setFailed(true);
          hls.destroy();
        }
      });
      return () => hls.destroy();
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playSrc;
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    setFailed(true);
  }, [src]);

  if (failed && poster) {
    return (
      <img
        src={poster}
        alt={title ?? ''}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      poster={poster ?? undefined}
      playsInline
      aria-label={title}
      className="h-full w-full bg-ink-900 object-cover"
    />
  );
}
