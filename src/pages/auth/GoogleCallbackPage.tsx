import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { tokenStore } from '@/api/tokenStore';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';

/**
 * Google OAuth callback landing page.
 *
 * The backend's `/auth/google/callback` redirects here with tokens in the
 * URL fragment (so they don't show up in server logs / referer headers):
 *
 *   /auth/google/callback#access_token=…&refresh_token=…&expires_in=900
 *
 * This component parses the fragment, hands the tokens to the token store,
 * refreshes the auth context so `useAuth().user` is populated, then routes
 * the user to the dashboard. Tokens are never exposed via `console.log` and
 * the fragment is wiped from the URL after we've consumed it (so a copy of
 * the address bar doesn't leak the tokens).
 *
 * Common failure modes surface inline (denied consent, missing fragment,
 * `error=` query param from Google) with a retry button.
 */
export function GoogleCallbackPage() {
  const t = useT();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  // Guard against React 18 StrictMode double-invocation in dev — we must
  // only consume the fragment once, otherwise the second pass sees an
  // empty hash and falls into the error branch.
  const ranRef = useRef(false);
  // The synchronous failure modes (denied consent, missing fragment) are
  // detectable from the URL before any side effects run, so they're derived
  // once in the lazy initializer instead of set from inside the effect.
  const [error, setError] = useState<string | null>(() => {
    // Google sometimes returns its own error as a query param when the
    // user denies consent or the OAuth app is misconfigured.
    const query = new URLSearchParams(window.location.search);
    const googleErr = query.get('error');
    if (googleErr) return t('auth.googleCallback.denied', { reason: googleErr });

    // Parse the fragment (without the leading "#"). The backend builds it
    // as `#access_token=...&refresh_token=...&expires_in=...`.
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    if (!params.get('access_token') || !params.get('refresh_token')) {
      return t('auth.googleCallback.noTokens');
    }
    return null;
  });

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // Bail on the failure modes already surfaced by the initializer above.
    const query = new URLSearchParams(window.location.search);
    if (query.get('error')) return;

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const access = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!access || !refreshToken) return;

    // Persist tokens. The store accepts the subset the API client needs.
    tokenStore.set({
      access_token: access,
      refresh_token: refreshToken,
    });

    // Wipe the fragment so the address bar / history doesn't leak tokens.
    // Using replaceState so we don't push an extra history entry.
    window.history.replaceState(null, '', window.location.pathname);

    // Pull /auth/me and update the auth context, then route to the app.
    // Google-signed-in users skip the phone-verify gate.
    void (async () => {
      try {
        const me = await refresh();
        if (!me) {
          setError(t('auth.googleCallback.profileError'));
          return;
        }
        navigate('/dashboard', { replace: true });
      } catch {
        setError(t('auth.googleCallback.profileError'));
      }
    })();
  }, [navigate, refresh, t]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50 px-4">
        <div
          role="alert"
          className="w-full max-w-sm space-y-4 rounded-2xl border border-ink-200 bg-white p-6 text-center shadow-[var(--shadow-card)]"
        >
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-danger-50 text-danger-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              width="28"
              height="28"
              aria-hidden
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-ink-900">
              {t('auth.googleCallback.errorTitle')}
            </p>
            <p className="mt-1 text-sm text-ink-500">{error}</p>
          </div>
          <Button fullWidth onClick={() => navigate('/sign-in', { replace: true })}>
            {t('auth.googleCallback.backToSignIn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4">
      <div role="status" className="text-center text-ink-500">
        <Spinner size="lg" />
        <p className="mt-3 text-sm">{t('auth.googleCallback.finishing')}</p>
      </div>
    </div>
  );
}
