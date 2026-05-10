import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import type { Category } from '@/types/api';

interface CategoryCardProps {
  category: Category;
  count?: number;
  /** Optional CSS color override for the icon backdrop. */
  accent?: string;
}

const ACCENTS = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
];

export function CategoryCard({ category, count = 0, accent }: CategoryCardProps) {
  const accentClass = accent ?? ACCENTS[hashKey(category.id) % ACCENTS.length];

  return (
    <Link
      to={`/explore/search?category=${category.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
    >
      <span
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-lg text-base font-semibold',
          accentClass,
        )}
      >
        {category.icon_url ? (
          <img src={category.icon_url} alt="" className="size-7" />
        ) : (
          category.name.charAt(0).toUpperCase()
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{category.name}</p>
        <p className="text-xs text-ink-500">{count} courses</p>
      </div>
    </Link>
  );
}

function hashKey(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
