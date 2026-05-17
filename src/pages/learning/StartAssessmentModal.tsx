import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FlagIcon } from '@/components/icons';
import { formatDuration } from '@/lib/format';
import { useT } from '@/i18n/I18nProvider';

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
  const t = useT();
  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <FlagIcon />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('assessment.startModal.title')}</h2>
          <p className="mt-2 text-sm text-ink-500">
            {t('assessment.startModal.bodyPrefix')}{' '}
            <span className="font-medium text-ink-900">
              {timeLimitMinutes ? formatDuration(timeLimitMinutes) : t('assessment.startModal.noFixedTime')}
            </span>
            {t('assessment.startModal.bodySuffix')}
            {typeof attemptsRemaining === 'number' && attemptsRemaining > 0 && (
              <>
                {' '}
                {attemptsRemaining === 1
                  ? t('assessment.startModal.attemptsRemaining', { n: attemptsRemaining })
                  : t('assessment.startModal.attemptsRemainingPlural', { n: attemptsRemaining })}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button fullWidth size="lg" onClick={onStart}>
            {t('assessment.startModal.start')}
          </Button>
          <Button fullWidth size="lg" variant="ghost" onClick={onClose}>
            {t('assessment.startModal.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
