import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AreaChart } from '@/components/charts/AreaChart';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/motion/CountUp';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  InfoIcon,
  LockIcon,
  TargetIcon,
  TrendingUpIcon,
} from '@/components/icons';
import { useHomeFeed, useWeeklyActivity } from '@/features/home/hooks';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

/**
 * Analytics / progress dashboard.
 *
 * DATA HONESTY: there is no analytics API yet, so the projected-score
 * visuals use representative SAT data. Every hardcoded card carries a
 * visible "Sample" chip and the page opens with a banner saying so.
 * Real data (weekly study activity from GET /me/activity/weekly and
 * course completions from the home feed) renders WITHOUT the chip.
 */

const TARGET = 1500;
const SCORE_SERIES = [1180, 1210, 1250, 1290, 1330, 1380, 1440, 1500];
const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
const PROJECTED = SCORE_SERIES[SCORE_SERIES.length - 1];
const START = SCORE_SERIES[0];

/* Chart hues come from the @theme tokens — no raw hex in this file. */
const CHART_BRAND = 'var(--color-brand-600)';
const CHART_SUCCESS = 'var(--color-success-500)';

const SUBJECTS = [
  { label: 'Math', score: 780, max: 800, accuracy: 91, color: 'from-brand-500 to-brand-600' },
  {
    label: 'Reading & Writing',
    score: 720,
    max: 800,
    accuracy: 84,
    color: 'from-accent-400 to-accent-600',
  },
] as const;

const STRENGTHS = [
  { label: 'Linear equations', value: 94 },
  { label: 'Command of evidence', value: 90 },
  { label: 'Ratios & proportions', value: 88 },
] as const;

const FOCUS = [
  { label: 'Geometry & trig', value: 61 },
  { label: 'Punctuation rules', value: 58 },
  { label: 'Data analysis', value: 66 },
] as const;

const TIME_BY_TOPIC = [
  { label: 'Algebra', minutes: 210 },
  { label: 'Reading comp.', minutes: 165 },
  { label: 'Grammar', minutes: 120 },
  { label: 'Geometry', minutes: 95 },
  { label: 'Vocabulary', minutes: 60 },
] as const;

const ACCURACY_TREND = [62, 65, 68, 71, 74, 79, 82, 86];

const MILESTONES = [1200, 1300, 1400, 1500] as const;

export function AnalyticsPage() {
  const t = useT();
  const home = useHomeFeed();
  const [period, setPeriod] = useState<'4w' | '8w' | 'all'>('8w');

  const enrollments = home.data?.continue_learning ?? [];
  const coursesCompleted = enrollments.filter((e) => e.completed_at).length;

  const series = useMemo(
    () => (period === '4w' ? SCORE_SERIES.slice(-4) : SCORE_SERIES),
    [period],
  );
  const seriesLabels = useMemo(
    () => (period === '4w' ? WEEK_LABELS.slice(-4) : WEEK_LABELS),
    [period],
  );

  const gained = PROJECTED - START;
  const toGo = Math.max(0, TARGET - PROJECTED);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal onView={false}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              {t('analytics.title')}
            </h1>
            <p className="mt-1 text-sm text-ink-500">{t('analytics.subtitle')}</p>
          </div>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>
      </Reveal>

      {/* Data-honesty banner: the projections below are sample data. */}
      <Reveal onView={false}>
        <div
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-25 px-4 py-3"
        >
          <span className="mt-0.5 shrink-0 text-brand-600" aria-hidden>
            <InfoIcon />
          </span>
          <p className="text-sm leading-relaxed text-ink-700">{t('analytics.sampleBanner')}</p>
        </div>
      </Reveal>

      {/* Top row: projected score + growth chart (sample data) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Reveal onView={false}>
          <div className="relative h-full overflow-hidden rounded-2xl bg-navy-900 p-6 text-white shadow-[var(--shadow-card)]">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/25 blur-3xl" />
            <div className="absolute right-4 top-4">
              <SampleChip dark />
            </div>
            <div className="relative flex flex-col items-center text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                {t('analytics.projectedScore')}
              </p>
              <ScoreRing
                value={PROJECTED}
                max={1600}
                size={168}
                strokeWidth={12}
                label="/ 1600"
                className="mt-4"
                valueClassName="text-white"
                ringClassName="text-accent-500"
                trackClassName="text-white/10"
              />
              <div className="mt-5 flex items-center gap-2 rounded-full bg-success-500/15 px-3 py-1 text-sm font-semibold text-success-500">
                <TrendingUpIcon className="size-4" />
                +<CountUp to={gained} /> {t('analytics.pts')}
              </div>
              <p className="mt-3 text-sm text-white/60">
                <span className="font-semibold text-white">{toGo}</span>{' '}
                {t('analytics.toGo')} ({TARGET})
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal onView={false}>
          <div className="flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-navy-900">
                    {t('analytics.scoreGrowth')}
                  </h2>
                  <SampleChip />
                </div>
                <p className="mt-1 text-xs text-ink-500">{t('analytics.scoreGrowthHint')}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold text-navy-900">
                  <CountUp to={PROJECTED} />
                </p>
                <p className="text-xs text-success-600">
                  {t('analytics.sinceStart', { n: gained })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex-1">
              <AreaChart
                data={series}
                labels={seriesLabels}
                min={1100}
                max={1600}
                color={CHART_BRAND}
                height={230}
              />
            </div>
          </div>
        </Reveal>
      </div>

      {/* This week — REAL study activity (no sample chip) */}
      <Reveal>
        <ThisWeekCard coursesCompleted={coursesCompleted} homeReady={!home.isLoading} />
      </Reveal>

      {/* Milestones (sample data) */}
      <section>
        <SectionHeader
          icon={<TargetIcon className="size-4" />}
          title={t('analytics.milestones')}
          hint={t('analytics.milestonesHint')}
          sample
        />
        <Stagger className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" stagger={0.08}>
          {MILESTONES.map((m) => (
            <StaggerItem key={m}>
              <MilestoneCard target={m} projected={PROJECTED} start={START} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Subject performance + accuracy trend (sample data) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-navy-900">
                {t('analytics.subjectPerformance')}
              </h2>
              <SampleChip />
            </div>
            <div className="mt-5 space-y-5">
              {SUBJECTS.map((s) => (
                <div key={s.label}>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="font-medium text-navy-900">{s.label}</span>
                    <span className="text-ink-500">
                      <span className="font-semibold text-navy-900">
                        <CountUp to={s.score} />
                      </span>{' '}
                      / {s.max} · {s.accuracy}% {t('analytics.accuracy')}
                    </span>
                  </div>
                  <ProgressBar
                    value={s.score}
                    max={s.max}
                    fillClassName={cn('bg-gradient-to-r', s.color)}
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="h-full rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-navy-900">
                  {t('analytics.accuracyTrend')}
                </h2>
                <SampleChip />
              </div>
              <span className="text-sm font-semibold text-success-600">
                {ACCURACY_TREND[ACCURACY_TREND.length - 1]}%
              </span>
            </div>
            <div className="mt-4">
              <AreaChart
                data={ACCURACY_TREND}
                labels={WEEK_LABELS}
                min={50}
                max={100}
                color={CHART_SUCCESS}
                height={200}
              />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Strengths + focus areas (sample data) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <SkillList
            title={t('analytics.strengths')}
            tone="success"
            items={STRENGTHS}
          />
        </Reveal>
        <Reveal>
          <SkillList title={t('analytics.focusAreas')} tone="warn" items={FOCUS} />
        </Reveal>
      </div>

      {/* Time by topic (sample data) */}
      <Reveal>
        <TimeByTopicCard />
      </Reveal>

      {/* Recommended next actions — generic, truthful suggestions */}
      <section>
        <SectionHeader
          icon={<FlagIcon className="size-4" />}
          title={t('analytics.nextActions')}
        />
        <Stagger className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3" stagger={0.08}>
          <StaggerItem className="h-full">
            <ActionCard
              to="/quizzes"
              title={t('analytics.action.practice.title')}
              body={t('analytics.action.practice.body')}
              cta={t('analytics.action.practice.cta')}
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <ActionCard
              to="/explore"
              title={t('analytics.action.course.title')}
              body={t('analytics.action.course.body')}
              cta={t('analytics.action.course.cta')}
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <ActionCard
              to="/learning-path"
              title={
                coursesCompleted > 0
                  ? t('analytics.action.keepGoing.title')
                  : t('analytics.action.mock.title')
              }
              body={t('analytics.action.mock.body')}
              cta={t('analytics.action.mock.cta')}
            />
          </StaggerItem>
        </Stagger>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Small chip marking a card whose data is hardcoded sample data. */
function SampleChip({ dark = false }: { dark?: boolean }) {
  const t = useT();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        dark
          ? 'border-white/20 bg-white/10 text-white/70'
          : 'border-ink-200 bg-ink-50 text-ink-500',
      )}
    >
      {t('analytics.sampleBadge')}
    </span>
  );
}

/**
 * Real weekly study activity — GET /me/activity/weekly via the existing
 * `useWeeklyActivity()` hook. Truthful loading / error / zero states, and
 * deliberately NO sample chip.
 */
function ThisWeekCard({
  coursesCompleted,
  homeReady,
}: {
  coursesCompleted: number;
  homeReady: boolean;
}) {
  const t = useT();
  const activity = useWeeklyActivity();

  const studiedMinutes = activity.data?.minutes_learned_total ?? 0;
  const goal = activity.data?.weekly_goal_minutes ?? 0;
  const activeDays = (activity.data?.days ?? []).filter((d) => d.minutes_learned > 0).length;
  const hours = Math.floor(studiedMinutes / 60);
  const mins = studiedMinutes % 60;

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <ClockIcon className="size-4" />
          </span>
          <h2 className="text-base font-semibold text-navy-900">{t('analytics.thisWeekTitle')}</h2>
        </div>
        <p className="text-xs text-ink-500">{t('analytics.thisWeekHint')}</p>
      </div>

      {activity.isLoading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : activity.error ? (
        <div className="mt-5 flex flex-col items-start gap-3">
          <p className="text-sm text-danger-600">{t('analytics.thisWeekError')}</p>
          <Button variant="outline" size="sm" onClick={() => void activity.refetch()}>
            {t('analytics.retry')}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <RealStat
              label={t('analytics.studied')}
              value={t('analytics.hoursMinutes', { h: hours, m: mins })}
            />
            <RealStat label={t('analytics.activeDays')} value={`${activeDays}/7`} />
            <RealStat
              label={t('analytics.coursesCompleted')}
              value={homeReady ? String(coursesCompleted) : '—'}
            />
          </div>

          <div className="mt-5">
            {goal > 0 ? (
              <>
                <div className="mb-1.5 flex items-center justify-between text-xs text-ink-500">
                  <span>{t('analytics.goalProgress', { done: studiedMinutes, goal })}</span>
                  <span className="font-medium text-navy-900">
                    {Math.min(100, Math.round((studiedMinutes / goal) * 100))}%
                  </span>
                </div>
                <ProgressBar value={studiedMinutes} max={goal} />
              </>
            ) : (
              <p className="text-xs text-ink-400">{t('analytics.noGoal')}</p>
            )}
          </div>

          {studiedMinutes === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-ink-300 bg-ink-50/50 px-4 py-3 text-sm text-ink-500">
              {t('analytics.thisWeekEmpty')}{' '}
              <Link to="/dashboard" className="font-medium text-brand-600 hover:underline">
                {t('analytics.action.mock.cta')}
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}

function RealStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-navy-900">{value}</p>
    </div>
  );
}

function TimeByTopicCard() {
  const t = useT();
  const reduce = useReducedMotion();
  const maxMin = Math.max(...TIME_BY_TOPIC.map((x) => x.minutes));
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <ClockIcon className="size-4" />
          </span>
          <h2 className="text-base font-semibold text-navy-900">{t('analytics.timeByTopic')}</h2>
          <SampleChip />
        </div>
        <p className="text-xs text-ink-500">{t('analytics.thisWeek')}</p>
      </div>
      <Stagger className="mt-5 space-y-3" stagger={0.06}>
        {TIME_BY_TOPIC.map((topic) => {
          const pct = (topic.minutes / maxMin) * 100;
          return (
            <StaggerItem key={topic.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-sm text-ink-700 sm:w-28">
                {topic.label}
              </span>
              <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-progress-bg">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                  initial={reduce ? false : { width: 0 }}
                  whileInView={reduce ? undefined : { width: `${pct}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={reduce ? { width: `${pct}%` } : undefined}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums text-navy-900">
                {t('analytics.hoursMinutes', {
                  h: Math.floor(topic.minutes / 60),
                  m: topic.minutes % 60,
                })}
              </span>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: '4w' | '8w' | 'all';
  onChange: (v: '4w' | '8w' | 'all') => void;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const opts: Array<{ v: '4w' | '8w' | 'all'; label: string }> = [
    { v: '4w', label: t('analytics.period.4w') },
    { v: '8w', label: t('analytics.period.8w') },
    { v: 'all', label: t('analytics.period.all') },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1 text-xs">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={cn(
            'relative min-h-9 rounded-full px-3 font-medium transition-colors',
            value === o.v ? 'text-white' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {value === o.v &&
            (reduce ? (
              <span className="absolute inset-0 -z-0 rounded-full bg-brand-600" />
            ) : (
              <motion.span
                layoutId="analytics-period"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 -z-0 rounded-full bg-brand-600"
              />
            ))}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  hint,
  inline,
  sample,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  inline?: boolean;
  sample?: boolean;
}) {
  return (
    <div className={cn(inline ? 'flex items-center justify-between' : '')}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-navy-900">{title}</h2>
        {sample && <SampleChip />}
      </div>
      {hint && (
        <p className={cn('text-xs text-ink-500', inline ? '' : 'ml-9 mt-0.5')}>{hint}</p>
      )}
    </div>
  );
}

function MilestoneCard({
  target,
  projected,
  start,
}: {
  target: number;
  projected: number;
  start: number;
}) {
  const t = useT();
  const reached = projected >= target;
  // "In reach" = the next milestone above the current projection.
  const inReach = !reached && projected >= target - 100;
  const pct = Math.min(100, Math.round(((projected - start) / (target - start)) * 100));

  const status = reached
    ? { label: t('analytics.reached'), tone: 'text-success-600' }
    : inReach
      ? { label: t('analytics.current'), tone: 'text-brand-600' }
      : { label: t('analytics.locked'), tone: 'text-ink-400' };

  return (
    <div
      className={cn(
        'relative h-full overflow-hidden rounded-2xl border p-4 transition-colors sm:p-5',
        reached
          ? 'border-success-500/30 bg-success-50/50'
          : inReach
            ? 'border-brand-300 bg-brand-25'
            : 'border-ink-200 bg-white',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'grid size-10 place-items-center rounded-xl',
            reached
              ? 'bg-success-500 text-white'
              : inReach
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-400',
          )}
        >
          {reached ? (
            <CheckIcon className="size-5" />
          ) : inReach ? (
            <TargetIcon className="size-5" />
          ) : (
            <LockIcon className="size-4" />
          )}
        </span>
        <span className={cn('text-xs font-semibold', status.tone)}>{status.label}</span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-navy-900">{target}+</p>
      {!reached && (
        <div className="mt-3">
          <ProgressBar value={pct} fillClassName={inReach ? 'bg-brand-600' : 'bg-ink-300'} />
          <p className="mt-1.5 text-xs text-ink-500">
            {t('analytics.pctThere', { pct })}
          </p>
        </div>
      )}
    </div>
  );
}

function SkillList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: 'success' | 'warn';
  items: readonly { label: string; value: number }[];
}) {
  const barColor = tone === 'success' ? 'bg-success-500' : 'bg-warn-500';
  const valueColor = tone === 'success' ? 'text-success-600' : 'text-warn-500';
  return (
    <div className="h-full rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-navy-900">{title}</h2>
        <SampleChip />
      </div>
      <ul className="mt-4 space-y-3.5">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink-700">{item.label}</span>
              <span className={cn('shrink-0 font-semibold', valueColor)}>{item.value}%</span>
            </div>
            <ProgressBar value={item.value} fillClassName={barColor} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionCard({
  to,
  title,
  body,
  cta,
}: {
  to: string;
  title: string;
  body: string;
  cta: string;
}) {
  const reduce = useReducedMotion();
  return (
    <Link to={to} className="block h-full">
      <motion.div
        whileHover={reduce ? undefined : { y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
      >
        <h3 className="text-base font-semibold text-navy-900">{title}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-500">{body}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
          {cta}
          <ArrowRightIcon className="size-4" />
        </span>
      </motion.div>
    </Link>
  );
}
