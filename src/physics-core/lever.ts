import { degToRad, G, isNonNegative, isPositive, validation, type Validation } from './constants';
import type { EnergyLedger } from './ledger';

/**
 * First-class lever (fulcrum between effort and load) turned slowly through a small angle,
 * with friction in the pivot pin. docs/PHYSICS_MODEL_PLAN.md section 3.2.
 *
 * Pivot friction torque: τ_f = μ_p · r_p · N, with N = F_effort + W_load (both forces vertical,
 * so the pin carries their sum). Quasi-static moment balance:
 *   F_e·L_e = W·L_l + μ_p·r_p·(F_e + W)   ⇒   F_e = W·(L_l + μ_p·r_p) / (L_e − μ_p·r_p)
 * Assumptions: massless rigid beam; forces stay vertical; constant g.
 */
export interface LeverParams {
  loadMassKg: number;
  effortArmM: number;
  loadArmM: number;
  /** Friction coefficient in the pivot pin (0 = frictionless). */
  pivotFriction: number;
  /** Radius of the pivot pin (m). */
  pinRadiusM: number;
  /** Angle the beam is turned through (degrees). */
  rotationDeg: number;
}

export const DEFAULT_LEVER: LeverParams = {
  loadMassKg: 10,
  effortArmM: 0.8,
  loadArmM: 0.2,
  pivotFriction: 0.2,
  pinRadiusM: 0.01,
  rotationDeg: 10,
};

export function validateLever(p: LeverParams): Validation {
  const errors: string[] = [];
  if (!isPositive(p.loadMassKg)) errors.push('The load mass must be greater than 0 kg.');
  if (!isPositive(p.effortArmM)) errors.push('The effort arm must be longer than 0 m.');
  if (!isPositive(p.loadArmM)) errors.push('The load arm must be longer than 0 m.');
  if (!isNonNegative(p.pivotFriction)) errors.push('Pivot friction cannot be negative.');
  if (!isNonNegative(p.pinRadiusM)) errors.push('The pin radius cannot be negative.');
  if (!(Number.isFinite(p.rotationDeg) && p.rotationDeg > 0 && p.rotationDeg <= 45)) {
    errors.push('The turning angle must be between 0° and 45°.');
  }
  if (p.pivotFriction * p.pinRadiusM >= p.effortArmM) {
    errors.push('The pivot friction is too large for this effort arm; the lever cannot turn.');
  }
  return validation(errors);
}

export interface LeverResult {
  loadN: number;
  effortN: number;
  /** Arc length moved by the effort point (m). */
  effortDistanceM: number;
  /** Arc length (≈ height) moved by the load point (m). */
  loadDistanceM: number;
  idealMA: number;
  actualMA: number;
  ledger: EnergyLedger;
}

export function solveLever(p: LeverParams): LeverResult {
  const loadN = p.loadMassKg * G;
  const muR = p.pivotFriction * p.pinRadiusM;
  const effortN = (loadN * (p.loadArmM + muR)) / (p.effortArmM - muR);
  const phi = degToRad(p.rotationDeg);
  const effortDistanceM = p.effortArmM * phi;
  const loadDistanceM = p.loadArmM * phi;
  const frictionTorque = muR * (effortN + loadN);
  return {
    loadN,
    effortN,
    effortDistanceM,
    loadDistanceM,
    idealMA: p.effortArmM / p.loadArmM,
    actualMA: loadN / effortN,
    ledger: {
      inputJ: effortN * effortDistanceM,
      usefulJ: loadN * loadDistanceM,
      losses: [{ kind: 'friction', label: 'Friction in the pivot', joules: frictionTorque * phi }],
      deltaKineticJ: 0,
    },
  };
}
