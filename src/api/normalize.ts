/**
 * Backend → frontend response normalization.
 *
 * The backend (Edure FastAPI) uses different field names and shapes for some
 * resources than the frontend types declare. Rather than touching every
 * component that reads `course.rating` / `instructor.full_name`, we normalize
 * payloads at the API-client edge so the rest of the app keeps working
 * against `@/types/api`.
 *
 * Mapping reference (backend → frontend):
 *  - CourseSummary.rating_avg (string) → rating (number)
 *  - CourseSummary.ratings_count       → reviews_count
 *  - CourseSummary.enrollments_count   → students_count
 *  - CourseSummary.lectures_count      → lessons_count
 *  - InstructorSummary.name            → full_name
 *  - InstructorSummary.title           → headline
 *  - InstructorSummary.rating_avg      → rating (number)
 *  - InstructorRead also flattened the same way.
 */

import type {
  CourseDetail,
  CourseSummary,
  EnrollmentRead,
  HomeFeed,
  InstructorRead,
  InstructorSummary,
  LessonSummary,
  Page,
  ReviewRead,
  WishlistItemRead,
} from '@/types/api';

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string') {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** Backend instructor → frontend InstructorSummary. */
export function normalizeInstructorSummary(raw: unknown): InstructorSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    slug: String(r.slug ?? ''),
    full_name: String(r.name ?? r.full_name ?? ''),
    headline: (r.title ?? r.headline ?? null) as string | null,
    avatar_url: (r.avatar_url ?? null) as string | null,
    rating: toNumber(r.rating_avg ?? r.rating),
    students_count: toNumber(r.students_count),
    courses_count: toNumber(r.courses_count),
  };
}

/** Backend instructor (full) → frontend InstructorRead. */
export function normalizeInstructorRead(raw: unknown): InstructorRead {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    slug: String(r.slug ?? ''),
    name: String(r.name ?? ''),
    title: (r.title ?? null) as string | null,
    avatar_url: (r.avatar_url ?? null) as string | null,
    rating_avg: String(r.rating_avg ?? '0'),
    students_count: toNumber(r.students_count),
    courses_count: toNumber(r.courses_count),
    bio: (r.bio ?? null) as string | null,
    expertise: (r.expertise ?? null) as string[] | null,
    linkedin_url: (r.linkedin_url ?? null) as string | null,
    twitter_url: (r.twitter_url ?? null) as string | null,
    website_url: (r.website_url ?? null) as string | null,
  };
}

/** Backend course → frontend CourseSummary. */
export function normalizeCourseSummary(raw: unknown): CourseSummary {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    subtitle: (r.subtitle ?? null) as string | null,
    thumbnail_url: (r.thumbnail_url ?? null) as string | null,
    level: (r.level ?? 'all_levels') as CourseSummary['level'],
    language: String(r.language ?? 'en'),
    duration_minutes: toNumber(r.duration_minutes),
    lessons_count: toNumber(r.lectures_count ?? r.lessons_count),
    rating: toNumber(r.rating_avg ?? r.rating),
    reviews_count: toNumber(r.ratings_count ?? r.reviews_count),
    students_count: toNumber(r.enrollments_count ?? r.students_count),
    price_cents: toNumber(r.price_cents),
    discount_price_cents:
      r.discount_price_cents == null ? null : toNumber(r.discount_price_cents),
    currency: String(r.currency ?? 'USD'),
    is_free: Boolean(r.is_free),
    is_featured: Boolean(r.is_featured),
    category: (r.category ?? null) as CourseSummary['category'],
    instructor: normalizeInstructorSummary(r.instructor),
  };
}

/** Backend course detail → frontend CourseDetail (extends CourseSummary). */
export function normalizeCourseDetail(raw: unknown): CourseDetail {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    ...normalizeCourseSummary(r),
    description: String(r.description ?? ''),
    has_preview_video: Boolean(r.has_preview_video),
    preview_playback_url: (r.preview_playback_url ?? null) as string | null,
    learning_outcomes: (r.learning_outcomes ?? null) as string[] | null,
    requirements: (r.requirements ?? null) as string[] | null,
    target_audience: (r.target_audience ?? null) as string[] | null,
    tags: (r.tags ?? null) as string[] | null,
    status: (r.status ?? 'draft') as CourseDetail['status'],
    published_at: (r.published_at ?? null) as string | null,
  };
}

/** Backend lesson → frontend LessonSummary. */
export function normalizeLessonSummary(raw: unknown): LessonSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    type: (r.type ?? 'video') as LessonSummary['type'],
    duration_seconds: toNumber(r.duration_seconds),
    is_free_preview: Boolean(r.is_free_preview),
    order: toNumber(r.order),
  };
}

export function normalizeEnrollment(raw: unknown): EnrollmentRead {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    course: normalizeCourseSummary(r.course),
    enrolled_at: String(r.enrolled_at ?? ''),
    completed_at: (r.completed_at ?? null) as string | null,
    progress_percent: toNumber(r.progress_percent),
    last_accessed_at: (r.last_accessed_at ?? null) as string | null,
    last_lesson: normalizeLessonSummary(r.last_lesson),
  };
}

export function normalizeHomeFeed(raw: unknown): HomeFeed {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    continue_learning: Array.isArray(r.continue_learning)
      ? r.continue_learning.map(normalizeEnrollment)
      : [],
    recommended: Array.isArray(r.recommended)
      ? r.recommended.map(normalizeCourseSummary)
      : [],
    featured: Array.isArray(r.featured) ? r.featured.map(normalizeCourseSummary) : [],
    popular: Array.isArray(r.popular) ? r.popular.map(normalizeCourseSummary) : [],
    new_courses: Array.isArray(r.new_courses)
      ? r.new_courses.map(normalizeCourseSummary)
      : [],
    categories: Array.isArray(r.categories)
      ? (r.categories as HomeFeed['categories'])
      : [],
    programs: Array.isArray(r.programs) ? (r.programs as HomeFeed['programs']) : [],
  };
}

export function normalizePage<T>(
  raw: unknown,
  itemNormalizer: (x: unknown) => T,
): Page<T> {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    items: Array.isArray(r.items) ? r.items.map(itemNormalizer) : [],
    total: toNumber(r.total),
    page: toNumber(r.page),
    size: toNumber(r.size),
    pages: toNumber(r.pages),
  };
}

export function normalizeWishlistItem(raw: unknown): WishlistItemRead {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    course: normalizeCourseSummary(r.course),
    created_at: String(r.created_at ?? ''),
  };
}

export function normalizeReview(raw: unknown): ReviewRead {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    rating: toNumber(r.rating),
    comment: (r.comment ?? null) as string | null,
    created_at: String(r.created_at ?? ''),
    user: r.user ? (r.user as ReviewRead['user']) : null,
  };
}
