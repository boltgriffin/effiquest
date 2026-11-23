import type { SimTrial } from '@/types';
import { formatQuantity } from '@/utils/format';

export interface TrendSummary {
  first: SimTrial;
  last: SimTrial;
  sentence: string;
  /** True when the data show the G2 pattern: more mechanical advantage, lower efficiency. */
  showsTradeOff: boolean;
  fairTest: boolean;
}

const fmt = (x: number) => formatQuantity(x, Number.isInteger(x) ? 0 : 2);

/**
 * Compares the learner's own recorded trials across one independent variable: the latest valid
 * trial at its lowest value vs the latest at its highest. Null until two different values are
 * recorded. Describes only what the data show; never invents a result.
 */
export function compareTrials(
  trials: readonly SimTrial[],
  variable: { key: string; label: string; unit: string },
): TrendSummary | null {
  const latest = new Map<number, SimTrial>();
  for (const t of trials) {
    const x = t.params[variable.key];
    if (t.valid && x !== undefined) latest.set(x, t);
  }
  if (latest.size < 2) return null;
  const xs = [...latest.keys()].sort((a, b) => a - b);
  const first = latest.get(xs[0] as number);
  const last = latest.get(xs[xs.length - 1] as number);
  if (!first || !last) return null;

  const f = first.readouts;
  const l = last.readouts;
  const word = (a: number, b: number, same = 'stayed the same') =>
    b < a ? 'fell' : b > a ? 'rose' : same;
  // Degree and percent signs attach to the number; other units take a space.
  const unit = !variable.unit
    ? ''
    : ['°', '%'].includes(variable.unit)
      ? variable.unit
      : ` ${variable.unit}`;
  const sentence =
    `When the ${variable.label} went from ${fmt(first.params[variable.key] ?? 0)}${unit} to ${fmt(last.params[variable.key] ?? 0)}${unit}, ` +
    `the effort ${word(f.inputForceN, l.inputForceN)} from ${formatQuantity(f.inputForceN, 1)} N to ${formatQuantity(l.inputForceN, 1)} N ` +
    `(actual mechanical advantage ${formatQuantity(f.actualMA, 2)} → ${formatQuantity(l.actualMA, 2)}), ` +
    `and the efficiency ${word(f.efficiencyPercent, l.efficiencyPercent)} from ${formatQuantity(f.efficiencyPercent, 1)}% to ${formatQuantity(l.efficiencyPercent, 1)}%.`;
  const fairTest = Object.keys({ ...first.params, ...last.params })
    .filter((k) => k !== variable.key)
    .every((k) => first.params[k] === last.params[k]);

  return {
    first,
    last,
    fairTest,
    sentence: fairTest
      ? sentence
      : `${sentence} Other settings also changed between these trials, so this is not a fair test.`,
    showsTradeOff: (l.actualMA - f.actualMA) * (l.efficiencyPercent - f.efficiencyPercent) < 0,
  };
}
