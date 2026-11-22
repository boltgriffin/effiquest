import { withUnit } from './format';
import { result } from './result';
import type { CalcResult } from './types';
import { G_STANDARD } from './units';
import { Inputs } from './validation';

/**
 * Weight from mass: W = m g. Keeps mass (kg) and weight (N, a force) clearly apart.
 * Source: needed for output force and useful work (SRC-O5).
 */
export function weight(input: { massKg: number; gravityMps2?: number }): CalcResult {
  const g = input.gravityMps2 ?? G_STANDARD;
  const v = new Inputs()
    .positive('massKg', 'Mass', input.massKg, 'kg')
    .positive('gravityMps2', 'Gravitational field strength', g, 'm/s²');
  if (!v.ok) return v.fail('Weight');

  const value = input.massKg * g;
  return result({
    quantity: 'Weight',
    symbol: 'W',
    value,
    unit: 'N',
    basis: 'measured',
    formula: 'W = m × g',
    substitution: `W = ${withUnit(input.massKg, 'kg')} × ${withUnit(g, 'm/s²')} = ${withUnit(value, 'N')}`,
    explanation: `Mass (${withUnit(input.massKg, 'kg')}) is the amount of matter; weight (${withUnit(value, 'N')}) is the force of gravity on it. Machines work against the weight, so forces in efficiency problems are in newtons, not kilograms.`,
    assumptions: [`g = ${g} m/s² near Earth's surface.`],
    source: 'SRC-O5 (load force)',
  });
}
