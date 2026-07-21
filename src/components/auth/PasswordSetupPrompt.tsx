import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';

/**
 * Post-sign-in reminder for Google-only accounts (has_google && !has_password):
 * a password unlocks plain email+password sign-in as a second way in. Shows
 * once per signed-in session — the sessionStorage flag is cleared on sign-out
 * so every new Google sign-in surfaces it again until a password exists.
 */
const SHOWN_KEY = 'satzone.password-prompt-shown';

export function PasswordSetupPrompt() {
  const { user, status } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const needsPassword = !!user && user.has_google && !user.has_password;

  // Re-arm for the next sign-in.
  useEffect(() => {
    if (status === 'unauthenticated') sessionStorage.removeItem(SHOWN_KEY);
  }, [status]);

  useEffect(() => {
    if (!needsPassword || sessionStorage.getItem(SHOWN_KEY)) return;
    sessionStorage.setItem(SHOWN_KEY, '1');
    setOpen(true);
  }, [needsPassword]);

  // Also drops the modal instantly once the password gets set elsewhere.
  if (!needsPassword) return null;

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="space-y-5 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
          <KeyRound size={28} aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-ink-900">
            {t('auth.passwordPrompt.title')}
          </h2>
          <p className="mt-2 text-sm text-ink-500">{t('auth.passwordPrompt.body')}</p>
        </div>
        <div className="space-y-2">
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              setOpen(false);
              navigate('/account?tab=security&setpw=1');
            }}
          >
            {t('auth.passwordPrompt.cta')}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>
            {t('auth.passwordPrompt.later')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
