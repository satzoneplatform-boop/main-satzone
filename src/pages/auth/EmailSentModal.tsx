import { Modal } from '@/components/ui/Modal';
import { useForgotPassword } from '@/features/auth/hooks';
import { MailIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';

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
  const t = useT();
  const resend = useForgotPassword();

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <MailIcon />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-ink-900">
          {t('auth.emailSent.title')}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">{t('auth.emailSent.body')}</p>
        {email && (
          <p className="mt-2 text-sm font-medium break-all text-ink-700">{email}</p>
        )}

        <button
          type="button"
          onClick={() => resend.mutate(email)}
          disabled={resend.isPending || !email}
          className="mt-6 min-h-11 rounded-md px-3 text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
        >
          {resend.isPending
            ? t('auth.emailSent.resending')
            : resend.isSuccess
              ? t('auth.emailSent.resent')
              : t('auth.emailSent.resend')}
        </button>
      </div>
    </Modal>
  );
}
