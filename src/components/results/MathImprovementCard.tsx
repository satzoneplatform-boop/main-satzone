import { motion, useReducedMotion } from 'motion/react';
import { CountUp } from '@/components/motion/CountUp';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TrendingUpIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';
import type { MathResult } from '@/features/results/types';
import { ResultPhoto } from './ResultPhoto';

/**
 * "SAT Math improvement" card. The whole design pushes the eye to the
 * `+points` gain — a large animated gradient counter — since the academy
 * teaches Math only and this is the metric that matters most here.
 */
export function MathImprovementCard({ result }: { result: MathResult }) {
  const t = useT();
  const reduce = useReducedMotion();
  const MAX_MATH = 800;

  return (
    <motion.figure
      whileHover={reduce ? undefined : { y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="lp-card group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-[var(--shadow-card)] hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative">
        <ResultPhoto
          src={result.photoUrl}
          alt={t('landing.results.photoAlt', { name: result.studentName })}
          className="aspect-[4/3] w-full"
          imgClassName="group-hover:scale-[1.06]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-navy-900/70 via-navy-900/10 to-transparent" />
        <figcaption className="absolute inset-x-4 bottom-3 text-white">
          <p className="text-lg font-bold leading-tight drop-shadow-sm">{result.studentName}</p>
          {result.overallScore != null && (
            <p className="text-xs font-medium text-white/80">
              {t('landing.results.overall')} {result.overallScore}
            </p>
          )}
        </figcaption>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {/* Hero: the improvement */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-[0_8px_20px_-6px_rgb(31_168_248/0.6)]">
              <TrendingUpIcon className="size-6" />
            </span>
            <div className="leading-none">
              <p className="bg-gradient-to-br from-brand-600 to-accent-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                <CountUp to={result.improvement} prefix="+" />
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
                {t('landing.results.improvement')} · {t('landing.results.points')}
              </p>
            </div>
          </div>
        </div>

        {/* Before → After bars */}
        <div className="mt-5 space-y-3">
          <ScoreRow
            label={t('landing.results.before')}
            value={result.mathBefore}
            max={MAX_MATH}
            fillClassName="bg-ink-300"
          />
          <ScoreRow
            label={t('landing.results.after')}
            value={result.mathAfter}
            max={MAX_MATH}
            fillClassName="bg-gradient-to-r from-brand-500 to-accent-500"
            emphasize
          />
        </div>

        {result.testimonial && (
          <blockquote className="mt-5 line-clamp-3 text-sm leading-relaxed text-ink-600">
            “{result.testimonial}”
          </blockquote>
        )}
      </div>
    </motion.figure>
  );
}

function ScoreRow({
  label,
  value,
  max,
  fillClassName,
  emphasize = false,
}: {
  label: string;
  value: number;
  max: number;
  fillClassName: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-ink-500">{label}</span>
        <span className={emphasize ? 'font-bold text-navy-900' : 'font-semibold text-ink-600'}>
          <CountUp to={value} />
        </span>
      </div>
      <ProgressBar value={value} max={max} fillClassName={fillClassName} />
    </div>
  );
}
