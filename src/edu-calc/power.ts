import { withUnit } from './format';
import { basisPhrase, result } from './result';
import type { CalcOptions, CalcResult } from './types';
import { Inputs } from './validation';

export interface PowerInput {
  /** Work done or energy transferred (J). */
  workJ: number;
  /** Time taken (s). */
  timeS: number;
}

/**
 * Average power: P = W / t.
 * Source: listed in the owner's brief (BRF); supports SRC-O6 (e.g. a bicycle climbing a hill
 * needs more power). Not a named concept-note formula, so labelled BRF/REC.
 */
export function power(input: PowerInput, opts: CalcOptions = {}): CalcResult {
  const v = new Inputs();
  v.finite('workJ', 'Work', input.workJ);
  v.positive('timeS', 'Time', input.timeS, 's');
  if (!v.ok) return v.fail('Power');

  const basis = opts.basis ?? 'measured';
  const value = input.workJ / input.timeS;
  return result({
    quantity: 'Power',
    symbol: 'P',
    value,
    unit: 'W',
    basis,
    formula: 'P = W ÷ t',
    substitution: `P = ${withUnit(input.workJ, 'J')} ÷ ${withUnit(input.timeS, 's')} = ${withUnit(value, 'W')}`,
    explanation: `Power is how fast work is done: ${withUnit(value, 'W')} means ${withUnit(value, 'J')} every second. Doing the same work in less time needs more power. ${basisPhrase[basis]}`,
    assumptions: ['This is the average power over the time interval.'],
    warnings:
      input.workJ < 0 ? ['The work is negative, so energy was taken away at this rate.'] : [],
    source: 'BRF/REC (supports SRC-O6)',
  });
}
