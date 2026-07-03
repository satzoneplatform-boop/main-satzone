import type { CourseLevel } from '@/types/api';

export interface FilterValue {
  level: CourseLevel | 'any';
  topicIds: string[];
  durationBucket: 'any' | 'lt2h' | '2_6h' | 'gt6h';
  isFree: 'any' | 'free' | 'paid';
}

export const DEFAULT_FILTERS: FilterValue = {
  level: 'any',
  topicIds: [],
  durationBucket: 'any',
  isFree: 'any',
};

/** Convert UI filter state into the backend `CourseFilters` shape. */
export function toCourseFilters(value: FilterValue): {
  level?: CourseLevel;
  is_free?: boolean;
  min_duration_minutes?: number;
  max_duration_minutes?: number;
  category_id?: string;
} {
  const out: ReturnType<typeof toCourseFilters> = {};
  if (value.level !== 'any') out.level = value.level;
  if (value.isFree === 'free') out.is_free = true;
  if (value.isFree === 'paid') out.is_free = false;
  if (value.durationBucket === 'lt2h') out.max_duration_minutes = 120;
  if (value.durationBucket === '2_6h') {
    out.min_duration_minutes = 120;
    out.max_duration_minutes = 360;
  }
  if (value.durationBucket === 'gt6h') out.min_duration_minutes = 360;
  if (value.topicIds.length > 0) out.category_id = value.topicIds[0]; // backend filters single
  return out;
}
