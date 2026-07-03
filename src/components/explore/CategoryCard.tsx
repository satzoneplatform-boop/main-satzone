import { Link } from 'react-router-dom';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import type { Category } from '@/types/api';

interface CategoryCardProps {
  category: Category;
  count?: number;
  /** Optional CSS color override for the icon backdrop. */
  accent?: string;
}

/** Icon backdrops cycle through on-brand token tints (no off-palette hues). */
const ACCENTS = [
  'bg-brand-100 text-brand-700',
  'bg-teal-25 text-teal-700',
  'bg-success-50 text-success-600',
  'bg-warn-50 text-warn-700',
  'bg-brand-50 text-brand-600',
  'bg-ink-100 text-ink-700',
];

export function CategoryCard({ category, count = 0, accent }: CategoryCardProps) {
  const t = useT();
  const accentClass = accent ?? ACCENTS[hashKey(category.id) % ACCENTS.length];

  return (
    <Link
      to={`/explore/search?category=${category.slug}`}
      className="group flex min-h-[44px] items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <span
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-xl text-base font-semibold',
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
        <p className="text-xs text-ink-500">{t('explore.category.count', { count })}</p>
      </div>
    </Link>
  );
}

function hashKey(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
