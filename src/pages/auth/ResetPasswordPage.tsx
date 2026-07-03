import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrength';
import { evaluatePassword } from '@/lib/password';
import { useResetPassword, authErrorMessage } from '@/features/auth/hooks';
import { useT } from '@/i18n/I18nProvider';

export function ResetPasswordPage() {
  const t = useT();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reset = useResetPassword();

  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!token) return <Navigate to="/sign-in" replace />;

  const checks = evaluatePassword(password);
  const passwordValid = checks.uppercase && checks.number && checks.length;
  const matches = password === confirm;
  const canSubmit = passwordValid && matches;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!matches) {
      setError(t('auth.reset.mismatch'));
      return;
    }
    try {
      await reset.mutateAsync({ token, newPassword: password });
      navigate('/reset-password/success', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthCenteredLayout showHeader showFooter={false}>
      <Card className="w-full max-w-md">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              {t('auth.reset.title')}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {t('auth.reset.changingFor')}{' '}
              <span className="font-medium break-all text-brand-600">
                {email || t('auth.reset.yourAccount')}
              </span>
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-danger-500/30 bg-danger-50 px-3 py-2.5 text-sm text-danger-600"
            >
              {error}
            </div>
          )}

          <div>
            <PasswordInput
              label={t('auth.signIn.password')}
              required
              autoComplete="new-password"
              placeholder={t('auth.reset.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && (
              <div className="mt-3">
                <PasswordStrengthMeter value={password} />
              </div>
            )}
          </div>

          <PasswordInput
            label={t('auth.reset.confirmLabel')}
            required
            autoComplete="new-password"
            placeholder={t('auth.reset.confirmPlaceholder')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={confirm && !matches ? t('auth.reset.mismatch') : undefined}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={reset.isPending}
            disabled={!canSubmit}
          >
            {t('auth.reset.confirm')}
          </Button>

          <Button
            type="button"
            fullWidth
            variant="outline"
            size="lg"
            onClick={() => navigate('/sign-in')}
          >
            {t('auth.reset.wrongEmail')}
          </Button>
        </form>
      </Card>
    </AuthCenteredLayout>
  );
}
