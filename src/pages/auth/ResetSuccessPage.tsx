import { useNavigate } from 'react-router-dom';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { Button } from '@/components/ui/Button';
import { LoginIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';

export function ResetSuccessPage() {
  const t = useT();
  const navigate = useNavigate();
  return (
    <AuthCenteredLayout showFooter={false}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-ink-200">
        <div className="bg-gradient-to-b from-success-50 to-white px-6 pt-12 pb-10 text-center sm:px-8">
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-white shadow-md">
            <SuccessBadge />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink-900">
            {t('auth.resetSuccess.title')}
          </h1>
          <p className="mt-2 text-sm text-ink-500">{t('auth.resetSuccess.body')}</p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              leftIcon={<LoginIcon />}
              onClick={() => navigate('/sign-in')}
            >
              {t('auth.resetSuccess.login')}
            </Button>
          </div>
        </div>
      </div>
    </AuthCenteredLayout>
  );
}

function SuccessBadge() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className="text-success-500"
    >
      <path
        d="M32 4l5.7 4.3 7-1 2 6.8 6.8 2-1 7L57 32l-4.3 5.7 1 7-6.8 2-2 6.8-7-1L32 56l-5.7-4.3-7 1-2-6.8-6.8-2 1-7L7 32l4.3-5.7-1-7 6.8-2 2-6.8 7 1L32 4Z"
        fill="currentColor"
      />
      <path
        d="M22 32.5l7 7 13-14"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
