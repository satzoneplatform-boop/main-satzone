import type { SVGProps } from 'react';

export type IconName =
  | 'play'
  | 'pause'
  | 'volume-up'
  | 'volume-mute'
  | 'check'
  | 'maximize'
  | 'minimize';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  filled?: boolean;
}

export function Icon({ name, size = 20, filled, ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: filled ? 0 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  };

  switch (name) {
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5.5v13l11-6.5-11-6.5Z" />
        </svg>
      );
    case 'pause':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <rect x="6.5" y="5" width="4" height="14" rx="1" />
          <rect x="13.5" y="5" width="4" height="14" rx="1" />
        </svg>
      );
    case 'volume-up':
      return (
        <svg {...common} fill="none">
          <path d="M4 9.5h3l5-4v13l-5-4H4v-5Z" />
          <path d="M16 8.5a4 4 0 0 1 0 7" />
          <path d="M18.5 6a7 7 0 0 1 0 12" />
        </svg>
      );
    case 'volume-mute':
      return (
        <svg {...common} fill="none">
          <path d="M4 9.5h3l5-4v13l-5-4H4v-5Z" />
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common} fill="none">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      );
    case 'maximize':
      return (
        <svg {...common} fill="none">
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
      );
    case 'minimize':
      return (
        <svg {...common} fill="none">
          <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        </svg>
      );
  }
}
