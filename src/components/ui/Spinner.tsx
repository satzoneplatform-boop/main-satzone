import { cn } from '@/lib/cn';

export function Spinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dim = size === 'sm' ? 'size-4 border-2' : size === 'lg' ? 'size-10 border-[3px]' : 'size-6 border-2';
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent text-brand-600',
        dim,
        className,
      )}
    />
  );
}
