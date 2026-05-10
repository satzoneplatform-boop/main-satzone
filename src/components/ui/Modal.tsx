import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnOverlay?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  className,
  closeOnOverlay = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-[2px] p-4"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-700"
        >
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}
