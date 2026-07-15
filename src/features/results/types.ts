/**
 * DTOs for the Results CMS.
 *
 * These are the *only* contract the frontend depends on. The storage backend
 * (JSON files today, a database tomorrow) can change freely as long as the API
 * keeps returning these shapes — see server/store.js.
 */

export type ResultCategory = 'university' | 'math';

/** Fields shared by every result, regardless of category. */
export interface BaseResult {
  id: string;
  studentName: string;
  photoUrl: string;
  testimonial?: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UniversityResult extends BaseResult {
  /** Optional — a strong score can be showcased before any acceptance. */
  universityName?: string;
  universityLogoUrl?: string;
  country: string;
  overallScore: number;
  /** Optional — see universityName. */
  acceptanceStatus?: string;
}

export interface MathResult extends BaseResult {
  mathBefore: number;
  mathAfter: number;
  /** Derived server-side: mathAfter - mathBefore. */
  improvement: number;
  overallScore?: number;
}

export type AnyResult = UniversityResult | MathResult;

/** Result type for a given category discriminant. */
export type ResultOf<C extends ResultCategory> = C extends 'university'
  ? UniversityResult
  : MathResult;

/** Editable payloads (server assigns id/timestamps/sortOrder and derives improvement). */
export type UniversityInput = Omit<
  UniversityResult,
  'id' | 'sortOrder' | 'createdAt' | 'updatedAt'
>;
export type MathInput = Omit<
  MathResult,
  'id' | 'sortOrder' | 'createdAt' | 'updatedAt' | 'improvement'
>;

export type ResultInput<C extends ResultCategory> = C extends 'university'
  ? UniversityInput
  : MathInput;
