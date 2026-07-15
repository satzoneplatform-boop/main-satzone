import { useState } from 'react';
import { CountUp } from '@/components/motion';
import { useT } from '@/i18n/I18nProvider';
import { instructor, stats } from './config';

/**
 * Instructor social-proof card — the panel's focal point. A large parallelogram
 * portrait (clip-path, so the photo isn't distorted) with an offset accent
 * behind it for depth, plus name/promise and a count-up stat row. All copy
 * comes from i18n keys and all numbers from config.
 */

/** Right-leaning parallelogram; shared by the photo and the accent behind it. */
const PARALLELOGRAM = 'polygon(16% 0%, 100% 0%, 84% 100%, 0% 100%)';

export function InstructorCard() {
  const t = useT();
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(instructor.photoUrl) && !photoFailed;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.14] to-white/[0.04] p-5 shadow-[0_24px_70px_-24px_rgba(37,99,235,0.55)] backdrop-blur-md">
      <span className="inline-flex items-center rounded-full bg-brand-500/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-100">
        {t('auth.brand.instructor.label')}
      </span>

      <div className="mt-4 flex items-center gap-5">
        {/* Parallelogram portrait — photo with initials fallback. Large so it's
            the first thing the eye lands on. */}
        <div className="relative h-56 w-44 shrink-0">
          {/* Soft glow behind the whole shape. */}
          <div
            className="absolute -inset-4 opacity-75 blur-2xl"
            style={{ background: 'radial-gradient(circle, rgb(59 130 246 / 0.55), transparent 70%)' }}
            aria-hidden
          />
          {/* Offset accent parallelogram → colored edge / depth. */}
          <div
            className="absolute inset-0 translate-x-2.5 translate-y-2.5"
            style={{ clipPath: PARALLELOGRAM, background: 'linear-gradient(160deg, #3B82F6, #6B46E5)' }}
            aria-hidden
          />
          {showPhoto ? (
            <img
              src={instructor.photoUrl}
              alt={t(instructor.photoAltKey)}
              onError={() => setPhotoFailed(true)}
              className="relative block h-full w-full object-cover"
              style={{ clipPath: PARALLELOGRAM }}
            />
          ) : (
            <div
              className="relative grid h-full w-full place-items-center bg-gradient-to-br from-brand-500/50 to-[#6B46E5]/50 text-5xl font-bold text-white"
              style={{ clipPath: PARALLELOGRAM }}
              role="img"
              aria-label={t(instructor.photoAltKey)}
            >
              {instructor.initials}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold leading-tight text-white">{t(instructor.nameKey)}</p>
          <p className="mt-1.5 text-sm font-medium text-brand-200">{t(instructor.roleKey)}</p>
          <p className="mt-2.5 text-sm leading-snug text-white/80">{t(instructor.promiseKey)}</p>
        </div>
      </div>

      {/* Stat row — count-up on first view (IntersectionObserver, once). */}
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
        {stats.map((s) => (
          <div key={s.labelKey} className="text-center">
            <dd className="text-2xl font-bold text-white">
              <CountUp to={s.to} suffix={s.suffix} />
            </dd>
            <dt className="mt-1 text-xs leading-tight text-white/60">{t(s.labelKey)}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
