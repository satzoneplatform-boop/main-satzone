import { cn } from '@/lib/cn';

type LogoVariant = 'color' | 'white' | 'mono';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  withTagline?: boolean;
  variant?: LogoVariant;
  className?: string;
}

/**
 * SATZONE brand lockup — shield/acorn mark with optional wordmark + tagline.
 *
 * The mark follows the brand guide: a split shield (deep navy / primary blue)
 * cradling a white line-art acorn — "start as an acorn, grow into achievement".
 * Never recolor, stretch, or add effects to the mark itself (brand rule §12).
 */
export function Logo({
  size = 32,
  withWordmark = false,
  withTagline = false,
  variant = 'color',
  className,
}: LogoProps) {
  const wordInk = variant === 'white' ? 'text-white' : 'text-navy-900';
  const zoneInk = variant === 'white' ? 'text-brand-300' : 'text-brand-600';
  const taglineInk = variant === 'white' ? 'text-white/70' : 'text-ink-500';

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} variant={variant} />
      {withWordmark && (
        <span className="flex flex-col justify-center leading-none">
          <span
            className="font-bold tracking-tight"
            style={{ fontSize: Math.round(size * 0.62) }}
          >
            <span className={wordInk}>SAT</span>
            <span className={zoneInk}>ZONE</span>
          </span>
          {withTagline && (
            <span
              className={cn('mt-1 font-medium uppercase tracking-[0.18em]', taglineInk)}
              style={{ fontSize: Math.max(7, Math.round(size * 0.16)) }}
            >
              Master the SAT
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * The bare shield/acorn glyph. `variant`:
 *  - color: split navy/blue shield with white acorn (default, light surfaces)
 *  - white: solid white mark for navy backgrounds
 *  - mono:  single-color (currentColor) — favicons, dense UI
 */
export function LogoMark({
  size = 32,
  variant = 'color',
}: {
  size?: number;
  variant?: LogoVariant;
}) {
  const shieldLeft = variant === 'color' ? '#0D1B3D' : 'transparent';
  const shieldRight = variant === 'color' ? '#2563EB' : 'transparent';
  const stroke =
    variant === 'white' ? '#ffffff' : variant === 'mono' ? 'currentColor' : 'none';
  const acorn = variant === 'color' ? '#ffffff' : variant === 'white' ? '#ffffff' : 'currentColor';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className="block shrink-0"
    >
      {/* Shield body — split fill for the color variant. */}
      <defs>
        <clipPath id="satzone-shield-clip">
          <path d="M24 3.5l16.5 5.6v14.4c0 11.5-7.4 18.9-16.5 22.5C14.9 42.4 7.5 35 7.5 23.5V9.1z" />
        </clipPath>
      </defs>

      {variant === 'color' ? (
        <g clipPath="url(#satzone-shield-clip)">
          <rect x="0" y="0" width="24" height="48" fill={shieldLeft} />
          <rect x="24" y="0" width="24" height="48" fill={shieldRight} />
        </g>
      ) : null}

      <path
        d="M24 3.5l16.5 5.6v14.4c0 11.5-7.4 18.9-16.5 22.5C14.9 42.4 7.5 35 7.5 23.5V9.1z"
        fill="none"
        stroke={stroke}
        strokeWidth={variant === 'color' ? 0 : 2.4}
        strokeLinejoin="round"
      />

      {/* Acorn — cap, body, and a small sprout stem. */}
      <g
        fill="none"
        stroke={acorn}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* sprout */}
        <path d="M24 12.4v-3.1" />
        <path d="M24 10.2c1.9-.6 3.4-.2 4.2 1.1-1.7.8-3.3.5-4.2-1.1z" fill={acorn} stroke="none" />
        {/* cap */}
        <path d="M17 18.6c0-2 3.1-3.5 7-3.5s7 1.5 7 3.5c0 .9-.8 1.4-2 1.4H19c-1.2 0-2-.5-2-1.4z" />
        {/* body */}
        <path d="M18.8 20.6c.4 4.2 2.4 8.4 5.2 10.2 2.8-1.8 4.8-6 5.2-10.2" />
      </g>
    </svg>
  );
}
