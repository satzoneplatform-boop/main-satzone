import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface EmptyResultsProps {
  query: string;
}

export function EmptyResults({ query }: EmptyResultsProps) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div className="max-w-sm">
        <span aria-hidden className="text-5xl">🔎</span>
        <h2 className="mt-4 text-lg font-semibold text-ink-900">
          No results found for {query ? `“${query}”` : 'your search'}
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          Please try another search term, or explore the available recommendations.
        </p>
        <Link to="/explore" className="mt-6 inline-block">
          <Button variant="outline">Explore courses</Button>
        </Link>
      </div>
    </div>
  );
}
