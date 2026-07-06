import { RadarChart, type RadarAxis } from '@/components/charts/RadarChart';
import { ChartIcon } from '@/components/icons';
import { DashboardCard } from './DashboardCard';
import { useT } from '@/i18n/I18nProvider';

interface SkillRadarCardProps {
  /** Real per-skill scores (0..1). Omit until a data source exists — the
   * card then shows an honest empty state instead of invented values. */
  axes?: RadarAxis[];
}

export function SkillRadarCard({ axes }: SkillRadarCardProps) {
  const t = useT();
  const empty = !axes || axes.length === 0 || axes.every((a) => a.value === 0);
  return (
    <DashboardCard title={t('dashboard.skillRadar.heading')} bodyClassName="grid place-items-center">
      {empty ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600">
            <ChartIcon className="size-5" />
          </span>
          <p className="max-w-[220px] text-sm text-ink-500">
            {t('dashboard.skillRadar.empty')}
          </p>
        </div>
      ) : (
        <RadarChart axes={axes} size={220} />
      )}
    </DashboardCard>
  );
}
