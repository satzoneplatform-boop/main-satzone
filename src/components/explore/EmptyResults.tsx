import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SearchIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';

interface EmptyResultsProps {
  query: string;
  /** Present when the user has active filters that can be cleared. */
  onResetFilters?: () => void;
}

/**
 * Truthful empty state for search results — explains what happened and
 * offers a reset-filters CTA (when filters are active) plus a way back
 * to the explore catalogue.
 */
export function EmptyResults({ query, onResetFilters }: EmptyResultsProps) {
  const t = useT();

  return (
    <div className="grid place-items-center rounded-2xl border border-ink-200 bg-white px-4 py-16 shadow-[var(--shadow-card)] sm:py-24">
      <div className="max-w-sm text-center">
        <span
          aria-hidden
          className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600"
        >
          <SearchIcon className="size-6" />
        </span>
        <h2 className="mt-4 break-words text-lg font-semibold text-ink-900">
          {query
            ? t('explore.empty.title', { query })
            : t('explore.empty.titleNoQuery')}
        </h2>
        <p className="mt-2 text-sm text-ink-500">{t('explore.empty.body')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onResetFilters && (
            <Button onClick={onResetFilters}>{t('explore.empty.resetFilters')}</Button>
          )}
          <Link to="/explore" className="inline-block">
            <Button variant="outline">{t('explore.empty.exploreCta')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
