import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface MethodPickerCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  name: string;
  value: string;
}

export function MethodPickerCard({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  name,
  value,
}: MethodPickerCardProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition-colors',
        selected
          ? 'border-brand-500 ring-2 ring-brand-100'
          : 'border-ink-200 hover:border-ink-300',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="grid size-10 place-items-center rounded-lg border border-ink-200 bg-white text-ink-700">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        <span className="block text-xs text-ink-500">{subtitle}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full border',
          selected ? 'border-brand-600' : 'border-ink-300',
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-brand-600" />}
      </span>
    </label>
  );
}
