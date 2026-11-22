import type { SimTrial } from '@/types';
import { formatQuantity } from '@/utils/format';

export interface TrendSummary {
  fewer: SimTrial;
  more: SimTrial;
  sentence: string;
  /** True when the data shows the G2 pattern: more MA, lower efficiency. */
  showsTradeOff: boolean;
}

/**
 * Compares the learner's own recorded trials: the latest valid trial with the fewest segments vs
 * the latest with the most. Returns null until two different segment counts are recorded.
 * Describes only what the data shows; it never invents a result.
 */
export function segmentTrend(trials: readonly SimTrial[]): TrendSummary | null {
  const latest = new Map<number, SimTrial>();
  for (const t of trials) {
    const n = t.params.segments;
    if (t.valid && n !== undefined) latest.set(n, t);
  }
  if (latest.size < 2) return null;
  const ns = [...latest.keys()].sort((a, b) => a - b);
  const fewer = latest.get(ns[0] as number);
  const more = latest.get(ns[ns.length - 1] as number);
  if (!fewer || !more) return null;

  const f = fewer.readouts;
  const m = more.readouts;
  const effortWord =
    m.inputForceN < f.inputForceN ? 'fell' : m.inputForceN > f.inputForceN ? 'rose' : 'stayed';
  const etaWord =
    m.efficiencyPercent < f.efficiencyPercent
      ? 'fell'
      : m.efficiencyPercent > f.efficiencyPercent
        ? 'rose'
        : 'stayed the same';
  const sentence =
    `From ${fewer.params.segments} to ${more.params.segments} supporting segments, the effort ${effortWord} from ` +
    `${formatQuantity(f.inputForceN, 1)} N to ${formatQuantity(m.inputForceN, 1)} N ` +
    `(mechanical advantage ${formatQuantity(f.actualMA, 2)} → ${formatQuantity(m.actualMA, 2)}), ` +
    `while the efficiency ${etaWord} from ${formatQuantity(f.efficiencyPercent, 1)}% to ${formatQuantity(m.efficiencyPercent, 1)}%.`;
  const sameOther =
    fewer.params.loadMassKg === more.params.loadMassKg &&
    fewer.params.bearingFriction === more.params.bearingFriction &&
    fewer.params.blockMassKg === more.params.blockMassKg;

  return {
    fewer,
    more,
    sentence: sameOther
      ? sentence
      : `${sentence} Note: other settings also changed between these trials, so this is not a fair test.`,
    showsTradeOff: m.actualMA > f.actualMA && m.efficiencyPercent < f.efficiencyPercent,
  };
}
