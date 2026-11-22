import { useId } from 'react';
import { Icon, type IconName } from '@/components/icons/Icon';
import { cx } from '@/utils/cx';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  legend: string;
  value: T;
  options: ReadonlyArray<Option<T>>;
  onChange: (value: T) => void;
}

/** Radio group styled as joined segments. Arrow keys move between options natively. */
export function SegmentedControl<T extends string>({
  legend,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="inline-flex rounded-md border border-rule-strong bg-surface p-0.5">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cx(
                'flex min-h-10 cursor-pointer items-center gap-1.5 rounded-sm px-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
                checked ? 'bg-brand text-brand-ink' : 'text-ink hover:bg-surface-2',
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.icon ? <Icon name={o.icon} size={16} /> : null}
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
