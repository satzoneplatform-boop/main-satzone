import { api } from './client';
import type { Category, SkillLevel } from '@/types/api';

export interface OnboardingProfile {
  headline: string | null;
  bio: string | null;
  skill_level: SkillLevel | null;
  weekly_goal_minutes: number | null;
  learning_goal: string | null;
  locale: string | null;
  timezone: string | null;
}

export interface OnboardingRead {
  // Backend returns null until the user has saved an onboarding profile
  // for the first time — keep the access optional everywhere.
  profile: OnboardingProfile | null;
  interests: Category[];
  onboarding_completed: boolean;
}

export interface OnboardingUpdate {
  headline?: string;
  bio?: string;
  skill_level?: SkillLevel;
  weekly_goal_minutes?: number;
  learning_goal?: string;
  locale?: string;
  timezone?: string;
  interest_category_ids?: string[];
  mark_completed?: boolean;
}

export const onboardingApi = {
  get() {
    return api.get<OnboardingRead>('/onboarding');
  },
  update(payload: OnboardingUpdate) {
    return api.put<OnboardingRead>('/onboarding', { json: payload });
  },
};
