import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  PasswordStrengthMeter,
  evaluatePassword,
} from '@/components/ui/PasswordStrength';
import { ChevronDownIcon } from '@/components/icons';
import { useRegister, authErrorMessage } from '@/features/auth/hooks';
import { signupStore } from '@/features/auth/signupStore';

/**
 * Sign-up wizard, step 2. Collects name + password and POSTs
 * /auth/register (the deployed endpoint accepts only
 * {email, full_name, password} — no phone). Phone verification
 * happens later via the Telegram bot OTP flow.
 */
export function CompleteDataPage() {
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
    <AuthCenteredLayout
      headerSlot={
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-700 shadow-[var(--shadow-input)] hover:bg-ink-50"
        >
          <span aria-hidden>🇺🇸</span>
          <span>English (EN)</span>
          <ChevronDownIcon className="text-ink-400" />
        </button>
      }
    >
      <Card className="w-full max-w-md">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              Complete data
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              We&apos;ll send a verification link to {draft.email}. You
              can verify your phone later via Telegram.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-danger-500/30 bg-red-50 px-3 py-2 text-sm text-danger-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              required
              autoComplete="given-name"
              placeholder="Ex : Hendrick"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last name"
              required
              autoComplete="family-name"
              placeholder="Ex : Finn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <PasswordInput
              label="Password"
              required
              autoComplete="new-password"
              placeholder="Enter password"
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
            Continue
          </Button>
        </form>
      </Card>
    </AuthCenteredLayout>
  );
}
