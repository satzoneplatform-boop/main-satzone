import { CheckCircleFilled, XCircleFilled } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/en';
import { cn } from '@/lib/cn';
import { evaluatePassword, passwordStrength } from '@/lib/password';

interface PasswordStrengthMeterProps {
  value: string;
  className?: string;
}

const SEGMENT_COLOR: Record<number, string> = {
  0: 'bg-ink-200',
  1: 'bg-danger-500',
  2: 'bg-warn-500',
  3: 'bg-success-500',
};

const HEADLINE_KEY: Record<number, TranslationKey> = {
  0: 'ui.password.weak',
  1: 'ui.password.weak',
  2: 'ui.password.almost',
  3: 'ui.password.strong',
};

export function PasswordStrengthMeter({ value, className }: PasswordStrengthMeterProps) {
  const t = useT();
  const checks = evaluatePassword(value);
  const score = passwordStrength(checks);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 rounded-full transition-colors',
              i < score ? SEGMENT_COLOR[score] : 'bg-ink-100',
            )}
          />
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-ink-700">{t(HEADLINE_KEY[score])}</p>
        <ul className="mt-2 space-y-1.5">
          <RequirementRow ok={checks.uppercase} label={t('ui.password.reqUppercase')} />
          <RequirementRow ok={checks.number} label={t('ui.password.reqNumber')} />
          <RequirementRow ok={checks.length} label={t('ui.password.reqLength')} />
        </ul>
      </div>
    </div>
  );
}

function RequirementRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs text-ink-500">
      {ok ? <CheckCircleFilled /> : <XCircleFilled />}
      <span className={ok ? 'text-ink-700' : ''}>{label}</span>
    </li>
  );
}
