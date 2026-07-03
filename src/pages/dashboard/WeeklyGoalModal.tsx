import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { onboardingApi } from '@/api/onboarding';
import { CheckIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/I18nProvider';

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
  const t = useT();
  const queryClient = useQueryClient();
  const initialDays = Math.max(0, Math.min(7, Math.round(initialMinutes / 60)));
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const DAYS = useMemo(
    () => [
      { key: 0, label: t('common.day.sunday') },
      { key: 1, label: t('common.day.monday') },
      { key: 2, label: t('common.day.tuesday') },
      { key: 3, label: t('common.day.wednesday') },
      { key: 4, label: t('common.day.thursday') },
      { key: 5, label: t('common.day.friday') },
      { key: 6, label: t('common.day.saturday') },
    ],
    [t],
  );

  // Re-seed the selection whenever the modal (re)opens or the saved goal
  // changes — adjust-during-render pattern instead of a setState-in-effect.
  const [prevSeed, setPrevSeed] = useState<{ open: boolean; days: number } | null>(null);
  if (prevSeed?.open !== open || prevSeed?.days !== initialDays) {
    setPrevSeed({ open, days: initialDays });
    if (open) {
      const next = new Set<number>();
      for (let i = 0; i < initialDays; i++) next.add(i + 1); // Mon-first default
      setSelected(next);
    }
  }

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
          <h2 className="text-xl font-semibold text-ink-900">{t('dashboard.weeklyGoal.title')}</h2>
          <p className="mt-1 text-sm text-ink-500">
            {t('dashboard.weeklyGoal.subtitle')}
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
                    'flex min-h-11 w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
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

        {selected.size > 0 && (
          <p role="status" className="text-center text-xs text-ink-500">
            {t('dashboard.weeklyGoal.summary', { n: selected.size, h: selected.size })}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button variant="outline" fullWidth onClick={onReset}>
            {t('common.reset')}
          </Button>
          <Button fullWidth onClick={onSave} loading={save.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
