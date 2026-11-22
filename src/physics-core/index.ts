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
  inclineSteadyState,
  simulateInclinePull,
  validateIncline,
  type InclineModelParams,
  type PullResult,
  type PullSample,
} from './incline';
export {
  DEFAULT_LEVER,
  solveLever,
  validateLever,
  type LeverParams,
  type LeverResult,
} from './lever';
export {
  DEFAULT_PULLEY,
  simulatePulleyLift,
  solvePulley,
  validatePulley,
  type LiftResult,
  type LiftSample,
  type PulleyParams,
  type PulleyResult,
} from './pulley';

/** Bumped whenever a model changes, and stored with each recorded trial. */
export const ENGINE_VERSION = 'physics-core@1.0.0';
