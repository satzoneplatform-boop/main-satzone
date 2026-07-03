import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { GoogleIcon } from '@/components/icons';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/api/errors';
import { authErrorMessage, googleSignInUrl } from '@/features/auth/hooks';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { EmailSentModal } from './EmailSentModal';

type ModalKind = 'forgot' | 'sent' | null;
type Mode = 'email' | 'phone';

/**
 * Sign-in — supports both POST /auth/login {email, password} and
 * POST /auth/login/phone {phone_number, password} depending on which
 * tab the user picks. AuthProvider dispatches by payload shape.
 */
export function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const canSubmit =
    (mode === 'email' ? Boolean(email) : phone.replace(/\D/g, '').length >= 8) &&
    Boolean(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'email') {
        await login({ email, password });
      } else {
        await login({ phone_number: phone, password });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? authErrorMessage(err) : t('auth.signIn.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AuthSplitLayout
        footer={
          <p>
            {t('auth.signIn.footer')}{' '}
            <a href="#" className="underline">{t('auth.signUp.terms')}</a>{' '}
            {t('auth.signUp.and')}{' '}
            <a href="#" className="underline">{t('auth.signUp.privacy')}</a>.
          </p>
        }
      >
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <LogoMark size={40} />
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900">
              {t('auth.signIn.welcome')}
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              {t('auth.signIn.welcomeSubtitle')}
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
            {t('auth.signIn.signInWithGoogle')}
          </Button>

          <Divider label={t('auth.signIn.orWithEmail')} />

          <div
            role="tablist"
            aria-label={t('auth.signIn.signInWith')}
            className="grid grid-cols-2 rounded-lg border border-ink-200 bg-ink-50 p-1 text-sm font-medium"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'email'}
              onClick={() => setMode('email')}
              className={cn(
                'min-h-11 rounded-md py-2 transition-colors',
                mode === 'email'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700',
              )}
            >
              {t('auth.signIn.email')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'phone'}
              onClick={() => setMode('phone')}
              className={cn(
                'min-h-11 rounded-md py-2 transition-colors',
                mode === 'phone'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700',
              )}
            >
              {t('auth.signIn.phone')}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-danger-500/30 bg-danger-50 px-3 py-2.5 text-sm text-danger-600"
            >
              {error}
            </div>
          )}

          {mode === 'email' ? (
            <Input
              label={t('auth.signIn.email')}
              type="email"
              autoComplete="email"
              required
              placeholder={t('auth.signIn.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          ) : (
            <PhoneInput
              label={t('auth.signIn.phone')}
              value={phone}
              onChange={setPhone}
            />
          )}

          <PasswordInput
            label={t('auth.signIn.password')}
            required
            autoComplete="current-password"
            placeholder={t('auth.signIn.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2 py-2 text-ink-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              {t('auth.signIn.rememberMe')}
            </label>
            <button
              type="button"
              onClick={() => {
                setRecoveryEmail(email);
                setModal('forgot');
              }}
              className="rounded-md py-2 font-medium text-brand-600 hover:underline"
            >
              {t('auth.signIn.forgotPassword')}
            </button>
          </div>

          <Button type="submit" fullWidth size="lg" loading={submitting} disabled={!canSubmit}>
            {t('auth.signIn.continue')}
          </Button>

          <p className="text-center text-sm text-ink-500">
            {t('auth.signIn.noAccount')}{' '}
            <Link to="/sign-up" className="font-medium text-brand-600 hover:underline">
              {t('auth.signIn.signUp')}
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
