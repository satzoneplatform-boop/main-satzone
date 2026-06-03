import { cn } from '@/lib/cn';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * SATZone mark — purple rounded square containing a stylized "+" cross.
 * The wordmark sits to the right when `withWordmark` is true.
 */
export function Logo({ size = 32, withWordmark = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      {withWordmark && (
        <span
          className="text-ink-900 font-semibold tracking-tight"
          style={{ fontSize: Math.round(size * 0.6) }}
        >
          SATZone
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="block"
    >
      <rect width="32" height="32" rx="9" fill="#4F39F6" />
      <path
        d="M16 8.5c.83 0 1.5.67 1.5 1.5v3.5H21c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3.5V20c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-3.5H11c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h3.5V10c0-.83.67-1.5 1.5-1.5Z"
        fill="white"
      />
      <circle cx="9.5" cy="9.5" r="1.2" fill="white" opacity=".85" />
      <circle cx="22.5" cy="9.5" r="1.2" fill="white" opacity=".85" />
      <circle cx="9.5" cy="22.5" r="1.2" fill="white" opacity=".85" />
      <circle cx="22.5" cy="22.5" r="1.2" fill="white" opacity=".85" />
    </svg>
  );
}
