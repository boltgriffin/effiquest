import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';

export interface Crumb {
  label: string;
  to?: string;
}

/** Trail for nested pages (module, quest, teacher sub-areas). The last item is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.to && !last ? (
                <Link to={c.to} className="rounded-sm px-0.5 hover:text-ink hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={last ? 'text-ink' : undefined}
                >
                  {c.label}
                </span>
              )}
              {!last ? <Icon name="chevronRight" size={14} /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
