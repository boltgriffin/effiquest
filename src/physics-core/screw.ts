import { G, isNonNegative, isPositive, validation, type Validation } from './constants';
import { accelAt, sampleEvery, trapezoidProfile, type MachineRun, type MachineSample } from './run';

/**
 * Screw jack: a handle of radius R turns a screw (single start, square thread, pitch p, mean
 * thread radius r_m) that raises a load. One turn moves the handle 2πR and the load p:
 *   IMA = 2πR ÷ p.
 *
 * Thread friction (coefficient μ): the thread is an inclined plane wrapped round the screw, with
 * lead angle λ (tan λ = p ÷ 2π r_m) and friction angle φ (tan φ = μ). For an axial force
 * Q = W + m a (load plus what speeds it up), the tangential force at the thread is
 *   P = Q tan(λ + φ),   torque τ = P r_m,   effort F = τ ÷ R.
 * The thread's normal force is N = Q cos λ + P sin λ, and it slides r_m dθ ÷ cos λ per turn angle
 * dθ, so friction work is μ N r_m dθ ÷ cos λ: computed on its own, not as a remainder.
 * Self-locking: when φ ≥ λ the load cannot turn the screw back down by itself (η < 50 %).
 * Assumptions: frictionless thrust bearing (collar) and light screw; effort at right angles.
 */
export interface ScrewParams {
  loadMassKg: number;
  handleRadiusM: number;
  pitchM: number;
  threadRadiusM: number;
  threadFriction: number;
  liftM: number;
}

export const DEFAULT_SCREW: ScrewParams = {
  loadMassKg: 500,
  handleRadiusM: 0.25,
  pitchM: 0.005,
  threadRadiusM: 0.012,
  threadFriction: 0.15,
  liftM: 0.02,
};

export const leadAngle = (p: ScrewParams): number =>
  Math.atan(p.pitchM / (2 * Math.PI * p.threadRadiusM));
export const frictionAngle = (p: ScrewParams): number => Math.atan(p.threadFriction);

export function validateScrew(p: ScrewParams): Validation {
  const errors: string[] = [];
  if (!isPositive(p.loadMassKg)) errors.push('The load mass must be greater than 0 kg.');
  if (!isPositive(p.handleRadiusM)) errors.push('The handle radius must be greater than 0 m.');
  if (!isPositive(p.pitchM)) errors.push('The pitch must be greater than 0 m.');
  if (!isPositive(p.threadRadiusM)) errors.push('The thread radius must be greater than 0 m.');
  if (!isNonNegative(p.threadFriction)) errors.push('Thread friction cannot be negative.');
  if (!isPositive(p.liftM)) errors.push('The lift must be greater than 0 m.');
  if (errors.length === 0 && leadAngle(p) + frictionAngle(p) >= Math.PI / 2 - 1e-6) {
    errors.push('With this much friction the screw cannot be turned.');
  }
  return validation(errors);
}

/** Effort at the handle for a load acceleration a (m/s²). */
function effortN(p: ScrewParams, a: number): number {
  const Q = p.loadMassKg * (G + a);
  return (Q * p.threadRadiusM * Math.tan(leadAngle(p) + frictionAngle(p))) / p.handleRadiusM;
}

export interface ScrewSteady {
  loadN: number;
  effortN: number;
  torqueNm: number;
  idealMA: number;
  actualMA: number;
  efficiencyPercent: number;
  leadAngleDeg: number;
  frictionAngleDeg: number;
  selfLocking: boolean;
}

export function solveScrew(p: ScrewParams): ScrewSteady {
  const loadN = p.loadMassKg * G;
  const F = effortN(p, 0);
  const lam = leadAngle(p);
  const phi = frictionAngle(p);
  return {
    loadN,
    effortN: F,
    torqueNm: F * p.handleRadiusM,
    idealMA: (2 * Math.PI * p.handleRadiusM) / p.pitchM,
    actualMA: loadN / F,
    efficiencyPercent: (Math.tan(lam) / Math.tan(lam + phi)) * 100,
    leadAngleDeg: (lam * 180) / Math.PI,
    frictionAngleDeg: (phi * 180) / Math.PI,
    selfLocking: phi >= lam,
  };
}

export interface ScrewOptions {
  loadSpeedMps?: number;
  rampTimeS?: number;
  dtS?: number;
}

/** Time simulation of a steady lift; input, useful and thread-friction work integrated separately. */
export function simulateScrewLift(p: ScrewParams, opts: ScrewOptions = {}): MachineRun {
  const prof = trapezoidProfile(p.liftM, opts.loadSpeedMps ?? 0.004, opts.rampTimeS, opts.dtS);
  const dt = prof.dtS;
  const m = p.loadMassKg;
  const W = m * G;
  const lam = leadAngle(p);
  const tanLP = Math.tan(lam + frictionAngle(p));
  const handlePerRise = (2 * Math.PI * p.handleRadiusM) / p.pitchM;

  let y = 0;
  let v = 0;
  let inputJ = 0;
  let usefulJ = 0;
  let frictionJ = 0;
  const every = sampleEvery(prof);
  const samples: MachineSample[] = [
    {
      tS: 0,
      inputForceN: effortN(p, 0),
      inputDistanceM: 0,
      outputDistanceM: 0,
      inputWorkJ: 0,
      usefulWorkJ: 0,
    },
  ];

  for (let step = 0; step < prof.totalSteps; step++) {
    const vNext = step === prof.totalSteps - 1 ? 0 : v + accelAt(prof, step) * dt;
    const a = (vNext - v) / dt;
    const dy = ((v + vNext) / 2) * dt;
    const dTheta = (2 * Math.PI * dy) / p.pitchM;
    const Q = m * (G + a);
    const P = Q * tanLP;
    const N = Q * Math.cos(lam) + P * Math.sin(lam);
    const F = effortN(p, a);
    y += dy;
    inputJ += F * p.handleRadiusM * dTheta;
    usefulJ += W * dy;
    frictionJ += (p.threadFriction * N * p.threadRadiusM * dTheta) / Math.cos(lam);
    v = vNext;
    if ((step + 1) % every === 0 || step === prof.totalSteps - 1) {
      samples.push({
        tS: (step + 1) * dt,
        inputForceN: F,
        inputDistanceM: handlePerRise * y,
        outputDistanceM: y,
        inputWorkJ: inputJ,
        usefulWorkJ: usefulJ,
      });
    }
  }

  const s = solveScrew(p);
  return {
    durationS: prof.totalSteps * dt,
    steadyInputForceN: s.effortN,
    totalOutputDistanceM: y,
    samples,
    ledger: {
      inputJ,
      usefulJ,
      losses: [{ kind: 'friction', label: 'Friction in the screw thread', joules: frictionJ }],
      deltaKineticJ: 0.5 * m * v * v,
    },
    extras: {
      torqueNm: s.torqueNm,
      leadAngleDeg: s.leadAngleDeg,
      frictionAngleDeg: s.frictionAngleDeg,
      selfLocking: s.selfLocking ? 1 : 0,
      turns: p.liftM / p.pitchM,
    },
  };
}
