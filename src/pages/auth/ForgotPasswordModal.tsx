import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useForgotPassword, authErrorMessage } from '@/features/auth/hooks';
import { useT } from '@/i18n/I18nProvider';

interface ForgotPasswordModalProps {
  open: boolean;
  defaultEmail?: string;
  onClose: () => void;
  onSent: (email: string) => void;
}

export function ForgotPasswordModal({
  open,
  defaultEmail = '',
  onClose,
  onSent,
}: ForgotPasswordModalProps) {
  const t = useT();
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const forgot = useForgotPassword();

  // Reset the form whenever the modal (re)opens or the default email
  // changes — done during render (adjust-state pattern) instead of via a
  // setState-in-effect.
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevDefaultEmail, setPrevDefaultEmail] = useState(defaultEmail);
  if (open !== prevOpen || defaultEmail !== prevDefaultEmail) {
    setPrevOpen(open);
    setPrevDefaultEmail(defaultEmail);
    if (open) {
      setEmail(defaultEmail);
      setError(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await forgot.mutateAsync(email);
      onSent(email);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">{t('auth.forgot.title')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {t('auth.forgot.subtitle')}
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

        <Input
          label={t('auth.signIn.email')}
          type="email"
          required
          autoComplete="email"
          placeholder={t('auth.signIn.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" fullWidth size="lg" loading={forgot.isPending} disabled={!email}>
          {t('auth.forgot.submit')}
        </Button>

        <button
          type="button"
          className="block min-h-11 w-full rounded-md text-center text-sm text-ink-500 transition-colors hover:text-ink-700"
          onClick={onClose}
        >
          {t('auth.forgot.back')}
        </button>
      </form>
    </Modal>
  );
}
