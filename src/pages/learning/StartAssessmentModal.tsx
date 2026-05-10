import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FlagIcon } from '@/components/icons';
import { formatDuration } from '@/lib/format';

interface StartAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
  timeLimitMinutes?: number | null;
  attemptsRemaining?: number;
}

export function StartAssessmentModal({
  open,
  onClose,
  onStart,
  timeLimitMinutes,
  attemptsRemaining,
}: StartAssessmentModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <FlagIcon />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink-900">Start this assessment?</h2>
          <p className="mt-2 text-sm text-ink-500">
            This assessment must be completed within{' '}
            <span className="font-medium text-ink-900">
              {timeLimitMinutes ? formatDuration(timeLimitMinutes) : 'no fixed time'}
            </span>
            . Once you begin you won’t be able to pause.
            {typeof attemptsRemaining === 'number' && attemptsRemaining > 0 && (
              <>
                {' '}You have <span className="font-medium text-ink-900">{attemptsRemaining}</span>{' '}
                attempt{attemptsRemaining === 1 ? '' : 's'} left.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button fullWidth size="lg" onClick={onStart}>
            Start assessment
          </Button>
          <Button fullWidth size="lg" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
