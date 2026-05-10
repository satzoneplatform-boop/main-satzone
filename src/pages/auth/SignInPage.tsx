import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { GoogleIcon } from '@/components/icons';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/api/errors';
import { authErrorMessage, googleSignInUrl } from '@/features/auth/hooks';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { EmailSentModal } from './EmailSentModal';

type ModalKind = 'forgot' | 'sent' | null;

export function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? authErrorMessage(err) : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AuthSplitLayout
        footer={
          <p>
            By continuing you agree to the{' '}
            <a href="#" className="underline">Terms of Services</a> and{' '}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
        }
      >
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <LogoMark size={40} />
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900">
              Welcome to IdrokHub
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Login with your account and Password
              <br />
              or create new account
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            fullWidth
            leftIcon={<GoogleIcon />}
            onClick={() => {
              window.location.href = googleSignInUrl();
            }}
          >
            Sign up with Google
          </Button>

          <Divider label="Or sign in with email" />

          {error && (
            <div className="rounded-md border border-danger-500/30 bg-red-50 px-3 py-2 text-sm text-danger-600">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            label="Password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-ink-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => {
                setRecoveryEmail(email);
                setModal('forgot');
              }}
              className="font-medium text-brand-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" fullWidth size="lg" loading={submitting} disabled={!email || !password}>
            Continue
          </Button>

          <p className="text-center text-sm text-ink-500">
            Don’t have an account?{' '}
            <Link to="/sign-up" className="font-medium text-brand-600 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </AuthSplitLayout>

      <ForgotPasswordModal
        open={modal === 'forgot'}
        defaultEmail={recoveryEmail}
        onClose={() => setModal(null)}
        onSent={(email) => {
          setRecoveryEmail(email);
          setModal('sent');
        }}
      />
      <EmailSentModal
        open={modal === 'sent'}
        email={recoveryEmail}
        onClose={() => setModal(null)}
      />
    </>
  );
}
