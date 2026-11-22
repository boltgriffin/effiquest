import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { formatQuantity } from '@/utils/format';
import { Tooltip } from './Tooltip';

export type QuantityTone = 'input' | 'output' | 'loss' | 'neutral';

const toneBar: Record<QuantityTone, string> = {
  input: 'bg-input',
  output: 'bg-output',
  loss: 'bg-loss',
  neutral: 'bg-rule-strong',
};

interface ReadoutProps {
  /** Scientific symbol, e.g. <>F<sub>in</sub></>. */
  symbol: ReactNode;
  /** Plain-language name, e.g. "Input force". */
  label: string;
  value: number | null;
  unit: string;
  digits?: number;
  tone?: QuantityTone;
  /** Explains the quantity; shown on hover/focus of the symbol. */
  definition?: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * Instrument-style measurement: colored tick for its physical role, serif symbol, mono value, unit.
 * `null` renders an em dash and announces "not measured".
 */
export function Readout({
  symbol,
  label,
  value,
  unit,
  digits = 2,
  tone = 'neutral',
  definition,
  size = 'md',
}: ReadoutProps) {
  const symbolEl = <span className="font-display text-base text-muted italic">{symbol}</span>;
  return (
    <div className="flex min-w-0 gap-3 py-2">
      <span aria-hidden="true" className={cx('w-1 shrink-0 rounded-full', toneBar[tone])} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 text-sm text-muted">
          {definition ? (
            <Tooltip content={definition}>
              {(props) => (
                <button
                  type="button"
                  className="cursor-help rounded-sm underline decoration-dotted underline-offset-4"
                  {...props}
                >
                  {symbolEl}
                  <span className="sr-only">: definition</span>
                </button>
              )}
            </Tooltip>
          ) : (
            symbolEl
          )}
          <span className="truncate">{label}</span>
        </div>
        <p className={cx('num leading-tight', size === 'lg' ? 'text-3xl' : 'text-xl')}>
          {value === null ? (
            <>
              <span aria-hidden="true" className="text-muted">
                —
              </span>
              <span className="sr-only">not measured</span>
            </>
          ) : (
            <>
              {formatQuantity(value, digits)}
              <span className="ml-1 text-[0.6em] text-muted">{unit}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
