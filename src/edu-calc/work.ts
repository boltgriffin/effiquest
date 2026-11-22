import { sig, withUnit } from './format';
import { basisPhrase, result } from './result';
import type { CalcOptions, CalcResult } from './types';
import { cosDeg } from './units';
import { Inputs } from './validation';

export interface WorkInput {
  /** Size of the force (N). */
  forceN: number;
  /** Size of the displacement (m). */
  distanceM: number;
  /** Angle between the force and the displacement (degrees, 0-180). Default 0 = parallel. */
  angleDeg?: number;
}

/**
 * Work done by a constant force: W = F d cos θ.
 * When force and displacement are parallel (θ = 0°) this is the familiar W = F d.
 * Source: needed for input/output work and efficiency (SRC-O5).
 */
export function work(input: WorkInput, opts: CalcOptions = {}): CalcResult {
  const angleDeg = input.angleDeg ?? 0;
  const v = new Inputs()
    .nonNegative('forceN', 'Force', input.forceN, 'N')
    .nonNegative('distanceM', 'Distance', input.distanceM, 'm')
    .range('angleDeg', 'The angle between force and motion', angleDeg, 0, 180, '°');
  if (!v.ok) return v.fail('Work');

  const basis = opts.basis ?? 'measured';
  const cos = cosDeg(angleDeg);
  const value = input.forceN * input.distanceM * cos;
  const parallel = angleDeg === 0;
  const warnings: string[] = [];
  if (angleDeg === 90) {
    warnings.push(
      'The force is at 90° to the motion, so it does no work, even though something is being pushed.',
    );
  } else if (angleDeg > 90) {
    warnings.push(
      'The force points partly against the motion, so the work is negative: it takes energy away.',
    );
  }

  return result({
    quantity: 'Work',
    symbol: 'W',
    value,
    unit: 'J',
    basis,
    formula: parallel ? 'W = F × d' : 'W = F × d × cos θ',
    substitution: parallel
      ? `W = ${withUnit(input.forceN, 'N')} × ${withUnit(input.distanceM, 'm')} = ${withUnit(value, 'J')}`
      : `W = ${withUnit(input.forceN, 'N')} × ${withUnit(input.distanceM, 'm')} × cos ${sig(angleDeg)}° = ${withUnit(value, 'J')}`,
    explanation: `Work is done when a force moves something. Only the part of the force along the direction of motion counts${
      parallel
        ? '; here the force and motion are in the same direction'
        : ` (F cos θ = ${withUnit(input.forceN * cos, 'N')})`
    }. ${withUnit(value, 'J')} of energy was transferred. ${basisPhrase[basis]}`,
    assumptions: [
      'The force is constant over the distance.',
      'θ is the angle between the force and the direction of motion.',
      ...(parallel ? ['W = F × d is used only because force and motion are parallel.'] : []),
    ],
    warnings,
    source: 'SRC-O5 (work is needed to calculate efficiency)',
  });
}
