import { Icon } from '@/components/icons/Icon';
import { cx } from '@/utils/cx';

interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  /** Show the percentage next to the label. */
  showValue?: boolean;
  tone?: 'brand' | 'chart-1' | 'chart-2';
  className?: string;
}

const toneClass = { brand: 'bg-brand', 'chart-1': 'bg-chart-1', 'chart-2': 'bg-chart-2' } as const;

export function ProgressBar({
  label,
  value,
  max = 100,
  showValue = true,
  tone = 'brand',
  className,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        {showValue ? <span className="num text-muted">{Math.round(pct)}%</span> : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="h-1.5 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className={cx(
            'h-full rounded-full transition-[width] duration-300 ease-standard',
            toneClass[tone],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number;
  /** Steps before `current` are shown as done. */
  onSelect?: (index: number) => void;
  label: string;
  /** Narrow containers: only the current step shows its label; the others keep it for screen readers. */
  compact?: boolean;
}

/** Numbered procedure steps (lab protocol style). Clickable when onSelect is given. */
export function StepIndicator({ steps, current, onSelect, label, compact }: StepIndicatorProps) {
  return (
    <ol aria-label={label} className="flex gap-1 overflow-x-auto">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        const body = (
          <>
            <span
              className={cx(
                'num flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
                state === 'current' && 'border-brand bg-brand text-brand-ink',
                state === 'done' && 'border-brand text-brand',
                state === 'todo' && 'border-rule-strong text-muted',
              )}
            >
              {state === 'done' ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span
              className={cx(
                'text-sm whitespace-nowrap',
                state === 'current' ? 'font-medium text-ink' : 'text-muted',
                compact && state !== 'current' && 'sr-only',
              )}
            >
              {step.label}
            </span>
          </>
        );
        return (
          <li key={step.id} className={compact && state !== 'current' ? 'flex-none' : 'flex-1'}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={state === 'current' ? 'step' : undefined}
                className="flex min-h-11 w-full items-center gap-2 rounded-md px-1.5 text-left hover:bg-surface-2"
              >
                {body}
              </button>
            ) : (
              <div
                aria-current={state === 'current' ? 'step' : undefined}
                className="flex min-h-11 items-center gap-2 px-1.5"
              >
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
