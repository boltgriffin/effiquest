import { withUnit } from './format';
import { basisPhrase, result } from './result';
import type { Basis, CalcResult } from './types';
import { Inputs } from './validation';

export interface ActualMAInput {
  /** Force the machine exerts on the load (e.g. the load's weight when lifting steadily) (N). */
  outputForceN: number;
  /** Effort force applied (N). */
  inputForceN: number;
}

/**
 * Actual mechanical advantage: AMA = F_out ÷ F_in. Uses real (measured or simulated) forces, so it
 * includes the effect of friction. Source: SRC-O2.
 */
export function actualMechanicalAdvantage(
  input: ActualMAInput,
  opts: { basis?: Exclude<Basis, 'ideal'> } = {},
): CalcResult {
  const v = new Inputs()
    .nonNegative('outputForceN', 'Output force', input.outputForceN, 'N')
    .positive('inputForceN', 'Input (effort) force', input.inputForceN, 'N');
  if (!v.ok) return v.fail('Actual mechanical advantage');

  const basis = opts.basis ?? 'measured';
  const value = input.outputForceN / input.inputForceN;
  return result({
    quantity: 'Actual mechanical advantage',
    symbol: 'AMA',
    value,
    unit: '',
    basis,
    formula: 'AMA = F_out ÷ F_in',
    substitution: `AMA = ${withUnit(input.outputForceN, 'N')} ÷ ${withUnit(input.inputForceN, 'N')} = ${withUnit(value, '')}`,
    explanation: `The machine multiplies your force by ${withUnit(value, '')}. ${
      value < 1
        ? 'An AMA below 1 means you push harder than the load, usually to gain distance or speed.'
        : 'Mechanical advantage tells you how much easier the job feels. It does not tell you how much energy is wasted: that is efficiency.'
    } ${basisPhrase[basis]}`,
    assumptions: ['Forces are read while the machine moves at a steady speed.'],
    source: 'SRC-O2',
  });
}

export interface VelocityRatioInput {
  /** Distance moved by the effort (m). */
  inputDistanceM: number;
  /** Distance moved by the load (m). */
  outputDistanceM: number;
}

/**
 * Velocity ratio (ideal mechanical advantage): VR = IMA = d_in ÷ d_out.
 * Purely geometric: friction does not change it. Always an ideal value.
 * Source: BRF/REC; it is the comparison needed to separate MA from efficiency (SRC-O2).
 */
export function velocityRatio(input: VelocityRatioInput): CalcResult {
  const v = new Inputs()
    .nonNegative('inputDistanceM', 'Effort distance', input.inputDistanceM, 'm')
    .positive('outputDistanceM', 'Load distance', input.outputDistanceM, 'm');
  if (!v.ok) return v.fail('Velocity ratio');

  const value = input.inputDistanceM / input.outputDistanceM;
  return result({
    quantity: 'Velocity ratio (ideal mechanical advantage)',
    symbol: 'VR',
    value,
    unit: '',
    basis: 'ideal',
    formula: 'VR = IMA = d_in ÷ d_out',
    substitution: `VR = ${withUnit(input.inputDistanceM, 'm')} ÷ ${withUnit(input.outputDistanceM, 'm')} = ${withUnit(value, '')}`,
    explanation: `The effort moves ${withUnit(value, '')} times as far as the load. In a perfect, frictionless machine this would also be the force advantage. A real machine's actual mechanical advantage is lower, because some effort is used against friction. ${basisPhrase.ideal}`,
    assumptions: [
      'Distances are measured over the same movement.',
      'Depends only on the machine’s geometry, not on friction.',
    ],
    source: 'BRF/REC (supports SRC-O2)',
  });
}

/** Geometric IMA for the first-release machines, each an ideal value. */
export const idealMA = {
  /** Inclined plane: IMA = L ÷ h (slope length ÷ height). */
  incline: (slopeLengthM: number, heightM: number) =>
    velocityRatio({ inputDistanceM: slopeLengthM, outputDistanceM: heightM }),
  /** Lever: IMA = effort arm ÷ load arm. */
  lever: (effortArmM: number, loadArmM: number) =>
    velocityRatio({ inputDistanceM: effortArmM, outputDistanceM: loadArmM }),
  /** Wheel and axle (effort on the wheel): IMA = R ÷ r. */
  wheelAndAxle: (wheelRadiusM: number, axleRadiusM: number) =>
    velocityRatio({ inputDistanceM: wheelRadiusM, outputDistanceM: axleRadiusM }),
  /** Pulley system: IMA = number of rope segments supporting the load. */
  pulley: (supportingSegments: number) =>
    velocityRatio({ inputDistanceM: supportingSegments, outputDistanceM: 1 }),
};
