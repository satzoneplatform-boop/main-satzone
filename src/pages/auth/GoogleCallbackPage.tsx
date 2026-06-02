import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { tokenStore } from '@/api/tokenStore';
import { useAuth } from '@/features/auth/AuthProvider';

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
  const navigate = useNavigate();
  const { refresh } = useAuth();
  // Guard against React 18 StrictMode double-invocation in dev — we must
  // only consume the fragment once, otherwise the second pass sees an
  // empty hash and falls into the error branch.
  const ranRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // Google sometimes returns its own error as a query param when the
    // user denies consent or the OAuth app is misconfigured.
    const query = new URLSearchParams(window.location.search);
    const googleErr = query.get('error');
    if (googleErr) {
      setError(`Google sign-in failed: ${googleErr}`);
      return;
    }

    // Parse the fragment (without the leading "#"). The backend builds it
    // as `#access_token=...&refresh_token=...&expires_in=...`.
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const access = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!access || !refreshToken) {
      setError(
        'Sign-in response was incomplete — no tokens received. Please try again.',
      );
      return;
    }

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
          setError(
            'Sign-in succeeded but we couldn’t load your profile. Please try again.',
          );
          return;
        }
        navigate('/dashboard', { replace: true });
      } catch {
        setError('Sign-in finished but loading your profile failed.');
      }
    })();
  }, [navigate, refresh]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50 px-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-ink-200 bg-white p-6 text-center shadow-[var(--shadow-card)]">
          <p className="text-base font-semibold text-ink-900">Couldn’t sign in</p>
          <p className="text-sm text-ink-500">{error}</p>
          <Button fullWidth onClick={() => navigate('/sign-in', { replace: true })}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50">
      <div className="text-center text-ink-500">
        <Spinner size="lg" />
        <p className="mt-3 text-sm">Finishing Google sign-in…</p>
      </div>
    </div>
  );
}
