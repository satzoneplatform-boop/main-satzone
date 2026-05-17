import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { LogoMark } from '@/components/brand/Logo';
import authIllustration from '@/assets/auth-illustration.png';
import { useT } from '@/i18n/I18nProvider';

interface CommitmentModalProps {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}

/**
 * Post-enrollment confirmation modal (Figma node 14115:50901).
 *
 * UX-only: not persisted server-side. Caller decides when to show it
 * (typically once per course on first lesson open) using localStorage.
 */
export function CommitmentModal({ open, onClose, onStart }: CommitmentModalProps) {
  const t = useT();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const COMMITMENTS = useMemo(
    () => [
      t('course.commitment.item.pausing'),
      t('course.commitment.item.breaking'),
      t('course.commitment.item.revisiting'),
      t('course.commitment.item.asking'),
      t('course.commitment.item.resources'),
      t('course.commitment.item.mindset'),
    ],
    [t],
  );

  function toggle(i: number) {
    const next = new Set(checked);
    next.has(i) ? next.delete(i) : next.add(i);
    setChecked(next);
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl p-0 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="relative hidden bg-auth-bg lg:block">
          <img
            src={authIllustration}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </div>

        <div className="space-y-5 p-8">
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <div>
              <h2 className="text-lg font-semibold text-ink-900">{t('course.commitment.title')}</h2>
              <p className="text-xs text-ink-500">
                {t('course.commitment.intro')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-ink-900">
              {t('course.commitment.prompt')}
            </p>
            <ul className="mt-3 space-y-2.5">
              {COMMITMENTS.map((c, i) => (
                <li key={c}>
                  <Checkbox
                    label={c}
                    checked={checked.has(i)}
                    onChange={() => toggle(i)}
                  />
                </li>
              ))}
            </ul>
          </div>

          <Button
            fullWidth
            size="lg"
            disabled={checked.size === 0}
            onClick={() => {
              onStart();
              onClose();
            }}
          >
            {t('course.commitment.start')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
