import { fixed, withUnit } from './format';
import { basisPhrase, result } from './result';
import type { Basis, CalcResult } from './types';
import { Inputs } from './validation';

const ROUNDING_TOLERANCE = 1e-9;

export interface EfficiencyInput {
  /** Useful output work, e.g. the potential energy gained by the load (J). */
  usefulWorkJ: number;
  /** Work put in by the effort (J). */
  inputWorkJ: number;
}

/**
 * Efficiency from work: η = W_out ÷ W_in × 100 %.
 * Only measured or simulated work is accepted: efficiency is never set or assumed.
 * Rejects W_out > W_in as a measurement error rather than reporting > 100 %.
 * Source: SRC-O2, SRC-O5.
 */
export function efficiency(
  input: EfficiencyInput,
  opts: { basis?: Exclude<Basis, 'ideal'> } = {},
): CalcResult {
  const v = new Inputs()
    .nonNegative('usefulWorkJ', 'Useful (output) work', input.usefulWorkJ, 'J')
    .positive('inputWorkJ', 'Input work', input.inputWorkJ, 'J');
  // A relative tolerance of 1e-9 absorbs floating-point rounding in simulated works (a perfect
  // machine can compute 98.10000000000001 J out of 98.1 J); real excesses are still rejected.
  if (v.ok && input.usefulWorkJ > input.inputWorkJ * (1 + ROUNDING_TOLERANCE)) {
    v.add(
      'usefulWorkJ',
      'Output work is larger than input work. A real machine cannot do that - check your measurements.',
    );
  }
  if (!v.ok) return v.fail('Efficiency');

  const basis = opts.basis ?? 'measured';
  // Within the rounding tolerance only: never report more than 100 %.
  const value = Math.min(100, (input.usefulWorkJ / input.inputWorkJ) * 100);
  const lostJ = Math.max(0, input.inputWorkJ - input.usefulWorkJ);
  const warnings =
    value === 100
      ? [
          '100 % efficiency only happens in an ideal machine. Real machines always lose some energy.',
        ]
      : [];

  return result({
    quantity: 'Efficiency',
    symbol: 'η',
    value,
    unit: '%',
    basis,
    formula: 'η = W_out ÷ W_in × 100%',
    substitution: `η = ${withUnit(input.usefulWorkJ, 'J')} ÷ ${withUnit(input.inputWorkJ, 'J')} × 100% = ${fixed(value, 1)}%`,
    explanation: `${fixed(value, 1)}% of the input work became useful work. The other ${fixed(100 - value, 1)}% (${withUnit(lostJ, 'J')}) was lost, for example as heat from friction or in lifting parts of the machine itself. Efficiency measures wasted energy; it is not the same as how much easier the machine makes the job. ${basisPhrase[basis]}`,
    assumptions: [
      'Input and output work are measured over the same movement.',
      'The machine starts and ends at rest, so no energy is left as motion.',
    ],
    warnings,
    source: 'SRC-O2, SRC-O5',
  });
}

/**
 * Efficiency from mechanical advantages: η = AMA ÷ IMA × 100 %. Equivalent to the work form when
 * both come from the same steady movement. Rejects AMA > IMA (impossible for a real machine).
 * Source: SRC-O2 (relates mechanical advantage to efficiency).
 */
export function efficiencyFromMA(
  input: { actualMA: number; idealMA: number },
  opts: { basis?: Exclude<Basis, 'ideal'> } = {},
): CalcResult {
  const v = new Inputs()
    .nonNegative('actualMA', 'Actual mechanical advantage', input.actualMA, '')
    .positive('idealMA', 'Ideal mechanical advantage', input.idealMA, '');
  if (v.ok && input.actualMA > input.idealMA) {
    v.add(
      'actualMA',
      'Actual mechanical advantage cannot be larger than the ideal mechanical advantage - check your measurements.',
    );
  }
  if (!v.ok) return v.fail('Efficiency');

  const basis = opts.basis ?? 'measured';
  const value = (input.actualMA / input.idealMA) * 100;
  return result({
    quantity: 'Efficiency',
    symbol: 'η',
    value,
    unit: '%',
    basis,
    formula: 'η = AMA ÷ IMA × 100%',
    substitution: `η = ${withUnit(input.actualMA, '')} ÷ ${withUnit(input.idealMA, '')} × 100% = ${fixed(value, 1)}%`,
    explanation: `A perfect machine would multiply force by ${withUnit(input.idealMA, '')}; this one manages ${withUnit(input.actualMA, '')}. The gap is due to friction and other losses. ${basisPhrase[basis]}`,
    assumptions: [
      'AMA and IMA come from the same steady movement of the same machine.',
      'AMA ÷ IMA equals W_out ÷ W_in only under that condition.',
    ],
    source: 'SRC-O2',
  });
}
