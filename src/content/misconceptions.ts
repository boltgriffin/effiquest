import type { MisconceptionId } from '@/types';

/**
 * The six learning gaps named in the concept note (docs/SOURCE_REQUIREMENTS.md, SRC-G1..G6),
 * paraphrased. `short` is a UI label; `belief` is the misconception as a learner might hold it.
 */
export interface Misconception {
  id: MisconceptionId;
  short: string;
  belief: string;
  source: string;
}

export const misconceptions: readonly Misconception[] = [
  {
    id: 'G1',
    short: 'Translational to rotational',
    belief: 'Formulas for straight-line motion have nothing to do with turning motion.',
    source: 'SRC-G1',
  },
  {
    id: 'G2',
    short: 'Mechanical advantage vs efficiency',
    belief: 'A machine that reduces effort is automatically efficient.',
    source: 'SRC-G2',
  },
  {
    id: 'G3',
    short: 'Simple to compound machines',
    belief: 'Simple machines and complex machines are unrelated lists to memorize.',
    source: 'SRC-G3',
  },
  {
    id: 'G4',
    short: 'The "perfect machine"',
    belief: 'Machines do not lose energy to friction, leakage or heat.',
    source: 'SRC-G4',
  },
  {
    id: 'G5',
    short: 'Efficiency in practice',
    belief: 'Efficiency is a definition to recall, not something to apply to real situations.',
    source: 'SRC-G5',
  },
  {
    id: 'G6',
    short: 'Hydraulics in real systems',
    belief: "Pascal's principle only applies to the textbook diagram, not to brakes or lifts.",
    source: 'SRC-G6',
  },
];

export function getMisconception(id: MisconceptionId): Misconception {
  const found = misconceptions.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown misconception ${id}`);
  return found;
}
