import type { SimTrial } from '@/types';
import { formatQuantity } from '@/utils/format';

export interface MachineRow {
  labId: string;
  title: string;
  trial: SimTrial | null;
}

export interface Comparison {
  rows: MachineRow[];
  /** Machine with the largest actual mechanical advantage among recorded trials. */
  mostAdvantage: MachineRow | null;
  /** Machine with the highest efficiency among recorded trials. */
  mostEfficient: MachineRow | null;
  sentence: string | null;
}

/**
 * Cross-machine comparison (SRC-O2: mechanical advantage is not efficiency; SRC-O3: simple
 * machines side by side). Uses each machine's latest valid recorded trial; describes only data.
 */
export function compareMachines(
  machines: ReadonlyArray<{ labId: string; title: string }>,
  trialsByLab: Readonly<Record<string, readonly SimTrial[]>>,
): Comparison {
  const rows: MachineRow[] = machines.map((m) => {
    const valid = (trialsByLab[m.labId] ?? []).filter((t) => t.valid);
    return { ...m, trial: valid.at(-1) ?? null };
  });
  const measured = rows.filter((r) => r.trial !== null);
  if (measured.length < 2)
    return { rows, mostAdvantage: null, mostEfficient: null, sentence: null };

  const by = (pick: (t: SimTrial) => number) =>
    measured.reduce((best, r) =>
      r.trial && best.trial && pick(r.trial) > pick(best.trial) ? r : best,
    );
  const mostAdvantage = by((t) => t.readouts.actualMA);
  const mostEfficient = by((t) => t.readouts.efficiencyPercent);
  const a = mostAdvantage.trial;
  const e = mostEfficient.trial;
  if (!a || !e) return { rows, mostAdvantage: null, mostEfficient: null, sentence: null };

  const sentence =
    mostAdvantage.labId === mostEfficient.labId
      ? `In your trials the ${mostAdvantage.title.toLowerCase()} had both the largest mechanical advantage (${formatQuantity(a.readouts.actualMA, 2)}) and the highest efficiency (${formatQuantity(a.readouts.efficiencyPercent, 1)}%). Check whether this holds for other set-ups: the two do not have to go together.`
      : `In your trials the ${mostAdvantage.title.toLowerCase()} had the largest mechanical advantage (${formatQuantity(a.readouts.actualMA, 2)}), but the ${mostEfficient.title.toLowerCase()} was the most efficient (${formatQuantity(e.readouts.efficiencyPercent, 1)}%). Making a job easier and wasting less energy are different things.`;
  return { rows, mostAdvantage, mostEfficient, sentence };
}
