import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Icon } from '@/components/icons/Icon';
import { cx } from '@/utils/cx';
import { inputClass } from './styles';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

type SelectProps<T extends string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'value' | 'onChange'
> & {
  label: ReactNode;
  hint?: ReactNode;
  value: T;
  options: ReadonlyArray<SelectOption<T>>;
  onChange: (value: T) => void;
};

/** Native select (best keyboard/screen-reader support on low-end devices), restyled. */
export function Select<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  className,
  ...rest
}: SelectProps<T>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            const next = options.find((o) => o.value === e.target.value);
            if (next) onChange(next.value);
          }}
          className={cx(inputClass, 'appearance-none pr-10', className)}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          size={18}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
        />
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
