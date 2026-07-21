import { LogoMark } from '@/components/brand/Logo';
import { cn } from '@/lib/cn';

interface CourseThumbnailProps {
  url: string | null | undefined;
  title: string;
  /** Extra classes for the real <img> (hover zooms etc.). */
  imgClassName?: string;
  /** Size of the shield mark in the branded placeholder. */
  markSize?: number;
}

/**
 * Course artwork that never renders as a blank gray box. With a thumbnail it
 * shows the image; without one it falls back to a branded navy panel — the
 * shield/acorn mark over the brand pattern — so catalogs stay on-brand while
 * courses wait for real artwork. Fills its parent; the caller owns the
 * aspect-ratio/size container.
 */
export function CourseThumbnail({
  url,
  title,
  imgClassName,
  markSize = 40,
}: CourseThumbnailProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={title}
        className={cn('h-full w-full object-cover', imgClassName)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={title}
      className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-brand-700"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/25 blur-2xl" aria-hidden />
      <LogoMark size={markSize} variant="white" />
    </div>
  );
}
