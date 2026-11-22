import { useId } from 'react';
import { cx } from '@/utils/cx';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

/** On/off toggle (role="switch"). Space/Enter toggle it, as for a native button. */
export function Switch({ label, checked, onChange, description }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-150',
          checked ? 'border-brand bg-brand' : 'border-rule-strong bg-surface-2',
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            'size-4 rounded-full bg-surface shadow-sm transition-transform duration-150 ease-standard',
            checked ? 'translate-x-5' : 'translate-x-1',
          )}
        />
      </button>
      <div className="text-sm">
        <label htmlFor={id} className="cursor-pointer font-medium">
          {label}
        </label>
        {description ? (
          <p id={`${id}-desc`} className="text-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
