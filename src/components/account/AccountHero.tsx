/**
 * Decorative landscape banner shown at the top of the Account & Settings page.
 * Built as layered SVG so we don't depend on a hosted image asset.
 */
export function AccountHero() {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-amber-100 via-orange-200 to-rose-300">
      <svg
        viewBox="0 0 800 192"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#7C3AED" stopOpacity="0.55" />
            <stop offset="80%" stopColor="#FB923C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        </defs>

        <rect width="800" height="192" fill="url(#sky)" />
        <circle cx="220" cy="60" r="22" fill="#FFF8E7" opacity="0.85" />
        <path
          d="M0 145 L120 70 L210 110 L300 60 L420 130 L520 90 L640 140 L800 100 L800 192 L0 192 Z"
          fill="url(#m1)"
          opacity="0.85"
        />
        <path
          d="M0 165 L100 110 L190 145 L320 105 L460 155 L600 125 L800 150 L800 192 L0 192 Z"
          fill="url(#m2)"
          opacity="0.9"
        />
        <path
          d="M0 178 L160 150 L280 168 L460 152 L640 170 L800 162 L800 192 L0 192 Z"
          fill="url(#m3)"
          opacity="0.95"
        />
        <path
          d="M0 188 L800 188 L800 192 L0 192 Z"
          fill="#1E293B"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
