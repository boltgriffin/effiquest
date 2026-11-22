import { sig, withUnit } from './format';
import { basisPhrase, result } from './result';
import type { CalcOptions, CalcResult } from './types';
import { sinDeg } from './units';
import { Inputs } from './validation';

export interface TorqueInput {
  /** Distance from the pivot to where the force acts (m). */
  leverArmM: number;
  /** Size of the force (N). */
  forceN: number;
  /** Angle between the lever arm and the force (degrees, 0-180). Default 90 = perpendicular. */
  angleDeg?: number;
}

/**
 * Torque magnitude: τ = r F sin θ.
 * Source: SRC-O1 (apply translational ideas to rotation: torque).
 */
export function torque(input: TorqueInput, opts: CalcOptions = {}): CalcResult {
  const angleDeg = input.angleDeg ?? 90;
  const v = new Inputs()
    .nonNegative('leverArmM', 'Lever arm', input.leverArmM, 'm')
    .nonNegative('forceN', 'Force', input.forceN, 'N')
    .range('angleDeg', 'The angle between the lever arm and the force', angleDeg, 0, 180, '°');
  if (!v.ok) return v.fail('Torque');

  const basis = opts.basis ?? 'measured';
  const sin = sinDeg(angleDeg);
  const value = input.leverArmM * input.forceN * sin;
  const perpendicular = angleDeg === 90;
  const warnings: string[] = [];
  if (angleDeg === 0 || angleDeg === 180) {
    warnings.push(
      'The force points along the lever arm (through the pivot), so it cannot turn it.',
    );
  }

  return result({
    quantity: 'Torque',
    symbol: 'τ',
    value,
    unit: 'N·m',
    basis,
    formula: perpendicular ? 'τ = r × F' : 'τ = r × F × sin θ',
    substitution: perpendicular
      ? `τ = ${withUnit(input.leverArmM, 'm')} × ${withUnit(input.forceN, 'N')} = ${withUnit(value, 'N·m')}`
      : `τ = ${withUnit(input.leverArmM, 'm')} × ${withUnit(input.forceN, 'N')} × sin ${sig(angleDeg)}° = ${withUnit(value, 'N·m')}`,
    explanation: `Torque is the turning effect of a force. It grows with the force and with the distance from the pivot, and only the part of the force perpendicular to the lever arm turns it${
      perpendicular ? '' : ` (F sin θ = ${withUnit(input.forceN * sin, 'N')})`
    }. Torque plays the same role in turning that force plays in straight-line motion. ${basisPhrase[basis]}`,
    assumptions: [
      'r is measured from the pivot to the point where the force acts.',
      'θ is the angle between the lever arm and the force.',
      'This gives the size of the torque; its direction (clockwise or counter-clockwise) is not shown.',
    ],
    warnings,
    source: 'SRC-O1',
  });
}

export interface AngularAccelerationInput {
  /** Net (unbalanced) torque (N·m). */
  netTorqueNm: number;
  /** Moment of inertia about the axis (kg·m²). */
  momentOfInertiaKgM2: number;
}

/**
 * Newton's second law for rotation: α = τ_net ÷ I (from τ_net = I α).
 * Source: SRC-O1 (angular acceleration).
 */
export function angularAcceleration(
  input: AngularAccelerationInput,
  opts: CalcOptions = {},
): CalcResult {
  const v = new Inputs();
  v.finite('netTorqueNm', 'Net torque', input.netTorqueNm);
  v.positive('momentOfInertiaKgM2', 'Moment of inertia', input.momentOfInertiaKgM2, 'kg·m²');
  if (!v.ok) return v.fail('Angular acceleration');

  const basis = opts.basis ?? 'measured';
  const value = input.netTorqueNm / input.momentOfInertiaKgM2;
  return result({
    quantity: 'Angular acceleration',
    symbol: 'α',
    value,
    unit: 'rad/s²',
    basis,
    formula: 'α = τ_net ÷ I',
    substitution: `α = ${withUnit(input.netTorqueNm, 'N·m')} ÷ ${withUnit(input.momentOfInertiaKgM2, 'kg·m²')} = ${withUnit(value, 'rad/s²')}`,
    explanation: `This is Newton's second law for turning. In a straight line, a = F_net ÷ m; for rotation, torque takes the place of force and moment of inertia takes the place of mass. ${basisPhrase[basis]}`,
    assumptions: [
      'Rigid body turning about a fixed axis.',
      'τ_net is the total (unbalanced) torque, including friction torques.',
    ],
    warnings: value === 0 ? ['With no net torque, the spin rate does not change.'] : [],
    source: 'SRC-O1',
  });
}
