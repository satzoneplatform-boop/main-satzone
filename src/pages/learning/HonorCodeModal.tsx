import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { InfoIcon, PaperPlaneIcon } from '@/components/icons';

interface HonorCodeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (legalName: string) => void;
  loading?: boolean;
}

export function HonorCodeModal({
  open,
  onClose,
  onConfirm,
  loading,
}: HonorCodeModalProps) {
  const [name, setName] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim());
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <PaperPlaneIcon />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink-900">Honor Code Confirmation</h2>
          <p className="mt-2 text-sm text-ink-500">
            By submitting this assessment, I confirm that this work is entirely my own and complies
            with{' '}
            <a href="#" className="text-brand-600 hover:underline">
              the course’s academic integrity guidelines
            </a>
            . I understand that violations may result in a failed attempt, loss of course credit,
            or account restrictions.
          </p>
        </div>

        <Input
          label="Legal name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint={undefined}
        />
        <p className="-mt-2 flex items-center gap-2 text-xs text-ink-500">
          <InfoIcon className="size-3.5" />
          Use the name shown on your government-issued ID.
        </p>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!name.trim()}
        >
          Confirm &amp; submit
        </Button>
      </form>
    </Modal>
  );
}
