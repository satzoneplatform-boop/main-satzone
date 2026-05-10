import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useForgotPassword, authErrorMessage } from '@/features/auth/hooks';

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
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const forgot = useForgotPassword();

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setError(null);
    }
  }, [open, defaultEmail]);

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
          <h2 className="text-xl font-semibold text-ink-900">Forgot password?</h2>
          <p className="mt-1 text-sm text-ink-500">
            Enter the email address you use on Edura.
            <br />
            We’ll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-danger-500/30 bg-red-50 px-3 py-2 text-sm text-danger-600">
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" fullWidth size="lg" loading={forgot.isPending} disabled={!email}>
          Reset password
        </Button>

        <button
          type="button"
          className="block w-full text-center text-sm text-ink-500 hover:text-ink-700"
          onClick={onClose}
        >
          Email me a magic link
        </button>
      </form>
    </Modal>
  );
}
