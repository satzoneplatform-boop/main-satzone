import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OTPInput } from '@/components/ui/OTPInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AuthCenteredLayout } from '@/components/layout/AuthCenteredLayout';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  authErrorMessage,
  useResendPhoneCode,
  useSubmitPhone,
  useVerifyPhone,
} from '@/features/auth/hooks';
import { signupStore } from '@/features/auth/signupStore';

type Step = 'enter-phone' | 'enter-code';

const RESEND_COOLDOWN_S = 30;

/**
 * Phone-verification gate (FRONTEND.md §2).
 *
 * Backend stages the phone + a 6-digit code in Redis (15 min TTL) on
 * POST /auth/phone, then commits it on POST /auth/verify-phone {code}.
 * Until SMS is wired up the code is delivered to the user's email —
 * surface that wording, not "we texted you".
 */
export function VerifyPhonePage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const draft = useMemo(() => signupStore.get(), []);

  const [step, setStep] = useState<Step>(() =>
    user?.phone_number ? 'enter-code' : 'enter-phone',
  );
  const [phone, setPhone] = useState<string>(
    () => user?.phone_number ?? draft?.pendingPhone ?? '',
  );
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const submitPhone = useSubmitPhone();
  const verifyPhone = useVerifyPhone();
  const resendCode = useResendPhoneCode();

  // If the gate became false (verified), bounce home.
  useEffect(() => {
    if (user?.is_phone_verified) navigate('/', { replace: true });
  }, [user?.is_phone_verified, navigate]);

  // Resend cooldown timer.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function onSubmitPhone(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await submitPhone.mutateAsync(phone);
      setStep('enter-code');
      setCooldown(RESEND_COOLDOWN_S);
      setInfo("We've emailed your phone verification code (SMS coming soon).");
    } catch (err) {
      // 409 phone_already_verified means we can just refresh the user state
      // and bounce them home.
      if (err instanceof ApiError && err.code === 'phone_already_verified') {
        await refresh();
        navigate('/', { replace: true });
        return;
      }
      setError(authErrorMessage(err));
    }
  }

  async function onSubmitCode(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (code.length !== 6) return;
    try {
      await verifyPhone.mutateAsync(code);
      signupStore.clear();
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      // If the staged entry has expired, drive the user back to step 1.
      if (err instanceof ApiError && err.code === 'phone_not_submitted') {
        setStep('enter-phone');
      }
    }
  }

  async function onResend() {
    if (cooldown > 0) return;
    setError(null);
    setInfo(null);
    try {
      await resendCode.mutateAsync();
      setCooldown(RESEND_COOLDOWN_S);
      setInfo('A new code is on its way.');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'phone_not_submitted') {
        setStep('enter-phone');
      }
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthCenteredLayout>
      <Card className="w-full max-w-md">
        {step === 'enter-phone' ? (
          <form onSubmit={onSubmitPhone} className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                Verify your phone
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Enter the phone number you'd like to use on Edura. We'll send a 6-digit code to
                confirm it's yours.
              </p>
            </div>

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <PhoneInput
              label="Phone number"
              required
              value={phone}
              onChange={setPhone}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitPhone.isPending}
              disabled={phone.length < 5}
            >
              Send verification code
            </Button>
          </form>
        ) : (
          <form onSubmit={onSubmitCode} className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                Enter the 6-digit code
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                We've sent a code to{' '}
                <span className="font-medium text-ink-900">
                  {phone || user?.phone_number || 'your phone'}
                </span>
                . SMS is coming soon — for now, check your email inbox.
              </p>
            </div>

            {error && <ErrorBanner>{error}</ErrorBanner>}
            {info && !error && (
              <div className="rounded-md border border-brand-100 bg-brand-25 px-3 py-2 text-sm text-brand-700">
                {info}
              </div>
            )}

            <div className="flex justify-center">
              <OTPInput
                value={code}
                onChange={setCode}
                error={Boolean(error)}
                autoFocus
                onComplete={() => onSubmitCode()}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={verifyPhone.isPending}
              disabled={code.length !== 6}
            >
              Verify phone
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('enter-phone')}
                className="text-ink-500 hover:text-ink-700"
              >
                Use a different number
              </button>
              <button
                type="button"
                onClick={onResend}
                disabled={cooldown > 0 || resendCode.isPending}
                className="font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-400"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </Card>
    </AuthCenteredLayout>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-danger-500/30 bg-red-50 px-3 py-2 text-sm text-danger-600">
      {children}
    </div>
  );
}
