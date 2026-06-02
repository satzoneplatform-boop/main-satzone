import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  authErrorMessage,
  useInitTelegram,
  useTelegramStatus,
} from '@/features/auth/hooks';
import { useT } from '@/i18n/I18nProvider';

/**
 * Telegram-bot phone verification gate (replaces SMS OTP).
 *
 * Lifecycle:
 *  1. On mount we POST /auth/telegram/init → get `{ state, link_url, expires_at }`.
 *  2. We render `link_url` as a button + QR (api.qrserver.com renders it
 *     to PNG so we don't need a QR client lib) and start polling
 *     /auth/telegram/status?state=… every 2 s.
 *  3. When status flips to `verified: true` we refresh /auth/me and
 *     navigate to /dashboard.
 *  4. If the link expires before the bot is opened, the user can click
 *     "Get a new link" which re-runs step 1.
 */
export function VerifyPhonePage() {
  const t = useT();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();

  const init = useInitTelegram();
  const [state, setState] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Kick off the verification on mount (and on "Get a new link").
  function startVerification() {
    setInitError(null);
    setState(null);
    setLinkUrl(null);
    init.mutate(undefined, {
      onSuccess: (res) => {
        setState(res.state);
        setLinkUrl(res.link_url);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.code === 'phone_already_verified') {
          // Race: another tab finished verification — refresh and bounce.
          void refresh().then(() => navigate('/dashboard', { replace: true }));
          return;
        }
        if (err instanceof ApiError && err.code === 'telegram_not_configured') {
          setInitError(t('verifyPhone.errorNotConfigured'));
          return;
        }
        setInitError(authErrorMessage(err));
      },
    });
  }

  useEffect(() => {
    // If the gate is already cleared (e.g. user re-opened the tab after
    // verifying elsewhere), don't init — just route home.
    if (user?.is_phone_verified) {
      navigate('/dashboard', { replace: true });
      return;
    }
    startVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll status while we have a live token.
  const status = useTelegramStatus(state);

  useEffect(() => {
    if (!status.data?.verified) return;
    // Verified — refresh the auth context, then route.
    void (async () => {
      await refresh();
      navigate('/dashboard', { replace: true });
    })();
  }, [status.data?.verified, navigate, refresh]);

  const expired = !!status.data?.expired;
  const verified = !!status.data?.verified;

  return (
    <AuthCenteredLayout>
      <Card className="w-full max-w-md p-6 sm:p-8">
        <header className="text-center">
          <TelegramGlyph />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
            {t('verifyPhone.title')}
          </h1>
          <p className="mt-2 text-sm text-ink-500">{t('verifyPhone.subtitle')}</p>
        </header>

        {init.isPending && !linkUrl ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : initError ? (
          <ErrorPanel message={initError} onRetry={startVerification} t={t} />
        ) : verified ? (
          <SuccessPanel t={t} />
        ) : expired ? (
          <ExpiredPanel onRetry={startVerification} t={t} />
        ) : linkUrl ? (
          <ActivePanel linkUrl={linkUrl} t={t} />
        ) : null}
      </Card>
    </AuthCenteredLayout>
  );
}

function ActivePanel({
  linkUrl,
  t,
}: {
  linkUrl: string;
  t: ReturnType<typeof useT>;
}) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(linkUrl)}`;
  return (
    <div className="mt-6 space-y-5">
      <a href={linkUrl} target="_blank" rel="noreferrer" className="block">
        <Button fullWidth size="lg">
          {t('verifyPhone.openInTelegram')}
        </Button>
      </a>

      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 h-px bg-ink-100" />
        <p className="relative mx-auto inline-block bg-white px-3 text-xs uppercase tracking-wider text-ink-400">
          {t('verifyPhone.or')}
        </p>
      </div>

      <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-center">
        <p className="text-xs text-ink-500">{t('verifyPhone.scanHint')}</p>
        <img
          src={qrSrc}
          alt="Telegram verification QR"
          width={180}
          height={180}
          className="mx-auto mt-3 rounded-md bg-white p-2 shadow-sm"
        />
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-ink-500">
        <Spinner size="sm" />
        <span>{t('verifyPhone.waiting')}</span>
      </div>
    </div>
  );
}

function SuccessPanel({ t }: { t: ReturnType<typeof useT> }) {
  return (
    <div className="mt-6 grid place-items-center py-6 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-success-50 text-success-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="mt-3 text-base font-semibold text-ink-900">
        {t('verifyPhone.successTitle')}
      </p>
      <p className="mt-1 text-sm text-ink-500">{t('verifyPhone.successBody')}</p>
    </div>
  );
}

function ExpiredPanel({
  onRetry,
  t,
}: {
  onRetry: () => void;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div className="mt-6 space-y-4 text-center">
      <p className="text-sm text-ink-700">{t('verifyPhone.expired')}</p>
      <Button fullWidth onClick={onRetry}>
        {t('verifyPhone.getNewLink')}
      </Button>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
  t,
}: {
  message: string;
  onRetry: () => void;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-md border border-danger-500/40 bg-danger-50 px-3 py-2 text-sm text-danger-600">
        {message}
      </div>
      <Button fullWidth variant="outline" onClick={onRetry}>
        {t('verifyPhone.tryAgain')}
      </Button>
    </div>
  );
}

/** Inline Telegram paper-plane mark, so we don't ship an extra asset. */
function TelegramGlyph() {
  return (
    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#26A5E4]/10 text-[#26A5E4]">
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
