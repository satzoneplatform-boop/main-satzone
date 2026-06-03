import { BookmarkIcon } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import type { CourseDetail } from '@/types/api';

interface CourseHeroProps {
  course: CourseDetail;
  saved?: boolean;
  onToggleSave?: () => void;
}

/**
 * Dark hero at the top of the course detail page. When the course has
 * a `thumbnail_url`, it's used as the background image with a dark
 * overlay so the title/subtitle stay readable. Otherwise we fall back
 * to the navy gradient + grid pattern.
 */
export function CourseHero({ course, saved = false, onToggleSave }: CourseHeroProps) {
  const inst = course.instructor;
  const hasImage = Boolean(course.thumbnail_url);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl px-8 py-10 text-white',
        !hasImage && 'bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900',
      )}
    >
      {hasImage ? (
        <>
          <img
            src={course.thumbnail_url ?? undefined}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dark overlay so the foreground text stays readable. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-ink-900/85 via-ink-900/65 to-ink-900/40"
          />
        </>
      ) : (
        <BackdropPattern />
      )}

      <div className="relative flex items-start justify-between gap-6">
        <div className="max-w-2xl">
          {inst && (
            <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2 py-1 text-xs font-medium backdrop-blur">
              <Avatar src={inst.avatar_url} name={inst.full_name} size={20} />
              {inst.full_name}
            </span>
          )}
          {course.tags?.[0] && (
            <span className="ml-2 rounded-md bg-white/10 px-2 py-1 text-xs font-medium backdrop-blur">
              {course.tags[0]}
            </span>
          )}
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
            {course.title}
          </h1>
          {course.subtitle && (
            <p className="mt-3 max-w-xl text-sm text-white/80">{course.subtitle}</p>
          )}
        </div>

        {onToggleSave && (
          <button
            type="button"
            onClick={onToggleSave}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from saved' : 'Save course'}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
          >
            <BookmarkIcon className={saved ? 'fill-white' : ''} />
          </button>
        )}
      </div>
    </section>
  );
}

function BackdropPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="course-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="800" height="400" fill="url(#course-grid)" />
    </svg>
  );
}
