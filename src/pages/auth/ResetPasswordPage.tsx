import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  evaluatePassword,
} from '@/components/ui/PasswordStrength';
import { useResetPassword, authErrorMessage } from '@/features/auth/hooks';

export function ResetPasswordPage() {
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
      setError('Passwords do not match.');
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
              Reset your password
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Changing password for{' '}
              <span className="font-medium text-brand-600">
                {email || 'your account'}
              </span>
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-danger-500/30 bg-red-50 px-3 py-2 text-sm text-danger-600">
              {error}
            </div>
          )}

          <PasswordInput
            label="Password"
            required
            autoComplete="new-password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordInput
            label="Confirm password"
            required
            autoComplete="new-password"
            placeholder="Re enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={confirm && !matches ? 'Passwords do not match.' : undefined}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={reset.isPending}
            disabled={!canSubmit}
          >
            Confirm
          </Button>

          <Button
            type="button"
            fullWidth
            variant="outline"
            size="lg"
            onClick={() => navigate('/sign-in')}
          >
            Wrong email?
          </Button>
        </form>
      </Card>
    </AuthCenteredLayout>
  );
}
