import { useState } from 'react';
import { LatestCourseCard } from '@/components/dashboard/LatestCourseCard';
import { LearningPathCard } from '@/components/dashboard/LearningPathCard';
import { ProgressOverviewCard } from '@/components/dashboard/ProgressOverviewCard';
import { RecommendationsRow } from '@/components/dashboard/RecommendationsRow';
import { SkillRadarCard } from '@/components/dashboard/SkillRadarCard';
import { WeeklyActivityCard } from '@/components/dashboard/WeeklyActivityCard';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/features/auth/AuthProvider';
import { useHomeFeed, useOnboarding } from '@/features/home/hooks';
import { useT } from '@/i18n/I18nProvider';
import { WeeklyGoalModal } from './WeeklyGoalModal';

export function DashboardPage() {
  const { user } = useAuth();
  const home = useHomeFeed();
  const onboarding = useOnboarding();
  const t = useT();
  const [goalOpen, setGoalOpen] = useState(false);

  if (home.isLoading || onboarding.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (home.error) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-ink-500">{t('dashboard.errorLoading')}</p>
      </div>
    );
  }

  const continueLearning = home.data?.continue_learning ?? [];
  const recommended = home.data?.recommended ?? [];
  const weeklyGoalMinutes = onboarding.data?.profile?.weekly_goal_minutes ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <LatestCourseCard enrollment={continueLearning[0] ?? null} />
        <WeeklyActivityCard
          user={user}
          weeklyGoalMinutes={weeklyGoalMinutes}
          studyDays={[]}
          studiedMinutes={0}
          onSetPlan={() => setGoalOpen(true)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SkillRadarCard />
        <LearningPathCard enrollments={continueLearning} />
        <ProgressOverviewCard enrollments={continueLearning} />
      </div>

      {recommended.length > 0 && (
        <RecommendationsRow title={t('dashboard.recommendedTitle')} courses={recommended} />
      )}

      <WeeklyGoalModal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        initialMinutes={weeklyGoalMinutes}
      />
    </div>
  );
}
