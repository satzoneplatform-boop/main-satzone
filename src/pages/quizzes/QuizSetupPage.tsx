import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@/api/errors';
import { ArrowRightIcon, FlagIcon } from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useQuizSet } from '@/features/quizzes/hooks';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import type { QuizMode } from '@/types/api';

export function QuizSetupPage() {
  const { slug, setId } = useParams<{ slug: string; setId: string }>();
  const t = useT();
  const navigate = useNavigate();
  const set = useQuizSet(setId);
  const [mode, setMode] = useState<QuizMode>('mcq');

  if (set.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (set.error instanceof ApiError) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-sm font-semibold text-ink-900">
          {set.error.status === 404
            ? t('quizzes.notReadyTitle')
            : t('quizzes.errorTitle')}
        </p>
        <p className="mt-1 text-sm text-ink-500">
          {set.error.status === 404
            ? t('quizzes.notReadyBody')
            : set.error.message}
        </p>
        <Link to={`/quizzes/${slug}`}>
          <Button variant="outline" className="mt-4">
            {t('quizzes.backToPath')}
          </Button>
        </Link>
      </div>
    );
  }

  if (!set.data) return null;

  function onStart() {
    navigate(`/quizzes/${slug}/sets/${setId}/play?mode=${mode}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumb
        items={[
          { label: t('quizzes.title'), to: '/quizzes' },
          { label: 'SAT Zone', to: `/quizzes/${slug}` },
          { label: set.data.title },
        ]}
      />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {set.data.title}
        </h1>
        {set.data.description && (
          <p className="text-sm text-ink-500">{set.data.description}</p>
        )}
        <p className="text-xs text-ink-500">
          {t('quizzes.items', { n: set.data.items_count })}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          {t('quizzes.pickMode')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            active={mode === 'mcq'}
            onClick={() => setMode('mcq')}
            emoji="📝"
            title={t('quizzes.mode.mcq.title')}
            body={t('quizzes.mode.mcq.body')}
          />
          <ModeCard
            active={mode === 'matching'}
            onClick={() => setMode('matching')}
            emoji="🔗"
            title={t('quizzes.mode.matching.title')}
            body={t('quizzes.mode.matching.body')}
          />
        </div>
      </section>

      <Button onClick={onStart} fullWidth size="lg" rightIcon={<ArrowRightIcon />}>
        {t('quizzes.startGame')}
      </Button>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  emoji,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 rounded-2xl border bg-white p-5 text-left transition-colors',
        active
          ? 'border-brand-500 ring-2 ring-brand-100'
          : 'border-ink-200 hover:border-ink-300',
      )}
      aria-pressed={active}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="mt-2 text-base font-semibold text-ink-900">{title}</span>
      <span className="text-xs text-ink-500">{body}</span>
      {active && (
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
          <FlagIcon className="size-3" />
          {/* tiny "selected" indicator */}
          ✓
        </span>
      )}
    </button>
  );
}
