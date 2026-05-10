import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function EyeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" width={20} height={20} aria-hidden {...props}>
      <path
        d="M10 4.5c-4 0-7 3-8.25 5.5C3 12.5 6 15.5 10 15.5s7-3 8.25-5.5C17 7 14 4.5 10 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" width={20} height={20} aria-hidden {...props}>
      <path
        d="M3.5 3.5l13 13M8 5c.7-.3 1.4-.5 2-.5 4 0 7 3 8.25 5.5-.45.93-1.2 2.05-2.2 3.05M5.45 6.45C2.95 7.95 1.75 10 1.75 10c1.25 2.5 4.25 5.5 8.25 5.5 1.4 0 2.7-.37 3.85-.95"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11.5 11.5a2 2 0 1 1-3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckCircleFilled(props: IconProps & { color?: 'success' | 'muted' }) {
  const { color = 'success', ...rest } = props;
  const fill = color === 'success' ? '#22C55E' : '#90A1B9';
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden {...rest}>
      <circle cx="8" cy="8" r="8" fill={fill} />
      <path d="M5 8.4l2 2 4-4.4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function XCircleFilled(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden {...props}>
      <circle cx="8" cy="8" r="8" fill="#90A1B9" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} aria-hidden {...props}>
      <path d="M19.6 10.23c0-.69-.06-1.36-.18-2H10v3.78h5.4a4.62 4.62 0 0 1-2 3.03v2.51h3.24c1.9-1.75 2.96-4.32 2.96-7.32Z" fill="#4285F4" />
      <path d="M10 20c2.7 0 4.96-.9 6.62-2.45L13.4 15.04c-.9.6-2.04.95-3.4.95-2.6 0-4.81-1.76-5.6-4.13H1.07v2.6A10 10 0 0 0 10 20Z" fill="#34A853" />
      <path d="M4.4 11.86A6 6 0 0 1 4.08 10c0-.65.11-1.28.32-1.86V5.54H1.07a10 10 0 0 0 0 8.92l3.33-2.6Z" fill="#FBBC05" />
      <path d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.86-2.85A10 10 0 0 0 1.07 5.54l3.33 2.6C5.19 5.72 7.4 3.96 10 3.96Z" fill="#EA4335" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="none" aria-hidden {...props}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" aria-hidden {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function LoginIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M11 4h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 10h9m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M9 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 10H8m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="m17 17-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M5 8a5 5 0 0 1 10 0v3l1.5 2.5h-13L5 11V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M3 9.2 10 3l7 6.2V16a1 1 0 0 1-1 1h-3v-5H8v5H4a1 1 0 0 1-1-1V9.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M4 4h7a3 3 0 0 1 3 3v9a2 2 0 0 0-2-2H4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 4h-1a2 2 0 0 0-2 2v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function PathIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="15" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 7v3a3 3 0 0 0 3 3h4a3 3 0 0 1 3 3v-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M3 11h4l1 2h4l1-2h4v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 11l1.5-6h11L17 11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M5 3h10v14l-5-3-5 3V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function LightbulbIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M7 14a5 5 0 1 1 6 0v2H7v-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14" r=".75" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="currentColor" aria-hidden {...props}>
      <path d="M6.5 4.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M4 10h12m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="m12 5-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h14M7 3v4M13 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="m4 10 4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M10 3v10m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 15v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M5 3v15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M5 4h9.5l-2 2.5L14.5 9H5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PaperPlaneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" aria-hidden {...props}>
      <path
        d="M21 3 11 14M21 3l-7 18-3-7-7-3 16-8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CreditCardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <rect x="2.5" y="5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 9h15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 12.5h2M9 12.5h1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function PaypalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path
        d="M7.5 4h5.2c2.2 0 3.6 1.4 3.1 3.5-.6 2.5-2.5 3.7-5 3.7H9.2L8.4 16H6L7.5 4Z"
        fill="#003087"
      />
      <path
        d="M9 11.2h1.7c2.5 0 4.4-1.2 5-3.7.5-2.1-.9-3.5-3.1-3.5H7.4L5.9 16h2.4l.7-4.8Z"
        fill="#0070BA"
      />
      <path d="M9.7 11.2H8.5L9 7.6h2.7c1.4 0 2.4.6 2.1 2-.3 1.4-1.6 1.6-3 1.6H9.7Z" fill="#001F66" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="6.5" r=".75" fill="currentColor" />
    </svg>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <rect x="3" y="9" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h14M10 9v9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M7 9c-2 0-2.5-3 0-3 1.5 0 2.5 1.5 3 3M13 9c2 0 2.5-3 0-3-1.5 0-2.5 1.5-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PanelLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v14" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" aria-hidden {...props}>
      <path d="M3 6h14M5 10h10M8 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width={20} height={20} aria-hidden {...props}>
      <path d="m10 2.5 2.4 4.86 5.36.78-3.88 3.78.92 5.34L10 14.74l-4.8 2.52.92-5.34L2.24 8.14l5.36-.78L10 2.5Z" />
    </svg>
  );
}
