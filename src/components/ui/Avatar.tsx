import { cn } from '@/lib/cn';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  shape?: 'circle' | 'square';
  className?: string;
}

export function Avatar({
  src,
  name = '',
  size = 36,
  shape = 'circle',
  className,
}: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center overflow-hidden bg-brand-100 text-sm font-semibold text-brand-700',
        shape === 'circle' ? 'rounded-full' : 'rounded-md',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.4) }}>{initials || '?'}</span>
      )}
    </div>
  );
}
