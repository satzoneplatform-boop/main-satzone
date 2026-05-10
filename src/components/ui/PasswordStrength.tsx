import { CheckCircleFilled, XCircleFilled } from '@/components/icons';
import { cn } from '@/lib/cn';

export interface PasswordChecks {
  uppercase: boolean;
  number: boolean;
  length: boolean;
}

export function evaluatePassword(value: string): PasswordChecks {
  return {
    uppercase: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    length: value.length >= 8,
  };
}

export function passwordStrength(checks: PasswordChecks): 0 | 1 | 2 | 3 {
  return (Number(checks.uppercase) + Number(checks.number) + Number(checks.length)) as 0 | 1 | 2 | 3;
}

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

const HEADLINE: Record<number, string> = {
  0: 'Weak password. Must contain :',
  1: 'Weak password. Must contain :',
  2: 'Almost there. Must contain :',
  3: 'Strong password.',
};

export function PasswordStrengthMeter({ value, className }: PasswordStrengthMeterProps) {
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
        <p className="text-xs font-medium text-ink-700">{HEADLINE[score]}</p>
        <ul className="mt-2 space-y-1.5">
          <RequirementRow ok={checks.uppercase} label="At least 1 uppercase" />
          <RequirementRow ok={checks.number} label="At least 1 number" />
          <RequirementRow ok={checks.length} label="At least 8 characters" />
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
