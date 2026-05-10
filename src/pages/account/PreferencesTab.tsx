import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/Radio';
import { Select } from '@/components/ui/Select';
import { onboardingApi } from '@/api/onboarding';
import { useOnboarding } from '@/features/home/hooks';
import { cn } from '@/lib/cn';

const LEARNING_GOALS = [
  { value: 'career_advancement', label: 'Career advancement' },
  { value: 'skill_building', label: 'Skill building' },
  { value: 'academic_degree', label: 'Academic degree' },
  { value: 'personal_growth', label: 'Personal growth' },
  { value: 'exploring_new_topics', label: 'Exploring new topics' },
] as const;

const STYLES = [
  { value: 'video', label: 'Video lessons' },
  { value: 'reading', label: 'Reading materials' },
  { value: 'hands_on', label: 'Hands-on exercises' },
  { value: 'mixed', label: 'Mixed' },
] as const;

const DIFFICULTY = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function PreferencesTab() {
  const queryClient = useQueryClient();
  const onboarding = useOnboarding();

  const [goal, setGoal] = useState<string>('career_advancement');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('3');
  const [minutesPerDay, setMinutesPerDay] = useState<string>('60');
  const [style, setStyle] = useState<string>('video');
  const [difficulty, setDifficulty] = useState<string>('beginner');

  useEffect(() => {
    const profile = onboarding.data?.profile;
    if (!profile) return;
    if (profile.learning_goal) setGoal(profile.learning_goal);
    if (profile.weekly_goal_minutes) {
      // Best-effort: assume `minutesPerDay` maps to total / days, default 3 days/week.
      const total = profile.weekly_goal_minutes;
      const guessDays = total <= 60 ? 1 : total <= 180 ? 3 : total <= 420 ? 5 : 7;
      setDaysPerWeek(String(guessDays));
      setMinutesPerDay(String(Math.round(total / guessDays)));
    }
    if (profile.skill_level) setDifficulty(profile.skill_level);
  }, [onboarding.data]);

  const save = useMutation({
    mutationFn: () =>
      onboardingApi.update({
        learning_goal: goal,
        weekly_goal_minutes: Number(daysPerWeek) * Number(minutesPerDay),
        skill_level: difficulty as 'beginner' | 'intermediate' | 'advanced',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-base font-semibold text-ink-900">Preferences</h2>
      </header>

      <Group title="Learning Goal" description="What's your primary reason for learning?">
        <RadioGroup
          name="learning-goal"
          value={goal}
          onChange={setGoal}
          options={LEARNING_GOALS as unknown as Array<{ value: string; label: string }>}
        />
      </Group>

      <Group
        title="Weekly Learning Commitment"
        description="Set a learning routine that fits your schedule."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Days per week"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(e.target.value)}
            options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
              value: String(n),
              label: `${n} day${n === 1 ? '' : 's'}`,
            }))}
          />
          <Select
            label="Average time per day"
            value={minutesPerDay}
            onChange={(e) => setMinutesPerDay(e.target.value)}
            options={[15, 30, 45, 60, 90, 120].map((n) => ({
              value: String(n),
              label: `${n} min${n >= 60 ? ` (${(n / 60).toFixed(n % 60 ? 1 : 0)} h)` : ''}`,
            }))}
          />
        </div>
      </Group>

      <Group
        title="Preferred Learning Style"
        description="Select formats you enjoy most. (Local-only — backend has no field for this yet.)"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              className={cn(
                'rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
                style === s.value
                  ? 'border-brand-500 bg-brand-25 text-ink-900'
                  : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Group>

      <Group
        title="Difficulty Preference"
        description="We'll suggest courses that match your comfort level."
      >
        <Select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={DIFFICULTY}
        />
      </Group>

      <footer className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
        <Button variant="outline" type="button">
          Reset
        </Button>
        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Save
        </Button>
      </footer>
    </div>
  );
}

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-input)]">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-xs text-ink-500">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
