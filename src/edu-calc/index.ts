/**
 * Educational calculation engine (docs/PHYSICS_CALCULATIONS.md).
 * Pure TypeScript: no React, Three, DOM or storage (enforced by ESLint).
 * Every function returns a structured CalcResult: value + unit + formula + substitution +
 * explanation + assumptions + basis (ideal / measured / simulated), or the list of input errors.
 */
export type { Basis, CalcError, CalcFailure, CalcResult, Calculation, CalcOptions } from './types';
export { Inputs } from './validation';
export {
  G_STANDARD,
  circleAreaM2,
  convert,
  cosDeg,
  degToRad,
  fromSI,
  radToDeg,
  sinDeg,
  toSI,
  weightN,
  type Dimension,
  type UnitOf,
} from './units';
export { fixed, roundTo, sig, withUnit } from './format';
export { weight } from './force';
export { work, type WorkInput } from './work';
export { power, type PowerInput } from './power';
export {
  angularAcceleration,
  torque,
  type AngularAccelerationInput,
  type TorqueInput,
} from './torque';
export {
  actualMechanicalAdvantage,
  idealMA,
  velocityRatio,
  type ActualMAInput,
  type VelocityRatioInput,
} from './mechanicalAdvantage';
export { efficiency, efficiencyFromMA, type EfficiencyInput } from './efficiency';
export {
  pascalOutputDistance,
  pascalOutputForce,
  pressure,
  type PascalInput,
  type PressureInput,
} from './hydraulics';
