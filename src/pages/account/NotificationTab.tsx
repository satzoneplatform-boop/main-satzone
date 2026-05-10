import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Spinner } from '@/components/ui/Spinner';
import { meApi, type NotificationPreferences } from '@/api/me';
import { BellIcon, BookIcon, CheckIcon, FlagIcon } from '@/components/icons';

const ROWS: Array<{
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: typeof BellIcon;
}> = [
  {
    key: 'course_updates',
    title: 'Course updates',
    description:
      'Get notified about new lessons, instructor announcements, and changes to your courses.',
    icon: BookIcon,
  },
  {
    key: 'assignment_deadlines',
    title: 'Assignment deadlines',
    description:
      'Receive reminders before quizzes, exams, or assignments are due so you stay on track.',
    icon: FlagIcon,
  },
  {
    key: 'certificates_achievements',
    title: 'Certificates & achievements',
    description:
      'Get notified when you earn a certificate or hit a learning milestone.',
    icon: CheckIcon,
  },
  {
    key: 'degree_admission_updates',
    title: 'Degree & admission updates',
    description:
      'Stay informed about application status, enrollment progress, program requirements, and degree announcements.',
    icon: BellIcon,
  },
];

const DEFAULT: NotificationPreferences = {
  course_updates: true,
  assignment_deadlines: true,
  certificates_achievements: true,
  degree_admission_updates: true,
};

export function NotificationTab() {
  const queryClient = useQueryClient();
  const prefs = useQuery({
    queryKey: ['me', 'preferences', 'notifications'],
    queryFn: () => meApi.getNotifications(),
  });
  const [draft, setDraft] = useState<NotificationPreferences>(DEFAULT);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (prefs.data) setDraft({ ...DEFAULT, ...prefs.data });
  }, [prefs.data]);

  const save = useMutation({
    mutationFn: (payload: NotificationPreferences) =>
      meApi.updateNotifications(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'preferences', 'notifications'] });
      setInfo('Preferences saved.');
      setTimeout(() => setInfo(null), 2500);
    },
  });

  if (prefs.isLoading) {
    return (
      <div className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-base font-semibold text-ink-900">Notification</h2>
        <p className="mt-1 text-sm text-ink-500">
          Get notified about new lessons, instructor announcements,
          assignment deadlines, certificates and milestones.
        </p>
      </header>

      {info && (
        <div className="rounded-md border border-brand-100 bg-brand-25 px-3 py-2 text-sm text-brand-700">
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
          Reset
        </Button>
        <Button onClick={() => save.mutate(draft)} loading={save.isPending}>
          Save
        </Button>
      </footer>
    </div>
  );
}
