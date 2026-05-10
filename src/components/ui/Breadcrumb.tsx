import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2 text-sm', className)}>
      {items.map((crumb, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={`${crumb.label}-${i}`}>
            {crumb.to && !last ? (
              <Link to={crumb.to} className="text-ink-500 hover:text-ink-700">
                {crumb.label}
              </Link>
            ) : (
              <span
                className={cn(
                  last
                    ? 'rounded-md bg-ink-100 px-2 py-1 font-medium text-ink-900'
                    : 'text-ink-500',
                )}
              >
                {crumb.label}
              </span>
            )}
            {!last && <span className="text-ink-400">/</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
