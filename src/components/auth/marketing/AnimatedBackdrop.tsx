import { useReducedMotion } from 'motion/react';

/**
 * Living backdrop for the auth marketing panel. Layered behind the content:
 *  - a soft blue→purple aurora glow that breathes (reuses .lp-mesh / .lp-orb)
 *  - faint particles rising slowly (reuses .lp-particle)
 *
 * All motion is transform/opacity only. Under prefers-reduced-motion the CSS
 * animations are frozen by the global guard and particles are skipped.
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
