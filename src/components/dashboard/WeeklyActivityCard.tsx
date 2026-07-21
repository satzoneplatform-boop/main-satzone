import { useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CalendarIcon, CheckIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import type { UserMe } from '@/types/api';
import { DashboardCard } from './DashboardCard';
import { useT } from '@/i18n/I18nProvider';

interface WeeklyActivityCardProps {
  user?: UserMe | null;
  weeklyGoalMinutes: number;
  /** Indices (0..6, Sunday-first) of days marked as study days this week. */
  studyDays?: number[];
  /** Total time studied this week in minutes. */
  studiedMinutes?: number;
  /** Lessons completed this week (summed from daily activity). */
  lessonsCompleted?: number;
  onSetPlan: () => void;
}

export function WeeklyActivityCard({
  user,
  weeklyGoalMinutes,
  studyDays = [],
  studiedMinutes = 0,
  lessonsCompleted = 0,
  onSetPlan,
}: WeeklyActivityCardProps) {
  const t = useT();
  const hasPlan = weeklyGoalMinutes > 0;
  const planDays = Math.max(1, Math.round(weeklyGoalMinutes / 60));

  const WEEK_DAYS = useMemo(
    () => [
      t('common.dayShort.sun'),
      t('common.dayShort.mon'),
      t('common.dayShort.tue'),
      t('common.dayShort.wed'),
      t('common.dayShort.thu'),
      t('common.dayShort.fri'),
      t('common.dayShort.sat'),
    ],
    [t],
  );

  // No plan + no user details yet
  if (!hasPlan) {
    return (
      <DashboardCard title={t('dashboard.weeklyActivity.title')} bodyClassName="space-y-4">
        <p className="text-sm text-ink-500">
          {t('dashboard.weeklyActivity.createPlan')}
        </p>
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-600">
            <CalendarIcon />
          </span>
          <p className="text-sm text-ink-700">
            {t('dashboard.weeklyActivity.consistentHint')}
          </p>
        </div>
        <Button variant="outline" fullWidth leftIcon={<CalendarIcon />} onClick={onSetPlan}>
          {t('dashboard.weeklyActivity.setLearningPlan')}
        </Button>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={t('dashboard.weeklyActivity.title')} bodyClassName="space-y-5">
      {user && (
        <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
          <Avatar src={user.avatar_url} name={user.full_name} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">
              {user.full_name}
            </p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-base font-semibold text-ink-900">{t('dashboard.weeklyActivity.daysPlan', { n: planDays })}</p>
          <p className="text-xs text-ink-500">
            {t('dashboard.weeklyActivity.daysCompleted', { done: studyDays.length, total: planDays })}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {WEEK_DAYS.map((d, i) => {
            const done = studyDays.includes(i);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'grid size-7 place-items-center rounded-full text-xs font-medium',
                    done
                      ? 'bg-brand-600 text-white'
                      : 'border border-dashed border-ink-300 text-ink-400',
                  )}
                >
                  {done ? <CheckIcon className="size-3.5" /> : d}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real minutes vs. the saved weekly goal. */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-ink-500">
          <span className="min-w-0 truncate">
            {t('dashboard.weeklyActivity.goalProgress', {
              done: studiedMinutes,
              goal: weeklyGoalMinutes,
            })}
          </span>
          <span className="shrink-0 font-medium text-ink-900">
            {Math.min(100, Math.round((studiedMinutes / weeklyGoalMinutes) * 100))}%
          </span>
        </div>
        <ProgressBar value={studiedMinutes} max={weeklyGoalMinutes} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
        <Stat
          label={t('dashboard.weeklyActivity.timeStudied')}
          value={studiedMinutes > 0 ? formatDuration(studiedMinutes) : '0m'}
        />
        <Stat
          label={t('dashboard.weeklyActivity.lessonsCompleted')}
          value={String(lessonsCompleted)}
        />
      </div>

      <button
        type="button"
        onClick={onSetPlan}
        className="flex min-h-11 items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
      >
        <CalendarIcon className="size-4" />
        {t('dashboard.weeklyActivity.setLearningPlan')}
      </button>
    </DashboardCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}
