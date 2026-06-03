import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@/api/errors';
import { ArrowRightIcon, CheckIcon } from '@/components/icons';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { usePracticeQuiz } from '@/features/quizzes/hooks';
import { useT } from '@/i18n/I18nProvider';

/**
 * Pre-play setup screen. With the new practice API each quiz is a
 * fixed mix of MCQ + Matching items — no mode picker. We just show
 * the quiz blurb, item count, prior-best score, and a Start button.
 */
export function QuizSetupPage() {
  const { slug, quizId } = useParams<{ slug: string; quizId: string }>();
  const t = useT();
  const navigate = useNavigate();
  const quiz = usePracticeQuiz(quizId);

  if (quiz.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (quiz.error instanceof ApiError) {
    const notFound = quiz.error.status === 404;
    const notEnrolled = quiz.error.code === 'not_enrolled';
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-sm font-semibold text-ink-900">
          {notEnrolled
            ? t('quizzes.notEnrolledTitle')
            : notFound
              ? t('quizzes.notReadyTitle')
              : t('quizzes.errorTitle')}
        </p>
        <p className="mt-1 text-sm text-ink-500">
          {notEnrolled
            ? t('quizzes.notEnrolledBody')
            : notFound
              ? t('quizzes.notReadyBody')
              : quiz.error.message}
        </p>
        <Link to={`/quizzes/${slug}`}>
          <Button variant="outline" className="mt-4">
            {t('quizzes.backToPath')}
          </Button>
        </Link>
      </div>
    );
  }

  if (!quiz.data) return null;

  function onStart() {
    navigate(`/quizzes/${slug}/q/${quizId}/play`);
  }

  const p = quiz.data.progress;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumb
        items={[
          { label: t('quizzes.title'), to: '/quizzes' },
          { label: 'SAT Zone', to: `/quizzes/${slug}` },
          { label: quiz.data.title },
        ]}
      />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {quiz.data.title}
        </h1>
        {quiz.data.description && (
          <p className="text-sm text-ink-500">{quiz.data.description}</p>
        )}
        <p className="text-xs text-ink-500">
          {t('quizzes.items', { n: quiz.data.item_count })}
        </p>
      </header>

      {p.attempts_count > 0 && (
        <section className="rounded-2xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-500">
                {t('quizzes.best.label')}
              </p>
              <p className="mt-1 text-2xl font-semibold text-success-600">
                {p.best_score_percent}%
              </p>
            </div>
            <div className="text-right text-xs text-ink-500">
              {t('quizzes.attempts', { n: p.attempts_count })}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-base font-semibold text-ink-900">
          {t('quizzes.howItWorks.title')}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-700">
          <Bullet>{t('quizzes.howItWorks.mix')}</Bullet>
          <Bullet>{t('quizzes.howItWorks.allOrNothing')}</Bullet>
          <Bullet>{t('quizzes.howItWorks.replay')}</Bullet>
        </ul>
      </section>

      <Button
        onClick={onStart}
        fullWidth
        size="lg"
        rightIcon={<ArrowRightIcon />}
      >
        {t('quizzes.startGame')}
      </Button>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-success-50 text-success-600">
        <CheckIcon className="size-3" />
      </span>
      <span>{children}</span>
    </li>
  );
}
