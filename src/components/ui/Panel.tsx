import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { eyebrowClass } from './styles';

interface PanelProps {
  /** Short label above the title, e.g. "01 · Predict" or "Results". */
  eyebrow?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: 'section' | 'div' | 'aside';
  labelledBy?: string;
}

/**
 * The single container style: a ruled sheet with a header strip, like a lab-notebook page.
 * Prefer one Panel with ruled rows over a grid of separate cards.
 */
export function Panel({
  eyebrow,
  title,
  actions,
  children,
  className,
  bodyClassName,
  as: Tag = 'section',
  labelledBy,
}: PanelProps) {
  const hasHeader = eyebrow || title || actions;
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={cx('rounded-md border border-rule bg-surface', className)}
    >
      {hasHeader ? (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
            {title ? (
              <h2 id={labelledBy} className="font-display text-lg leading-snug">
                {title}
              </h2>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx('px-4 py-4 sm:px-5', bodyClassName)}>{children}</div>
    </Tag>
  );
}

/** Page title block: serif title, one-line purpose, optional actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
      <div className="max-w-2xl">
        {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
        <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
