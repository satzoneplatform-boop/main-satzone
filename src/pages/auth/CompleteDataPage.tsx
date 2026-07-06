import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrength';
import { evaluatePassword } from '@/lib/password';
import { useRegister, authErrorMessage } from '@/features/auth/hooks';
import { signupStore } from '@/features/auth/signupStore';
import { useT } from '@/i18n/I18nProvider';

/**
 * Sign-up wizard, step 2. Collects name + password and POSTs
 * /auth/register (the deployed endpoint accepts only
 * {email, full_name, password} — no phone). Phone verification
 * happens later via the Telegram bot OTP flow.
 */
export function CompleteDataPage() {
  const t = useT();
  const navigate = useNavigate();
  const draft = useMemo(() => signupStore.get(), []);
  const register = useRegister();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft?.email) navigate('/sign-up', { replace: true });
  }, [draft, navigate]);

  if (!draft?.email) return <Navigate to="/sign-up" replace />;

  const checks = evaluatePassword(password);
  const passwordValid = checks.uppercase && checks.number && checks.length;
  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    passwordValid;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({
        email: draft!.email,
        full_name: `${firstName} ${lastName}`.trim(),
        password,
      });
      navigate('/sign-up/check-email', {
        state: { email: draft!.email },
        replace: true,
      });
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthCenteredLayout>
      <Card className="w-full max-w-md">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              {t('auth.completeData.title')}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {t('auth.completeData.subtitle', { email: draft.email })}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('auth.completeData.firstName')}
              required
              autoComplete="given-name"
              placeholder={t('auth.completeData.firstNamePlaceholder')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label={t('auth.completeData.lastName')}
              required
              autoComplete="family-name"
              placeholder={t('auth.completeData.lastNamePlaceholder')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <PasswordInput
              label={t('auth.signIn.password')}
              required
              autoComplete="new-password"
              placeholder={t('auth.completeData.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && (
              <div className="mt-3">
                <PasswordStrengthMeter value={password} />
              </div>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={register.isPending}
            disabled={!canSubmit}
          >
            {t('auth.signUp.continue')}
          </Button>
        </form>
      </Card>
    </AuthCenteredLayout>
  );
}
