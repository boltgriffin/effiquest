/**
 * Deterministic machine models and the energy ledger. Pure TypeScript: no React, Three, DOM or
 * storage imports (enforced by ESLint). Every efficiency shown in the app comes from here.
 */
export { G, quantize, degToRad, type Validation } from './constants';
export {
  checkLedger,
  imbalance,
  totalLosses,
  LEDGER_TOLERANCE,
  type EnergyLedger,
  type EnergyLoss,
  type LedgerCheck,
} from './ledger';
export {
  inclineMachineRun,
  inclineSteadyState,
  simulateInclinePull,
  validateIncline,
  type InclineModelParams,
  type PullResult,
  type PullSample,
} from './incline';
export {
  DEFAULT_LEVER,
  simulateLeverTurn,
  solveLever,
  validateLever,
  type LeverParams,
  type LeverResult,
} from './lever';
export {
  DEFAULT_WHEEL_AXLE,
  simulateWheelAxleLift,
  solveWheelAxle,
  validateWheelAxle,
  type WheelAxleParams,
  type WheelAxleSteady,
} from './wheelAxle';
export {
  areaFromDiameter,
  simulateHydraulicLift,
  solveHydraulic,
  validateHydraulic,
  type HydraulicParams,
  type HydraulicSteady,
} from './hydraulic';
export {
  accelAt,
  trapezoidProfile,
  type MachineRun,
  type MachineSample,
  type Profile,
} from './run';
export {
  DEFAULT_PULLEY,
  pulleyMachineRun,
  simulatePulleyLift,
  solvePulley,
  validatePulley,
  type LiftResult,
  type LiftSample,
  type PulleyParams,
  type PulleyResult,
} from './pulley';

export {
  DEFAULT_SCREW,
  frictionAngle,
  leadAngle,
  simulateScrewLift,
  solveScrew,
  validateScrew,
  type ScrewParams,
  type ScrewSteady,
} from './screw';
export {
  DEFAULT_WEDGE,
  simulateWedgePush,
  solveWedge,
  validateWedge,
  type WedgeParams,
  type WedgeSteady,
} from './wedge';

/** Bumped whenever a model changes, and stored with each recorded trial. */
export const ENGINE_VERSION = 'physics-core@1.1.0';
