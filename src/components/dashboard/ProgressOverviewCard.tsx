import { DonutChart } from '@/components/charts/DonutChart';
import type { EnrollmentRead } from '@/types/api';
import { DashboardCard } from './DashboardCard';

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
  const counts = bucket(enrollments);
  const total = counts.notStarted + counts.inProgress + counts.completed;
  const completedPct = total > 0 ? Math.round((counts.completed / total) * 100) : 0;

  return (
    <DashboardCard title="Progress overview" bodyClassName="grid grid-cols-[auto_1fr] gap-6 items-center">
      <DonutChart
        size={140}
        strokeWidth={16}
        centerValue={total > 0 ? `${completedPct}%` : '—'}
        centerLabel={total > 0 ? 'Completed' : 'No data'}
        segments={
          total > 0
            ? [
                { label: 'Completed', value: counts.completed, color: '#615FFF' },
                { label: 'In progress', value: counts.inProgress, color: '#46ECD5' },
                { label: 'Not started', value: counts.notStarted, color: '#E7EBEB' },
              ]
            : [{ label: 'Empty', value: 1, color: '#E7EBEB' }]
        }
      />
      <ul className="space-y-3 text-sm">
        <LegendRow color="#E7EBEB" label="Not started" count={counts.notStarted} />
        <LegendRow color="#46ECD5" label="In progress" count={counts.inProgress} />
        <LegendRow color="#615FFF" label="Completed" count={counts.completed} />
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
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-ink-700">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="text-xs font-medium text-ink-500">{count} courses</span>
    </li>
  );
}
