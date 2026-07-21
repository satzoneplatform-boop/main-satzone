import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ArrowRightIcon, PlayIcon } from '@/components/icons';
import { staggerContainer, transitions } from '@/components/motion/variants';
import { useT } from '@/i18n/I18nProvider';
import type { EnrollmentRead, UserMe } from '@/types/api';

interface DashboardGreetingProps {
  user?: UserMe | null;
  enrollments: EnrollmentRead[];
  weeklyGoalMinutes: number;
}

/**
 * Navy welcome banner with the shield/acorn brand pattern.
 *
 * Every figure is derived from real data — enrollment progress, counts, and
 * the saved weekly goal — so nothing here fabricates backend behaviour.
 */
export function DashboardGreeting({
  user,
  enrollments,
  weeklyGoalMinutes,
}: DashboardGreetingProps) {
  const t = useT();

  const firstName = user?.full_name?.split(' ')[0] ?? t('common.you');
  const greeting = greetingForHour(new Date().getHours(), t);

  const inProgress = enrollments.filter(
    (e) => !e.completed_at && e.progress_percent > 0,
  ).length;
  const completed = enrollments.filter((e) => e.completed_at).length;

  // Overall prep progress = mean completion across enrolled courses.
  const overall =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, e) => sum + e.progress_percent, 0) /
            enrollments.length,
        )
      : 0;

  const weeklyGoalHours = Math.round((weeklyGoalMinutes / 60) * 10) / 10;

  // Resume target: first in-progress course, else null.
  const resume = enrollments.find((e) => !e.completed_at && e.progress_percent > 0) ?? enrollments[0];
  const resumeTo = resume
    ? resume.last_lesson
      ? `/courses/${resume.course.slug}/lessons/${resume.last_lesson.id}`
      : `/courses/${resume.course.slug}/learn`
    : null;

  const stats = [
    { value: inProgress, label: t('dashboard.greeting.inProgress') },
    { value: completed, label: t('dashboard.greeting.completed') },
    {
      value: weeklyGoalHours > 0 ? `${weeklyGoalHours}h` : '—',
      label: t('dashboard.greeting.weeklyGoal'),
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-navy-900 text-white shadow-[var(--shadow-card)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />

      <motion.div
        variants={staggerContainer(0.09, 0.05)}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col items-start justify-between gap-6 p-6 sm:p-7 lg:flex-row lg:items-center"
      >
        <div className="min-w-0">
          <GreetItem>
            <p className="text-sm font-medium text-brand-300">{greeting},</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {firstName}
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/60">
              {t('dashboard.greeting.subtitle')}
            </p>
          </GreetItem>

          <GreetItem>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {resumeTo ? (
                <Link to={resumeTo}>
                  <Button leftIcon={<PlayIcon />}>{t('dashboard.greeting.resume')}</Button>
                </Link>
              ) : (
                <Link to="/explore">
                  <Button rightIcon={<ArrowRightIcon />}>
                    {t('dashboard.greeting.explore')}
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-5">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-lg font-bold leading-none">{s.value}</p>
                    <p className="mt-1 text-xs text-white/50">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </GreetItem>
        </div>

        <GreetItem className="mx-auto shrink-0 lg:mx-0">
          <ScoreRing
            value={overall}
            max={100}
            suffix="%"
            size={124}
            label={t('dashboard.greeting.progressLabel')}
            valueClassName="text-white"
            ringClassName="text-accent-500"
            trackClassName="text-white/10"
          />
        </GreetItem>
      </motion.div>
    </section>
  );
}

function GreetItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: transitions.base },
      }}
    >
      {children}
    </motion.div>
  );
}

function greetingForHour(hour: number, t: ReturnType<typeof useT>): string {
  if (hour < 12) return t('dashboard.greeting.morning');
  if (hour < 18) return t('dashboard.greeting.afternoon');
  return t('dashboard.greeting.evening');
}
