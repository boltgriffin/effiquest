import { useId, type CSSProperties, type ReactNode } from 'react';

interface SliderProps {
  label: ReactNode;
  /** Plain-text name used in the spoken value, e.g. "Ramp angle". */
  name: string;
  /** Scientific symbol shown beside the label, e.g. θ or μ. */
  symbol?: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  digits?: number;
  onChange: (value: number) => void;
  hint?: ReactNode;
}

/** Parameter slider: label + symbol, live numeric value with unit, keyboard-operable native range. */
export function Slider({
  label,
  name,
  symbol,
  value,
  min,
  max,
  step,
  unit,
  digits = 0,
  onChange,
  hint,
}: SliderProps) {
  const id = useId();
  const shown = value.toFixed(digits);
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {symbol ? <span className="ml-1.5 font-display text-muted italic">{symbol}</span> : null}
        </label>
        <output htmlFor={id} className="num text-sm">
          {shown}
          {unit ? <span className="ml-0.5 text-muted">{unit}</span> : null}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="eq-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${name} ${shown}${unit ? ` ${unit}` : ''}`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        style={{ '--fill': fill } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div aria-hidden="true" className="num flex justify-between text-xs text-muted">
        <span>{min.toFixed(digits)}</span>
        <span>{max.toFixed(digits)}</span>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
