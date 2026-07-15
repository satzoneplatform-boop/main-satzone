import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Living backdrop for the auth marketing panel. Layered behind the content:
 *  - a slowly drifting tiled shield pattern (CSS, 120s) with a subtle
 *    cursor parallax (max 8px, desktop pointers only, rAF-throttled)
 *  - a soft blue→purple aurora glow that breathes (reuses .lp-mesh / .lp-orb)
 *  - faint particles rising slowly (reuses .lp-particle)
 *
 * All motion is transform/opacity only. Under prefers-reduced-motion the CSS
 * animations are frozen by the global guard and particles/parallax are skipped.
 */

/** Deterministic particle field (no Math.random → stable across renders). */
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const left = (i * 61.8) % 100; // golden-ratio spread across the width
  const size = 2 + (i % 4); // 2–5px
  const duration = 14 + ((i * 7) % 12); // 14–25s
  const delay = (i * 1.7) % 14; // staggered starts
  return { left, size, duration, delay };
});

export function AnimatedBackdrop() {
  const reduce = useReducedMotion();
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    // Desktop fine-pointer only — skip on touch/coarse devices.
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = parallaxRef.current;
    if (!el) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    const apply = () => {
      raf = 0;
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    };
    const onMove = (e: PointerEvent) => {
      // Map cursor position to a −8..8px offset on each axis.
      tx = (e.clientX / window.innerWidth - 0.5) * 2 * 8;
      ty = (e.clientY / window.innerHeight - 0.5) * 2 * 8;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Aurora: moving mesh gradient + one breathing blue→purple orb. */}
      <div className="lp-mesh absolute inset-0 opacity-70" />
      <div
        className="lp-orb lp-orb--b lp-breathe absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgb(59 130 246 / 0.16) 0%, rgb(107 70 229 / 0.10) 45%, transparent 70%)',
        }}
      />

      {/* Parallax wrapper (JS transform) → drifting tiled pattern (CSS transform). */}
      <div ref={parallaxRef} className="absolute inset-0 will-change-transform">
        <div className="auth-pattern-drift bg-brand-pattern opacity-[0.55]" />
      </div>

      {/* Rising particles. */}
      {!reduce &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="lp-particle"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
    </div>
  );
}
