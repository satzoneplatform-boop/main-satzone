import { Link } from 'react-router-dom';
import type { ProgramSummary } from '@/types/api';
import { formatPrice } from '@/lib/format';

interface DegreeCardProps {
  program: ProgramSummary;
}

export function DegreeCard({ program }: DegreeCardProps) {
  return (
    <Link
      to={`/programs/${program.slug}`}
      className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-lg bg-ink-100 text-base font-semibold text-ink-700">
          {program.thumbnail_url ? (
            <img
              src={program.thumbnail_url}
              alt={program.title}
              className="size-12 rounded-lg object-cover"
            />
          ) : (
            program.title.charAt(0)
          )}
        </div>
        <span className="rounded-md bg-success-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-success-600">
          {program.level.replace('_', ' ')}
        </span>
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-ink-900">{program.title}</h3>
      {program.subtitle && (
        <p className="line-clamp-2 text-xs text-ink-500">{program.subtitle}</p>
      )}

      <div className="mt-auto flex items-center justify-between text-xs">
        <span className="text-ink-500">
          {program.duration_weeks} weeks
        </span>
        <span className="font-semibold text-ink-900">
          {formatPrice(program.price_cents, program.currency)}
        </span>
      </div>
    </Link>
  );
}
