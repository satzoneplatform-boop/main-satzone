import { useLocation, useNavigate } from 'react-router-dom';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckIcon, MailIcon } from '@/components/icons';
import { useResendVerification } from '@/features/auth/hooks';
import { useT } from '@/i18n/I18nProvider';

/**
 * Post-register landing page (FRONTEND.md §2 — registration returns 202 with
 * "go check your inbox", no user row exists until the link is clicked).
 */
export function CheckEmailPage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? '';
  const resend = useResendVerification();

  return (
    <AuthCenteredLayout showFooter={false}>
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <MailIcon />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">
          {t('auth.checkEmail.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          {t('auth.checkEmail.sentTo')}{' '}
          <span className="font-medium break-all text-ink-700">
            {email || t('auth.checkEmail.yourEmail')}
          </span>
          . {t('auth.checkEmail.instruction')}
        </p>

        {resend.isSuccess && (
          <p
            role="status"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-xs font-medium text-success-600"
          >
            <CheckIcon className="size-3.5" />
            {t('auth.checkEmail.resent')}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            loading={resend.isPending}
            disabled={!email}
            onClick={() => email && resend.mutate(email)}
          >
            {resend.isPending ? t('auth.checkEmail.resending') : t('auth.checkEmail.resend')}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => navigate('/sign-in')}>
            {t('auth.checkEmail.backToSignIn')}
          </Button>
        </div>
      </Card>
    </AuthCenteredLayout>
  );
}
