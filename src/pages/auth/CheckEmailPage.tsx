import { useLocation, useNavigate } from 'react-router-dom';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MailIcon } from '@/components/icons';
import { useResendVerification } from '@/features/auth/hooks';

/**
 * Post-register landing page (FRONTEND.md §2 — registration returns 202 with
 * "go check your inbox", no user row exists until the link is clicked).
 */
export function CheckEmailPage() {
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
          Check your email
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          We sent a verification link to{' '}
          <span className="font-medium text-ink-700">{email || 'your email'}</span>.
          <br />
          Click the link in the message to activate your account.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            disabled={!email || resend.isPending}
            onClick={() => email && resend.mutate(email)}
          >
            {resend.isPending
              ? 'Sending…'
              : resend.isSuccess
                ? 'Verification link resent'
                : 'Resend verification email'}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => navigate('/sign-in')}>
            Back to sign in
          </Button>
        </div>
      </Card>
    </AuthCenteredLayout>
  );
}
