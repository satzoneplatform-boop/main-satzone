import { useMemo } from 'react';
import { RadarChart, type RadarAxis } from '@/components/charts/RadarChart';
import { DashboardCard } from './DashboardCard';
import { useT } from '@/i18n/I18nProvider';

interface SkillRadarCardProps {
  axes?: RadarAxis[];
}

export function SkillRadarCard({ axes }: SkillRadarCardProps) {
  const t = useT();
  const DEFAULT_AXES: RadarAxis[] = useMemo(
    () => [
      { label: t('dashboard.skillRadar.axis.data'), value: 0.65 },
      { label: t('dashboard.skillRadar.axis.logic'), value: 0.5 },
      { label: t('dashboard.skillRadar.axis.focus'), value: 0.7 },
      { label: t('dashboard.skillRadar.axis.strategy'), value: 0.45 },
      { label: t('dashboard.skillRadar.axis.reasoning'), value: 0.6 },
      { label: t('dashboard.skillRadar.axis.analysis'), value: 0.55 },
    ],
    [t],
  );
  const resolvedAxes = axes ?? DEFAULT_AXES;
  const empty = resolvedAxes.every((a) => a.value === 0);
  return (
    <DashboardCard title={t('dashboard.skillRadar.heading')} bodyClassName="grid place-items-center">
      {empty ? (
        <div className="py-8 text-center text-sm text-ink-500">
          {t('dashboard.skillRadar.empty')}
        </div>
      ) : (
        <RadarChart axes={resolvedAxes} size={220} />
      )}
    </DashboardCard>
  );
}
