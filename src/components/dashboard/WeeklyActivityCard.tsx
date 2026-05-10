import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { CalendarIcon, CheckIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import type { UserMe } from '@/types/api';
import { DashboardCard } from './DashboardCard';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface WeeklyActivityCardProps {
  user?: UserMe | null;
  weeklyGoalMinutes: number;
  /** Indices (0..6, Sunday-first) of days marked as study days this week. */
  studyDays?: number[];
  /** Total time studied this week in minutes. */
  studiedMinutes?: number;
  onSetPlan: () => void;
}

export function WeeklyActivityCard({
  user,
  weeklyGoalMinutes,
  studyDays = [],
  studiedMinutes = 0,
  onSetPlan,
}: WeeklyActivityCardProps) {
  const hasPlan = weeklyGoalMinutes > 0;
  const planDays = Math.max(1, Math.round(weeklyGoalMinutes / 60));
  const hours = Math.floor(studiedMinutes / 60);
  const mins = studiedMinutes % 60;

  // No plan + no user details yet
  if (!hasPlan) {
    return (
      <DashboardCard title="Weekly activity" bodyClassName="space-y-4">
        <p className="text-sm text-ink-500">
          Create a weekly study plan that fits your routine.
        </p>
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-600">
            <CalendarIcon />
          </span>
          <p className="text-sm text-ink-700">
            Set a weekly learning plan to stay consistent.
          </p>
        </div>
        <Button variant="outline" fullWidth leftIcon={<CalendarIcon />} onClick={onSetPlan}>
          Set learning plan
        </Button>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Weekly activity" bodyClassName="space-y-5">
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
          <p className="text-base font-semibold text-ink-900">{planDays} days plan</p>
          <p className="text-xs text-ink-500">
            {studyDays.length}/{planDays} days completed
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

      <div className="grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
        <Stat label="Hours studied" value={`${hours}`} unit="hrs" />
        <Stat label="Active time" value={`${mins}`} unit="min" />
      </div>

      <button
        type="button"
        onClick={onSetPlan}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
      >
        <CalendarIcon className="size-4" />
        Set learning plan
      </button>
    </DashboardCard>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1">
        <span className="text-2xl font-semibold text-ink-900">{value}</span>
        <span className="ml-1 text-sm font-medium text-ink-500">{unit}</span>
      </p>
    </div>
  );
}
