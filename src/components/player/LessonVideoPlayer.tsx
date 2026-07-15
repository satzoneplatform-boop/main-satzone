import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Check,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '../../lib/format';

interface Props {
  className?: string;
  onVideoElement?: (el: HTMLVideoElement | null) => void;
  hidden?: boolean;
  overlay?: ReactNode;
  // Authoritative duration in seconds (e.g. total_segments × segment_seconds
  // from /lessons/{id}/playback). For sliding HLS manifests, <video>.duration
  // reflects only the buffered window — pass this to render the real total.
  duration?: number | null;
}

// Capped at 2× per FRONTEND.md §5.1: the backend rejects segment fetches
// faster than STREAM_MAX_RATE_MULTIPLIER (default 2).
const PLAYBACK_RATES = [1, 1.25, 1.5, 2];

function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const total = Math.floor(secs);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function LessonVideoPlayer({
  className,
  onVideoElement,
  hidden,
  overlay,
  duration: durationProp,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seekTrackRef = useRef<HTMLDivElement | null>(null);
  // Mutable handle to the <video> element for imperative writes
  // (volume/mute/rate/seek). Mirrors the `videoEl` state, which exists
  // only to drive effects and rendering.
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const lastTimeRef = useRef(0);
  const scrubbingRef = useRef(false);
  const onVideoElementRef = useRef(onVideoElement);
  useEffect(() => {
    onVideoElementRef.current = onVideoElement;
  });

  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [lastMove, setLastMove] = useState(() => Date.now());

  const handleRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    setVideoEl(el);
    // Sync UI state from the element's current properties as soon as it
    // mounts (event-driven, rather than synchronously inside an effect).
    if (el) {
      setVideoDuration(Number.isFinite(el.duration) ? el.duration : 0);
      setVolume(el.volume);
      setMuted(el.muted);
      setRate(el.playbackRate);
      setIsPlaying(!el.paused);
    }
    onVideoElementRef.current?.(el);
  }, []);

  useEffect(() => {
    if (!videoEl) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoaded = () =>
      setVideoDuration(
        Number.isFinite(videoEl.duration) ? videoEl.duration : 0,
      );
    const onTime = () => {
      // While the user is actively scrubbing, the pointer drives the
      // displayed position (seekTo updates it optimistically). Ignoring the
      // element's lagging currentTime here keeps the bar glued to the
      // pointer instead of snapping back to the pre-seek position.
      if (scrubbingRef.current) return;
      setCurrentTime(videoEl.currentTime);
      lastTimeRef.current = videoEl.currentTime;
    };
    const onVol = () => {
      setVolume(videoEl.volume);
      setMuted(videoEl.muted);
    };
    // Defensive cap at 2× — backend rejects faster segment fetches.
    const onRate = () => {
      if (videoEl.playbackRate > 2) {
        videoEl.playbackRate = 2;
        return;
      }
      setRate(videoEl.playbackRate);
    };

    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPause);
    videoEl.addEventListener('loadedmetadata', onLoaded);
    videoEl.addEventListener('durationchange', onLoaded);
    videoEl.addEventListener('timeupdate', onTime);
    videoEl.addEventListener('volumechange', onVol);
    videoEl.addEventListener('ratechange', onRate);

    return () => {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      videoEl.removeEventListener('loadedmetadata', onLoaded);
      videoEl.removeEventListener('durationchange', onLoaded);
      videoEl.removeEventListener('timeupdate', onTime);
      videoEl.removeEventListener('volumechange', onVol);
      videoEl.removeEventListener('ratechange', onRate);
    };
  }, [videoEl]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Auto-hide controls during playback. Always visible when paused or
  // when a menu is open.
  const idle = isPlaying && !showSpeedMenu;
  useEffect(() => {
    if (!idle) return;
    const t = window.setTimeout(() => setLastMove(0), 2500);
    return () => window.clearTimeout(t);
  }, [idle, lastMove]);
  const showControls = !idle || lastMove !== 0;

  useEffect(() => {
    if (!showSpeedMenu) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const menu = document.getElementById('lesson-player-speed-menu');
      if (menu && !menu.contains(target)) setShowSpeedMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showSpeedMenu]);

  function play() {
    videoElRef.current?.play().catch((err) => {
      console.error('[lesson-player] video.play() rejected:', err);
    });
  }
  function togglePlay() {
    const el = videoElRef.current;
    if (!el) return;
    if (el.paused)
      el.play().catch((err) => {
        console.error('[lesson-player] video.play() rejected:', err);
      });
    else el.pause();
  }
  function toggleMute() {
    const el = videoElRef.current;
    if (!el) return;
    el.muted = !el.muted;
    if (!el.muted && el.volume === 0) el.volume = 0.5;
  }
  function setPlayerVolume(v: number) {
    const el = videoElRef.current;
    if (!el) return;
    el.volume = v;
    el.muted = v === 0;
  }
  function setPlayerRate(r: number) {
    const el = videoElRef.current;
    if (!el) return;
    el.playbackRate = r;
  }
  // Free seeking in both directions. The backend's segment-rate limiter
  // (FRONTEND.md §5.1) still throttles excessive scrubbing — if it kicks
  // in, hls.js surfaces a fatal NETWORK_ERROR and VideoPlayer re-mints
  // the token via its standard refresh path.
  function seekTo(t: number) {
    const el = videoElRef.current;
    if (!el || !Number.isFinite(t)) return;
    const max = Number.isFinite(el.duration) ? el.duration : t;
    const clamped = Math.max(0, Math.min(max, t));
    el.currentTime = clamped;
    // Reflect the new position immediately so clicks/drags seek accurately
    // and the bar stays synced even before the element emits `timeupdate`
    // (an HLS seek into an unbuffered region can delay that event).
    setCurrentTime(clamped);
  }

  // Pointer-based scrubbing on the progress track. We avoid a native
  // <input type="range"> because its controlled `value` prop fights an
  // active drag — the thumb jumps around as React re-renders. With
  // pointer capture we get smooth click-and-drag on any pointer (mouse,
  // touch, pen) and the drag survives the cursor leaving the bar.
  function pctFromClientX(clientX: number): number {
    const el = seekTrackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }
  function onScrubStart(e: React.PointerEvent) {
    if (!videoElRef.current || duration <= 0) return;
    scrubbingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seekTo(pctFromClientX(e.clientX) * duration);
  }
  function onScrubMove(e: React.PointerEvent) {
    if (!scrubbingRef.current) return;
    seekTo(pctFromClientX(e.clientX) * duration);
  }
  function onScrubEnd(e: React.PointerEvent) {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may already be released */
    }
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function bumpActivity() {
    setLastMove(Date.now());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const el = videoElRef.current;
    if (!el) return;
    const dur = el.duration;
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlay();
    } else if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekTo(el.currentTime - 5);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekTo(el.currentTime + 5);
    } else if (e.key === 'Home') {
      e.preventDefault();
      seekTo(0);
    } else if (e.key === 'End' && Number.isFinite(dur)) {
      e.preventDefault();
      seekTo(dur);
    } else if (/^[0-9]$/.test(e.key) && Number.isFinite(dur)) {
      e.preventDefault();
      seekTo((Number(e.key) / 10) * dur);
    }
  }

  // Prefer the authoritative duration over <video>.duration (which lies
  // for sliding HLS manifests).
  const duration =
    durationProp != null && durationProp > 0 ? durationProp : videoDuration;

  // Reaching the end fires `ended` but NOT `pause`, so without this the UI
  // stays stuck "playing": the Play button keeps showing Pause and the
  // resume overlay never returns. Reset to the initial (paused) state and
  // pin the clock to the full duration so the timer stops there and the
  // progress bar sits at exactly 100%. Depends on `duration` so the pin
  // uses the authoritative total once it's known.
  useEffect(() => {
    if (!videoEl) return;
    const onEnded = () => {
      setIsPlaying(false);
      if (duration > 0) setCurrentTime(duration);
    };
    videoEl.addEventListener('ended', onEnded);
    return () => videoEl.removeEventListener('ended', onEnded);
  }, [videoEl, duration]);

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const showChrome = !overlay && !hidden;
  const isMuted = muted || volume === 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black aspect-video overflow-hidden select-none group/player',
        'outline-none',
        className,
      )}
      onPointerMove={bumpActivity}
      onPointerDown={bumpActivity}
      onPointerLeave={() => isPlaying && setLastMove(0)}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      tabIndex={0}
    >
      <video
        ref={handleRef}
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        onClick={() => showChrome && togglePlay()}
        className={cn(
          'h-full w-full',
          hidden && 'opacity-0',
          isPlaying ? 'cursor-default' : 'cursor-pointer',
        )}
      />

      {overlay}

      {showChrome && !isPlaying && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            play();
          }}
          aria-label="Play"
          className={cn(
            'absolute inset-0 grid place-items-center',
            'transition-opacity duration-200',
            'animate-fade-in',
          )}
        >
          <span
            className={cn(
              'grid place-items-center w-16 h-16 rounded-full',
              'bg-white/15 backdrop-blur-md',
              'ring-1 ring-white/30',
              'shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
              'transition-transform duration-200',
              'group-hover/player:scale-110 group-hover/player:bg-white/25',
            )}
          >
            <Play
              className="text-white drop-shadow"
              size={28}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
          </span>
        </button>
      )}

      {showChrome && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-10',
            'transition-all duration-300 ease-out',
            'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
            'px-4 sm:px-5 pt-14 pb-3',
            showControls
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={seekTrackRef}
            role="slider"
            aria-label="Lesson progress"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, Math.floor(duration))}
            aria-valuenow={Math.floor(currentTime)}
            aria-disabled={duration <= 0}
            onPointerDown={onScrubStart}
            onPointerMove={onScrubMove}
            onPointerUp={onScrubEnd}
            onPointerCancel={onScrubEnd}
            className={cn(
              'relative h-3 mb-2 flex items-center group/seek touch-none',
              duration > 0 ? 'cursor-pointer' : 'cursor-default',
            )}
          >
            <div className="relative h-1 w-full bg-white/15 rounded-full overflow-visible">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full',
                  'bg-gradient-to-r from-brand-400 to-brand-500',
                )}
                style={{ width: `${progressPct}%` }}
              />
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
                  'w-3 h-3 rounded-full bg-white',
                  'ring-2 ring-brand-500/60',
                  'opacity-0 group-hover/seek:opacity-100 transition-opacity',
                )}
                style={{ left: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className={cn(
                'grid place-items-center w-9 h-9 rounded-full',
                'bg-white/0 hover:bg-white/15 active:bg-white/20',
                'transition',
              )}
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" strokeWidth={0} aria-hidden />
              ) : (
                <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden />
              )}
            </button>

            <div className="text-xs tabular-nums select-none">
              <span>{formatTime(currentTime)}</span>
              <span className="opacity-50 mx-1.5">/</span>
              <span className="opacity-70">{formatTime(duration)}</span>
            </div>

            <div className="ml-1 flex items-center group/vol">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className={cn(
                  'grid place-items-center w-9 h-9 rounded-full',
                  'hover:bg-white/15 active:bg-white/20 transition',
                )}
              >
                {isMuted ? (
                  <VolumeX size={18} aria-hidden />
                ) : (
                  <Volume2 size={18} aria-hidden />
                )}
              </button>
              <div
                className={cn(
                  'overflow-hidden hidden sm:block',
                  'w-0 group-hover/vol:w-[88px] focus-within:w-[88px]',
                  'transition-[width] duration-200 ease-out',
                )}
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setPlayerVolume(Number(e.target.value))}
                  aria-label="Volume"
                  className={cn(
                    'w-20 mx-2 appearance-none bg-transparent cursor-pointer',
                    '[&::-webkit-slider-runnable-track]:h-1',
                    '[&::-webkit-slider-runnable-track]:rounded-full',
                    '[&::-webkit-slider-runnable-track]:bg-white/25',
                    '[&::-webkit-slider-thumb]:appearance-none',
                    '[&::-webkit-slider-thumb]:w-3',
                    '[&::-webkit-slider-thumb]:h-3',
                    '[&::-webkit-slider-thumb]:rounded-full',
                    '[&::-webkit-slider-thumb]:bg-white',
                    '[&::-webkit-slider-thumb]:-mt-1',
                    '[&::-webkit-slider-thumb]:shadow',
                    '[&::-moz-range-track]:h-1',
                    '[&::-moz-range-track]:rounded-full',
                    '[&::-moz-range-track]:bg-white/25',
                    '[&::-moz-range-thumb]:w-3',
                    '[&::-moz-range-thumb]:h-3',
                    '[&::-moz-range-thumb]:rounded-full',
                    '[&::-moz-range-thumb]:bg-white',
                    '[&::-moz-range-thumb]:border-0',
                  )}
                />
              </div>
            </div>

            <div className="flex-1" />

            <div className="relative" id="lesson-player-speed-menu">
              <button
                type="button"
                onClick={() => setShowSpeedMenu((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={showSpeedMenu}
                aria-label="Playback speed"
                className={cn(
                  'h-9 px-3 min-w-[48px] rounded-full',
                  'bg-white/10 hover:bg-white/20 active:bg-white/25',
                  'text-xs font-semibold tabular-nums',
                  'transition',
                )}
              >
                {rate}×
              </button>
              {showSpeedMenu && (
                <div
                  role="menu"
                  className={cn(
                    'absolute bottom-full right-0 mb-2 min-w-[140px]',
                    'rounded-xl bg-ink-900/95 backdrop-blur-md',
                    'ring-1 ring-white/10 shadow-modal',
                    'py-1 origin-bottom-right animate-scale-in z-20',
                  )}
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-white/50">
                    Playback speed
                  </div>
                  {PLAYBACK_RATES.map((r) => (
                    <button
                      key={r}
                      role="menuitemradio"
                      aria-checked={r === rate}
                      onClick={() => {
                        setPlayerRate(r);
                        setShowSpeedMenu(false);
                      }}
                      className={cn(
                        'w-full px-3 py-1.5 flex items-center justify-between gap-3',
                        'text-sm text-white/90',
                        'hover:bg-white/10',
                        r === rate && 'text-brand-300',
                      )}
                    >
                      <span className="tabular-nums">
                        {r === 1 ? 'Normal' : `${r}×`}
                      </span>
                      {r === rate && <Check size={14} aria-hidden />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className={cn(
                'grid place-items-center w-9 h-9 rounded-full',
                'hover:bg-white/15 active:bg-white/20 transition',
              )}
            >
              {isFullscreen ? (
                <Minimize size={18} aria-hidden />
              ) : (
                <Maximize size={18} aria-hidden />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
