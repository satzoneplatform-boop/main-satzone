import { RadarChart, type RadarAxis } from '@/components/charts/RadarChart';
import { DashboardCard } from './DashboardCard';

interface SkillRadarCardProps {
  axes?: RadarAxis[];
}

const DEFAULT_AXES: RadarAxis[] = [
  { label: 'Data', value: 0.65 },
  { label: 'Logic', value: 0.5 },
  { label: 'Focus', value: 0.7 },
  { label: 'Strategy', value: 0.45 },
  { label: 'Reasoning', value: 0.6 },
  { label: 'Analysis', value: 0.55 },
];

export function SkillRadarCard({ axes = DEFAULT_AXES }: SkillRadarCardProps) {
  const empty = axes.every((a) => a.value === 0);
  return (
    <DashboardCard title="Skill you’re building" bodyClassName="grid place-items-center">
      {empty ? (
        <div className="py-8 text-center text-sm text-ink-500">
          Take a class to start building your skill profile.
        </div>
      ) : (
        <RadarChart axes={axes} size={220} />
      )}
    </DashboardCard>
  );
}
