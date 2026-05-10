import { Modal } from '@/components/ui/Modal';
import { useForgotPassword } from '@/features/auth/hooks';
import { MailIcon } from '@/components/icons';

interface EmailSentModalProps {
  open: boolean;
  email: string;
  onClose: () => void;
}

/**
 * Confirmation modal shown after a forgot-password / verification email is queued.
 * Backend always returns 200 (no enumeration) so we can safely advertise the
 * email regardless of whether the address exists.
 */
export function EmailSentModal({ open, email, onClose }: EmailSentModalProps) {
  const resend = useForgotPassword();

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <MailIcon />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-ink-900">Email has been sent</h2>
        <p className="mt-1 text-sm text-ink-500">
          Please check your email inbox for a
          <br />
          resetting password link.
        </p>

        <button
          type="button"
          onClick={() => resend.mutate(email)}
          disabled={resend.isPending}
          className="mt-6 text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
        >
          {resend.isPending ? 'Sending…' : resend.isSuccess ? 'Link resent' : 'Resend link'}
        </button>
      </div>
    </Modal>
  );
}
