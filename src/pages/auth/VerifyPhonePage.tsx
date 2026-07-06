import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { authErrorMessage, useVerifyPhone } from '@/features/auth/hooks';
import { useT } from '@/i18n/I18nProvider';
import { env } from '@/lib/env';

/**
 * Phone verification.
 *
 *  - Open the Telegram bot (`VITE_TELEGRAM_BOT_URL`). The user shares
 *    their phone via Telegram's contact-share button; the bot calls
 *    /internal/phone/issue-otp and DMs the OTP back.
 *  - User types the OTP here. POST /auth/verify-phone { otp } links the
 *    phone to their account and flips is_phone_verified.
 */
export function VerifyPhonePage() {
  const t = useT();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const verifyPhone = useVerifyPhone();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const botUrl = env.telegramBotUrl;

  useEffect(() => {
    if (user?.is_phone_verified) {
      navigate('/dashboard', { replace: true });
      return;
    }
    otpRef.current?.focus();
  }, [user?.is_phone_verified, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = otp.trim();
    if (trimmed.length < 4) {
      setError(t('verifyPhone.codeTooShort'));
      return;
    }
    try {
      await verifyPhone.mutateAsync(trimmed);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'phone_already_verified') {
        await refresh();
        navigate('/dashboard', { replace: true });
        return;
      }
      setError(authErrorMessage(err));
      return;
    }
    await refresh();
    navigate('/dashboard', { replace: true });
  }

  return (
    <AuthCenteredLayout>
      <Card className="w-full max-w-md p-6 sm:p-8">
        <header className="text-center">
          <TelegramGlyph />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
            {t('verifyPhone.title')}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {t('verifyPhone.botFlowSubtitle')}
          </p>
        </header>

        <ol className="mt-6 space-y-2.5 rounded-xl bg-ink-50 p-4 text-left text-sm text-ink-700">
          {[
            t('verifyPhone.stepOpenBot'),
            t('verifyPhone.stepSharePhone'),
            t('verifyPhone.stepEnterCode'),
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {botUrl ? (
            <a href={botUrl} target="_blank" rel="noreferrer" className="block">
              <Button type="button" fullWidth size="lg">
                {t('verifyPhone.openInTelegram')}
              </Button>
            </a>
          ) : (
            <div
              role="alert"
              className="rounded-xl border border-danger-500/40 bg-danger-50 px-3 py-2.5 text-sm text-danger-600"
            >
              {t('verifyPhone.errorNotConfigured')}
            </div>
          )}

          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="phone-otp" className="text-sm font-medium text-ink-900">
              {t('verifyPhone.codeLabel')}
            </label>
            <input
              ref={otpRef}
              id="phone-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={10}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="12345678"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? 'phone-otp-error' : undefined}
              className="block h-14 w-full rounded-xl border border-ink-200 bg-white px-3 text-center text-2xl font-semibold tracking-[0.4em] text-ink-900 shadow-[var(--shadow-input)] outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            {error && (
              <p id="phone-otp-error" role="alert" className="text-sm text-danger-600">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={verifyPhone.isPending}
            disabled={otp.trim().length < 4}
          >
            {t('verifyPhone.verifyButton')}
          </Button>
        </form>
      </Card>
    </AuthCenteredLayout>
  );
}

function TelegramGlyph() {
  return (
    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-25 text-accent-500">
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="currentColor"
        aria-hidden
      >
        <path d="M21.86 4.13a1 1 0 0 0-1.13-.21L3.4 10.74a1 1 0 0 0 .05 1.86l4.39 1.42 2.12 6.4a1 1 0 0 0 1.7.32l2.74-2.95 4.5 3.31a1 1 0 0 0 1.58-.57l2.99-13.55a1 1 0 0 0-.61-1.16zM9.62 13.39 17.4 7.7l-6.18 6.6-.04.04-.18 3.34-1.38-4.29z" />
      </svg>
    </span>
  );
}
