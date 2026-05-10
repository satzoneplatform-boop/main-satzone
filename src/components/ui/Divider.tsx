import { cn } from '@/lib/cn';

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={cn('border-ink-200', className)} />;
  }
  return (
    <div className={cn('flex items-center gap-3 text-xs text-ink-500', className)}>
      <span className="h-px flex-1 bg-ink-200" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-ink-200" />
    </div>
  );
}
