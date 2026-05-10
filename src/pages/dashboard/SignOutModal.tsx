import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LogoutIcon } from '@/components/icons';
import { useAuth } from '@/features/auth/AuthProvider';

interface SignOutModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignOutModal({ open, onClose }: SignOutModalProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function onConfirm() {
    await logout();
    onClose();
    navigate('/sign-in', { replace: true });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-danger-50 text-danger-500">
          <LogoutIcon />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-ink-900">
          Sure want to sign-out?
        </h2>
        <p className="mt-1 max-w-xs text-sm text-ink-500">
          All data is automatically saved as long as you’re still logged in to this device.
        </p>

        <div className="mt-6 flex w-full flex-col gap-2">
          <Button variant="danger" fullWidth onClick={onConfirm}>
            Yes, sign-out
          </Button>
          <Button variant="outline" fullWidth onClick={onClose}>
            No, keep here
          </Button>
        </div>
      </div>
    </Modal>
  );
}
