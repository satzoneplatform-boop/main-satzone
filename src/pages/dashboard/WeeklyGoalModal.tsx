import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { onboardingApi } from '@/api/onboarding';
import { CheckIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

const DAYS = [
  { key: 0, label: 'Sunday' },
  { key: 1, label: 'Monday' },
  { key: 2, label: 'Tuesday' },
  { key: 3, label: 'Wednesday' },
  { key: 4, label: 'Thursday' },
  { key: 5, label: 'Friday' },
  { key: 6, label: 'Saturday' },
];

interface WeeklyGoalModalProps {
  open: boolean;
  onClose: () => void;
  initialMinutes?: number;
}

/**
 * "Set weekly learning goal" modal (Figma node 14109:23817).
 *
 * Persists the count of selected days as a minutes-per-week value via
 * PUT /onboarding (60 min per selected day). The backend stores
 * `weekly_goal_minutes`; we map day-toggles to it so the API stays simple.
 */
export function WeeklyGoalModal({ open, onClose, initialMinutes = 0 }: WeeklyGoalModalProps) {
  const queryClient = useQueryClient();
  const initialDays = Math.max(0, Math.min(7, Math.round(initialMinutes / 60)));
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    const next = new Set<number>();
    for (let i = 0; i < initialDays; i++) next.add(i + 1); // Mon-first default
    setSelected(next);
  }, [open, initialDays]);

  const save = useMutation({
    mutationFn: (minutes: number) =>
      onboardingApi.update({ weekly_goal_minutes: minutes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      onClose();
    },
  });

  function toggle(day: number) {
    const next = new Set(selected);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setSelected(next);
  }

  function onSave() {
    save.mutate(selected.size * 60);
  }

  function onReset() {
    setSelected(new Set());
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Set weekly learning goal</h2>
          <p className="mt-1 text-sm text-ink-500">
            Pick the days you plan to learn each week. We’ll remind you to keep your streak going.
          </p>
        </div>

        <ul className="space-y-2">
          {DAYS.map((d) => {
            const checked = selected.has(d.key);
            return (
              <li key={d.key}>
                <button
                  type="button"
                  onClick={() => toggle(d.key)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                    checked
                      ? 'border-brand-500 bg-brand-25 text-ink-900'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                  )}
                  aria-pressed={checked}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid size-5 place-items-center rounded-md border',
                        checked
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-ink-300 bg-white',
                      )}
                    >
                      {checked && <CheckIcon className="size-3.5" />}
                    </span>
                    {d.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <Button variant="outline" fullWidth onClick={onReset}>
            Reset
          </Button>
          <Button fullWidth onClick={onSave} loading={save.isPending}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
