import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/cn';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  /** Fired when the full code is entered. */
  onComplete?: (value: string) => void;
}

/**
 * Six-digit one-time-code input.
 * Auto-advances on entry, supports paste and arrow-key navigation.
 */
export function OTPInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  error = false,
  disabled = false,
  className,
  onComplete,
}: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function commit(next: string) {
    const trimmed = next.slice(0, length);
    onChange(trimmed);
    if (trimmed.length === length) onComplete?.(trimmed);
  }

  function setDigit(index: number, digit: string) {
    const cleaned = digit.replace(/\D/g, '').slice(0, 1);
    if (!cleaned) {
      const arr = digits.slice();
      arr[index] = '';
      commit(arr.join(''));
      return;
    }
    const arr = digits.slice();
    arr[index] = cleaned;
    commit(arr.join(''));
    refs.current[Math.min(index + 1, length - 1)]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      const arr = digits.slice();
      arr[index - 1] = '';
      commit(arr.join(''));
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={error || undefined}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            'h-14 w-12 rounded-xl border bg-white text-center text-xl font-semibold text-ink-900',
            'shadow-[var(--shadow-input)] focus:outline-none focus:ring-2',
            error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-red-100'
              : 'border-ink-200 focus:border-brand-500 focus:ring-brand-100',
            disabled && 'cursor-not-allowed bg-ink-50 text-ink-400',
          )}
        />
      ))}
    </div>
  );
}
