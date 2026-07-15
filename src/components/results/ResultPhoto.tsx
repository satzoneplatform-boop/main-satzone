import { useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Student photo with a smooth load-in: a shimmering placeholder shows until the
 * image decodes, then the image fades + scales into place. Lazy-loaded and
 * hover-zoomable (the parent adds `group` + hover class). Falls back to a
 * gradient monogram if the image is missing or fails.
 */
export function ResultPhoto({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-brand-50', className)}>
      {!loaded && !failed && <div className="skeleton-shimmer absolute inset-0" aria-hidden />}
      {failed ? (
        <div
          aria-hidden
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-100 to-accent-100 text-3xl font-bold text-brand-500"
        >
          {alt.trim().charAt(0).toUpperCase() || '★'}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover transition-[transform,opacity,filter] duration-700 [transition-timing-function:var(--ease-brand)]',
            loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-sm',
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
