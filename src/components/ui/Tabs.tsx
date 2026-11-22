import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons/Icon';
import { cx } from '@/utils/cx';

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  content: ReactNode;
}

interface TabsProps {
  label: string;
  items: TabItem[];
  defaultTab?: string;
  className?: string;
  panelClassName?: string;
}

/** WAI-ARIA tabs with roving focus: Left/Right arrows, Home, End. Underline style, not pills. */
export function Tabs({ label, items, defaultTab, className, panelClassName }: TabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(defaultTab ?? items[0]?.id);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const item = items[(index + items.length) % items.length];
    if (!item) return;
    setActive(item.id);
    refs.current[(index + items.length) % items.length]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    const target = keys[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusTab(target);
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto border-b border-rule"
      >
        {items.map((item, index) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[index] = el;
              }}
              id={`${baseId}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cx(
                '-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                selected
                  ? 'border-brand text-ink'
                  : 'border-transparent text-muted hover:border-rule-strong hover:text-ink',
              )}
            >
              {item.icon ? <Icon name={item.icon} size={18} /> : null}
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) =>
        item.id === active ? (
          <div
            key={item.id}
            id={`${baseId}-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${item.id}`}
            tabIndex={0}
            className={cx('pt-4 focus-visible:outline-offset-4', panelClassName)}
          >
            {item.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
