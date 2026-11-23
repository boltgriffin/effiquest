import { degToRad, G, isNonNegative, isPositive, validation, type Validation } from './constants';
import type { EnergyLedger } from './ledger';
import { accelAt, sampleEvery, trapezoidProfile, type MachineRun, type MachineSample } from './run';

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

export interface LeverTurnOptions {
  /** Steady turning speed of the beam (rad/s). */
  angularSpeed?: number;
  rampTimeS?: number;
  dtS?: number;
}

/**
 * Time simulation of the lever turned slowly through `rotationDeg` (rest → steady → rest).
 * The load (mass m on the load arm) has tangential acceleration a = α·L_l, so at each instant
 *   F·L_e = (W + m a)·L_l + μ_p·r_p·N,   N = F + W + m a   (massless beam, forces ⟂ beam)
 *   ⇒ F = (W + m a)(L_l + μ_p r_p) / (L_e − μ_p r_p).
 * Input, useful and friction work are integrated separately; the ledger closes to rounding error.
 */
export function simulateLeverTurn(p: LeverParams, opts: LeverTurnOptions = {}): MachineRun {
  const omega = opts.angularSpeed ?? 0.12;
  const phiMax = degToRad(p.rotationDeg);
  const prof = trapezoidProfile(phiMax, omega, opts.rampTimeS, opts.dtS);
  const dt = prof.dtS;
  const m = p.loadMassKg;
  const W = m * G;
  const muR = p.pivotFriction * p.pinRadiusM;
  const effortFor = (alpha: number) =>
    ((W + m * alpha * p.loadArmM) * (p.loadArmM + muR)) / (p.effortArmM - muR);

  let theta = 0;
  let w = 0;
  let inputJ = 0;
  let usefulJ = 0;
  let frictionJ = 0;
  const every = sampleEvery(prof);
  const samples: MachineSample[] = [
    {
      tS: 0,
      inputForceN: effortFor(0),
      inputDistanceM: 0,
      outputDistanceM: 0,
      inputWorkJ: 0,
      usefulWorkJ: 0,
    },
  ];

  for (let step = 0; step < prof.totalSteps; step++) {
    const wNext = step === prof.totalSteps - 1 ? 0 : w + accelAt(prof, step) * dt;
    const alpha = (wNext - w) / dt;
    const dTheta = ((w + wNext) / 2) * dt;
    const F = effortFor(alpha);
    const N = F + W + m * alpha * p.loadArmM;
    theta += dTheta;
    inputJ += F * p.effortArmM * dTheta;
    usefulJ += W * p.loadArmM * dTheta;
    frictionJ += muR * N * dTheta;
    w = wNext;
    if ((step + 1) % every === 0 || step === prof.totalSteps - 1) {
      samples.push({
        tS: (step + 1) * dt,
        inputForceN: F,
        inputDistanceM: p.effortArmM * theta,
        outputDistanceM: p.loadArmM * theta,
        inputWorkJ: inputJ,
        usefulWorkJ: usefulJ,
      });
    }
  }

  return {
    durationS: prof.totalSteps * dt,
    steadyInputForceN: effortFor(0),
    totalOutputDistanceM: p.loadArmM * theta,
    samples,
    ledger: {
      inputJ,
      usefulJ,
      losses: [{ kind: 'friction', label: 'Friction in the pivot', joules: frictionJ }],
      deltaKineticJ: 0.5 * m * (w * p.loadArmM) ** 2,
    },
  };
}
