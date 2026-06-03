/**
 * Shared API types mirroring the backend (FRONTEND.md §3, §4).
 *
 * Generate the full surface from openapi.json with:
 *   npx openapi-typescript http://localhost:8000/api/v1/openapi.json -o src/types/openapi.d.ts
 *
 * The hand-written types here cover the contracts most pages use; treat them
 * as canonical until the generator is wired into CI.
 */

export type UserRole = 'user' | 'instructor' | 'admin';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
export type PublishStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'video' | 'article' | 'quiz' | 'resource';
export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'true_false'
  | 'short_answer';
export type AssessmentStatus = 'draft' | 'published' | 'archived';
export type HlsStatus = 'pending' | 'ready' | 'failed';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface UserMe {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  is_phone_verified: boolean;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  onboarding_completed_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

export interface ValidationFieldError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  parent_id: string | null;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export interface InstructorSummary {
  id: string;
  slug: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  rating: number;
  students_count: number;
  courses_count: number;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  level: CourseLevel;
  duration_minutes: number;
  lessons_count: number;
  rating: number;
  reviews_count: number;
  students_count: number;
  price_cents: number;
  discount_price_cents: number | null;
  currency: string;
  is_free: boolean;
  is_featured: boolean;
  category: Category | null;
  instructor: InstructorSummary | null;
}

export interface CourseDetail extends CourseSummary {
  description: string;
  has_preview_video: boolean;
  preview_playback_url: string | null;
  learning_outcomes: string[] | null;
  requirements: string[] | null;
  target_audience: string[] | null;
  tags: string[] | null;
  status: PublishStatus;
  published_at: string | null;
}

export interface LessonSummary {
  id: string;
  title: string;
  type: LessonType;
  duration_seconds: number;
  is_free_preview: boolean;
  order: number;
}

export interface SectionRead {
  id: string;
  title: string;
  order: number;
  lessons: LessonSummary[];
}

export interface CurriculumRead {
  sections: SectionRead[];
  total_lessons: number;
  total_duration_seconds: number;
}

export interface EnrollmentRead {
  id: string;
  course: CourseSummary;
  enrolled_at: string;
  completed_at: string | null;
  progress_percent: number;
  last_lesson_id: string | null;
}

export interface ProgramSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  courses_count: number;
  duration_minutes: number;
  price_cents: number;
  currency: string;
}

export interface HomeFeed {
  continue_learning: EnrollmentRead[];
  recommended: CourseSummary[];
  featured: CourseSummary[];
  popular: CourseSummary[];
  new_courses: CourseSummary[];
  categories: Category[];
  programs: ProgramSummary[];
}

export interface LessonPlaybackResponse {
  lesson_id: string;
  expires_at: string;
  hls_url: string | null;
  hls_status: HlsStatus;
  // Authoritative duration components — total_segments × segment_seconds is
  // the real total length. <video>.duration only reflects the buffered window
  // for sliding manifests.
  total_segments: number | null;
  segment_seconds: number | null;
  drm: { provider: string; license_url: string } | null;
}

export interface CoursePreviewPlaybackResponse {
  course_id: string;
  expires_at: string;
  stream_url: string;
}

export interface CertificateRead {
  id: string;
  serial_no: string;
  url: string | null;
  issued_at: string;
  course_id: string | null;
  program_id: string | null;
}

export interface UserPublic {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface ReviewRead {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: UserPublic | null;
}

export interface WishlistItemRead {
  course: CourseSummary;
  created_at: string;
}

export interface DailyActivityRead {
  activity_date: string;
  minutes_learned: number;
  lessons_completed: number;
}

export interface WeeklyActivityRead {
  weekly_goal_minutes: number | null;
  minutes_learned_total: number;
  days: DailyActivityRead[];
}

export interface ProgramCourseRead {
  order: number;
  milestone_title: string | null;
  is_required: boolean;
  course: CourseSummary;
}

export interface ProgramDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  level: CourseLevel;
  duration_weeks: number;
  price_cents: number;
  currency: string;
  status: PublishStatus;
  published_at: string | null;
  description: string | null;
  courses: ProgramCourseRead[];
}

export interface ProgramEnrollmentRead {
  id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_percent: number;
  program: ProgramSummary;
}

export interface InstructorRead {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  avatar_url: string | null;
  rating_avg: string;
  students_count: number;
  courses_count: number;
  bio: string | null;
  expertise: string[] | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
}

export interface LessonNoteRead {
  id: string;
  lesson_id: string;
  course_id: string;
  title: string | null;
  body: string;
  timestamp_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface LessonAttachmentRead {
  id: string;
  lesson_id: string;
  title: string;
  file_key: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface DownloadRead {
  id: string;
  attachment: LessonAttachmentRead;
  created_at: string;
}

export type OrderItemKind = 'course' | 'program';
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'cancelled'
  | 'refunded'
  | 'failed';
export type PaymentProvider = 'payme' | 'card';
export type CardBrand = 'uzcard' | 'humo' | 'visa' | 'mastercard' | 'unknown';

export interface OrderRead {
  id: string;
  item_kind: OrderItemKind;
  course_id: string | null;
  program_id: string | null;
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  provider: PaymentProvider | null;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface PayResponse {
  order_id: string;
  status: OrderStatus;
  checkout_url: string | null;
  transaction_id: string | null;
}

export interface PaymentMethodRead {
  id: string;
  provider: PaymentProvider;
  brand: CardBrand;
  last4: string;
  expires_month: number;
  expires_year: number;
  cardholder_name: string | null;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AvatarUploadResponse {
  avatar_url: string | null;
  size_bytes: number;
}

/** Instructor-side list row from `GET /instructor/courses/{id}/assessments`. */
export interface AssessmentSummary {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  pass_percent: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  status: AssessmentStatus;
  is_section_quiz: boolean;
  questions_count: number;
  created_at: string;
}

/** Partial-update payload for `PATCH /instructor/assessments/{id}`. */
export interface AssessmentUpdatePayload {
  title?: string;
  description?: string | null;
  instructions?: string | null;
  section_id?: string | null;
  time_limit_minutes?: number | null;
  pass_percent?: number;
  max_attempts?: number | null;
  shuffle_questions?: boolean;
  show_correct_answers?: boolean;
  is_section_quiz?: boolean;
  status?: AssessmentStatus;
}

// ===== Practice quizzes (Duolingo-style drills) =====
// Backend contract: FRONTEND.md §4.9 + live OpenAPI at /api/v1/openapi.json.
//
// One pack per course (auto-created on first instructor write). Each pack
// holds many quizzes; each quiz holds up to 50 items. Items are either
// `mcq` (one correct option) or `matching` (pair lefts ↔ rights).
// The answer key is stripped server-side — `is_correct` is never sent to
// the student; matching sides are shuffled. Grading is per-item all-or-
// nothing, surfaced via `PracticeAttemptResult.results[]`.

export type PracticeItemType = 'mcq' | 'matching';

export interface MCQOptionRead {
  id: string;
  text: string;
  image_url: string | null;
}

export interface MCQDataStudent {
  type: 'mcq';
  prompt: string;
  image_url: string | null;
  options: MCQOptionRead[];
}

export interface MatchingSideStudent {
  id: string;
  text: string;
}

export interface MatchingDataStudent {
  type: 'matching';
  prompt: string;
  /** Server shuffles before sending — render in the order received. */
  lefts: MatchingSideStudent[];
  rights: MatchingSideStudent[];
}

export interface PracticeItemStudentRead {
  id: string;
  type: PracticeItemType;
  order: number;
  points: number;
  data: MCQDataStudent | MatchingDataStudent;
}

export interface PracticeQuizStudentProgress {
  completed: boolean;
  best_score_percent: number;
  attempts_count: number;
  last_attempted_at: string | null;
}

export interface PracticeQuizStudentSummary {
  id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  item_count: number;
  progress: PracticeQuizStudentProgress;
}

export interface PracticeQuizStudentRead extends PracticeQuizStudentSummary {
  items: PracticeItemStudentRead[];
}

export interface PracticePackStudentRead {
  id: string;
  course_id: string;
  title: string | null;
  description: string | null;
  /** Published quizzes only, server-sorted by order. */
  quizzes: PracticeQuizStudentSummary[];
}

// ----- Submission shapes -----

export interface MatchingPairAnswer {
  left_id: string;
  right_id: string;
}

export interface MCQAnswer {
  item_id: string;
  option_id: string;
}

export interface MatchingAnswer {
  item_id: string;
  pairs: MatchingPairAnswer[];
}

export type PracticeAnswer = MCQAnswer | MatchingAnswer;

export interface PracticeAttemptCreate {
  started_at?: string | null;
  answers: PracticeAnswer[];
}

export interface PracticeItemResult {
  item_id: string;
  is_correct: boolean;
  awarded_points: number;
}

export interface PracticeAttemptResult {
  id: string;
  quiz_id: string;
  score_percent: number;
  correct_count: number;
  total_count: number;
  completed_at: string;
  results: PracticeItemResult[];
}
