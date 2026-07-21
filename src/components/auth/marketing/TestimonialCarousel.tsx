import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { StarIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';
import { testimonials } from './testimonials';

interface TestimonialCarouselProps {
  /** Auto-advance interval, ms. */
  interval?: number;
}

/**
 * Auto-rotating review carousel. Advances every `interval` and on click/tap
 * anywhere on the card (no visible controls) — each advance restarts the
 * timer. The next quote slides in from the right while the old one slides out
 * left, so slides visibly replace each other. Pauses only when the tab is
 * hidden or the card is scrolled off-screen.
 *
 * Fixed height + line-clamp keep the card from reflowing between quotes.
 * Swipe and arrow keys navigate both ways; Enter/Space advance. Under reduced
 * motion auto-advance stops and manual navigation swaps without animation.
 */
export function TestimonialCarousel({ interval = 2000 }: TestimonialCarouselProps) {
  const t = useT();
  const reduce = useReducedMotion();
  const count = testimonials.length;

  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  const figureRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  // A handled swipe still ends in a click on the same element — eat that click
  // so one gesture doesn't advance twice.
  const suppressClick = useRef(false);

  const go = useCallback(
    (next: number) => setIndex((next + count) % count),
    [count],
  );

  // Pause when the tab is hidden.
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Pause when the card is scrolled off-screen.
  useEffect(() => {
    const el = figureRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance, unless blocked. `index` in the deps restarts the timer on
  // every change, so a manual advance always gets a full interval before the
  // next automatic one.
  useEffect(() => {
    if (reduce || !inView || !tabVisible || count <= 1) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      interval,
    );
    return () => window.clearInterval(id);
  }, [reduce, inView, tabVisible, count, interval, index]);

  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    go(index + 1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      suppressClick.current = true;
      go(index + (dx < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  };

  const current = testimonials[index];

  return (
    <figure
      ref={figureRef}
      role="group"
      aria-roledescription="carousel"
      aria-label={t('landing.testimonials.title')}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative cursor-pointer select-none rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
    >
      {/* Fixed-height stage so quotes of different lengths never reflow. Sized
          tight to the content (stars + 2-line quote + caption) — no dead gap.
          overflow-hidden clips the outgoing/incoming slides mid-push. */}
      <div className="relative h-[104px] overflow-hidden">
        {/* No `mode` on purpose: enter and exit run together, so the incoming
            slide pushes the outgoing one out instead of waiting for it. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={current.id}
            initial={reduce ? false : { opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -48 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex gap-0.5 text-warn-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                  key={i}
                  className={`size-3.5 ${i < current.stars ? '' : 'text-white/20'}`}
                />
              ))}
            </div>

            <blockquote
              aria-live="polite"
              className="mt-2 line-clamp-2 text-sm italic leading-snug text-white/85"
            >
              “{t(current.quoteKey)}”
            </blockquote>

            <figcaption className="mt-2.5 flex items-center gap-2.5">
              {current.avatarUrl ? (
                <img
                  src={current.avatarUrl}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-500/20 text-[11px] font-bold text-brand-200">
                  {current.initials}
                </span>
              )}
              <div className="text-xs">
                <p className="font-semibold text-white">{t(current.nameKey)}</p>
                <p className="text-white/50">
                  SAT {current.score} · {t(current.cityKey)}
                </p>
              </div>
            </figcaption>
          </motion.div>
        </AnimatePresence>
      </div>
    </figure>
  );
}
