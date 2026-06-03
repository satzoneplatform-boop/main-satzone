import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { ApiError } from '@/api/errors';
import { authErrorMessage, useVerifyEmail } from '@/features/auth/hooks';
import { useT } from '@/i18n/I18nProvider';

/**
 * Landing page for the email verification link.
 *
 * Backend emails point at `{FRONTEND_URL}/auth/verify-email?token=…` so
 * the user lands on our HTTPS frontend (avoids the mixed-content / HTTP
 * unreachable problem when the backend domain is HTTPS-only). We POST
 * the token to /auth/verify-email and then route to /sign-in.
 */
export function VerifyEmailPage() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const verify = useVerifyEmail();

  // StrictMode double-fires every effect in dev; the second call would
  // hit "invalid_token" because the first one already consumed the row.
  const ranRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!token) {
      setError(t('verifyEmail.missingToken'));
      return;
    }
    verify.mutate(token, {
      onSuccess: () => setDone(true),
      onError: (err) => {
        // Common backend codes:
        //  - invalid_token  → tampered / never existed
        //  - token_expired  → past the 48h window
        //  - already_verified → no-op success, treat as success
        if (err instanceof ApiError && err.code === 'already_verified') {
          setDone(true);
          return;
        }
        setError(authErrorMessage(err));
      },
    });
  }, [token, verify, t]);

  return (
    <AuthCenteredLayout>
      <Card className="w-full max-w-md p-6 text-center sm:p-8">
        {verify.isPending && !done && !error ? (
          <div className="grid place-items-center py-10">
            <Spinner size="lg" />
            <p className="mt-3 text-sm text-ink-500">{t('verifyEmail.checking')}</p>
          </div>
        ) : done ? (
          <div className="space-y-4">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-50 text-success-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink-900">
                {t('verifyEmail.successTitle')}
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                {t('verifyEmail.successBody')}
              </p>
            </div>
            <Button fullWidth onClick={() => navigate('/sign-in', { replace: true })}>
              {t('verifyEmail.signIn')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-danger-50 text-danger-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink-900">
                {t('verifyEmail.errorTitle')}
              </h1>
              <p className="mt-1 text-sm text-ink-500">{error}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/sign-in">
                <Button fullWidth variant="outline">
                  {t('verifyEmail.signIn')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </AuthCenteredLayout>
  );
}
