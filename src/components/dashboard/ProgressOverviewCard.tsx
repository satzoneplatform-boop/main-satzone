import { DonutChart } from '@/components/charts/DonutChart';
import type { EnrollmentRead } from '@/types/api';
import { DashboardCard } from './DashboardCard';
import { useT } from '@/i18n/I18nProvider';

interface ProgressOverviewCardProps {
  enrollments: EnrollmentRead[];
}

interface BucketCounts {
  notStarted: number;
  inProgress: number;
  completed: number;
}

function bucket(enrollments: EnrollmentRead[]): BucketCounts {
  return enrollments.reduce<BucketCounts>(
    (acc, e) => {
      if (e.completed_at) acc.completed += 1;
      else if (e.progress_percent > 0) acc.inProgress += 1;
      else acc.notStarted += 1;
      return acc;
    },
    { notStarted: 0, inProgress: 0, completed: 0 },
  );
}

export function ProgressOverviewCard({ enrollments }: ProgressOverviewCardProps) {
  const t = useT();
  const counts = bucket(enrollments);
  const total = counts.notStarted + counts.inProgress + counts.completed;
  const completedPct = total > 0 ? Math.round((counts.completed / total) * 100) : 0;

  return (
    <DashboardCard
      title={t('dashboard.progressOverview.title')}
      bodyClassName="flex flex-wrap items-center gap-x-4 gap-y-4"
    >
      <DonutChart
        size={120}
        strokeWidth={14}
        centerValue={total > 0 ? `${completedPct}%` : '—'}
        centerLabel={total > 0 ? t('dashboard.progressOverview.completed') : t('dashboard.progressOverview.noData')}
        segments={
          total > 0
            ? [
                { label: t('dashboard.progressOverview.completed'), value: counts.completed, color: '#615FFF' },
                { label: t('dashboard.progressOverview.inProgress'), value: counts.inProgress, color: '#46ECD5' },
                { label: t('dashboard.progressOverview.notStarted'), value: counts.notStarted, color: '#E7EBEB' },
              ]
            : [{ label: t('dashboard.progressOverview.noData'), value: 1, color: '#E7EBEB' }]
        }
      />
      <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
        <LegendRow color="#E7EBEB" label={t('dashboard.progressOverview.notStarted')} count={counts.notStarted} />
        <LegendRow color="#46ECD5" label={t('dashboard.progressOverview.inProgress')} count={counts.inProgress} />
        <LegendRow color="#615FFF" label={t('dashboard.progressOverview.completed')} count={counts.completed} />
      </ul>
    </DashboardCard>
  );
}

function LegendRow({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ background: color }}
      />
      <span className="min-w-0 flex-1 truncate text-ink-700">{label}</span>
      <span className="shrink-0 whitespace-nowrap text-xs font-medium text-ink-500">
        {count}
      </span>
    </li>
  );
}
