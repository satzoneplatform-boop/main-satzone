import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { meApi, type NotificationPreferences } from '@/api/me';
import { BellIcon, BookIcon, CheckIcon, FlagIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';

const DEFAULT: NotificationPreferences = {
  course_updates: true,
  assignment_deadlines: true,
  certificates_achievements: true,
  degree_admission_updates: true,
};

export function NotificationTab() {
  const t = useT();
  const queryClient = useQueryClient();
  const prefs = useQuery({
    queryKey: ['me', 'preferences', 'notifications'],
    queryFn: () => meApi.getNotifications(),
  });
  const [draft, setDraft] = useState<NotificationPreferences>(DEFAULT);
  const [info, setInfo] = useState<string | null>(null);

  const ROWS: Array<{
    key: keyof NotificationPreferences;
    title: string;
    description: string;
    icon: typeof BellIcon;
  }> = useMemo(
    () => [
      {
        key: 'course_updates',
        title: t('account.notification.courseUpdates.title'),
        description: t('account.notification.courseUpdates.description'),
        icon: BookIcon,
      },
      {
        key: 'assignment_deadlines',
        title: t('account.notification.assignments.title'),
        description: t('account.notification.assignments.description'),
        icon: FlagIcon,
      },
      {
        key: 'certificates_achievements',
        title: t('account.notification.certificates.title'),
        description: t('account.notification.certificates.description'),
        icon: CheckIcon,
      },
      {
        key: 'degree_admission_updates',
        title: t('account.notification.degree.title'),
        description: t('account.notification.degree.description'),
        icon: BellIcon,
      },
    ],
    [t],
  );

  // Sync the draft when the server preferences land / change — done during
  // render (adjust-state pattern) instead of via a setState-in-effect.
  const [prevData, setPrevData] = useState<typeof prefs.data>(undefined);
  if (prefs.data !== prevData) {
    setPrevData(prefs.data);
    if (prefs.data) setDraft({ ...DEFAULT, ...prefs.data });
  }

  const save = useMutation({
    mutationFn: (payload: NotificationPreferences) =>
      meApi.updateNotifications(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'preferences', 'notifications'] });
      setInfo(t('account.notification.saved'));
      setTimeout(() => setInfo(null), 2500);
    },
  });

  if (prefs.isLoading) {
    return (
      <div className="space-y-2 py-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-base font-semibold text-ink-900">{t('account.notification.title')}</h2>
        <p className="mt-1 text-sm text-ink-500">
          {t('account.notification.subtitle')}
        </p>
      </header>

      {info && (
        <div role="status" className="rounded-md border border-brand-100 bg-brand-25 px-3 py-2 text-sm text-brand-700">
          {info}
        </div>
      )}

      <ul className="space-y-2">
        {ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <li
              key={row.key}
              className="flex items-start gap-4 rounded-xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-input)]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-700">
                <Icon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{row.title}</p>
                <p className="mt-1 text-xs text-ink-500">{row.description}</p>
              </div>
              <Switch
                checked={Boolean(draft[row.key])}
                onChange={(next) => setDraft((d) => ({ ...d, [row.key]: next }))}
                label={row.title}
              />
            </li>
          );
        })}
      </ul>

      <footer className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
        <Button variant="outline" type="button" onClick={() => prefs.data && setDraft({ ...DEFAULT, ...prefs.data })}>
          {t('common.reset')}
        </Button>
        <Button onClick={() => save.mutate(draft)} loading={save.isPending}>
          {t('common.save')}
        </Button>
      </footer>
    </div>
  );
}
