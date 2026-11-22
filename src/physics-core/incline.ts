import { degToRad, G, isNonNegative, isPositive, validation, type Validation } from './constants';
import type { EnergyLedger } from './ledger';

/**
 * Block pulled up a ramp, parallel to the slope, with kinetic (Coulomb) friction.
 * docs/PHYSICS_MODEL_PLAN.md section 3.1.
 *
 * Assumptions: rigid block and ramp; constant g; one kinetic friction coefficient; the pull is
 * parallel to the slope; static friction is not modelled (the block is assumed to start sliding).
 */
export interface InclineModelParams {
  angleDeg: number;
  /** Kinetic friction coefficient μ (dimensionless). */
  friction: number;
  massKg: number;
  /** Length of the ramp surface the block travels (m). */
  lengthM: number;
}

export function validateIncline(p: InclineModelParams): Validation {
  const errors: string[] = [];
  if (!(Number.isFinite(p.angleDeg) && p.angleDeg > 0 && p.angleDeg < 90)) {
    errors.push('The ramp angle must be between 0° and 90°.');
  }
  if (!isNonNegative(p.friction)) errors.push('The friction coefficient cannot be negative.');
  if (!isPositive(p.massKg)) errors.push('The mass must be greater than 0 kg.');
  if (!isPositive(p.lengthM)) errors.push('The ramp length must be greater than 0 m.');
  return validation(errors);
}

export interface InclineSteadyState {
  weightN: number;
  heightM: number;
  /** Effort needed to pull at constant speed: mg(sin θ + μ cos θ). */
  inputForceN: number;
  frictionForceN: number;
  idealMA: number;
  actualMA: number;
  /** Closed form: sin θ / (sin θ + μ cos θ) × 100. Used to cross-check the simulation. */
  efficiencyPercent: number;
}

/** Closed-form constant-speed solution. */
export function inclineSteadyState(p: InclineModelParams): InclineSteadyState {
  const t = degToRad(p.angleDeg);
  const weightN = p.massKg * G;
  const normalN = weightN * Math.cos(t);
  const frictionForceN = p.friction * normalN;
  const inputForceN = weightN * Math.sin(t) + frictionForceN;
  return {
    weightN,
    heightM: p.lengthM * Math.sin(t),
    inputForceN,
    frictionForceN,
    idealMA: 1 / Math.sin(t),
    actualMA: weightN / inputForceN,
    efficiencyPercent: (Math.sin(t) / (Math.sin(t) + p.friction * Math.cos(t))) * 100,
  };
}

export interface PullOptions {
  /** Cruise speed of the pull (m/s). Slow, so the learner can read a steady scale. */
  speedMps?: number;
  /** Time to speed up from rest, and to slow down to rest at the top (s). */
  rampTimeS?: number;
  /** Fixed integration step (s), independent of the display frame rate. */
  dtS?: number;
}

export interface PullSample {
  tS: number;
  /** Distance travelled along the ramp (m). */
  positionM: number;
  /** Force applied by the learner at this instant (N). */
  forceN: number;
}

export interface PullResult {
  durationS: number;
  /** Steady force during the constant-speed part: what a spring scale settles on (N). */
  steadyForceN: number;
  distanceM: number;
  heightGainM: number;
  ledger: EnergyLedger;
  /** Samples at ~60 Hz for animation and plotting. */
  samples: PullSample[];
}

/**
 * Simulates a start-at-rest, end-at-rest pull to the top of the ramp with a fixed time step.
 * The velocity profile is trapezoidal (speed up, cruise, slow down) with a whole number of steps
 * per phase, so the block ends exactly at rest. Position and every work term use the step-average
 * velocity (trapezoid rule), which makes m·a·v̄·dt equal the exact kinetic-energy change: the
 * ledger closes to floating-point rounding.
 */
export function simulateInclinePull(p: InclineModelParams, opts: PullOptions = {}): PullResult {
  const speed = opts.speedMps ?? 0.25;
  const dt = opts.dtS ?? 1 / 240;
  const rampSteps = Math.max(1, Math.round((opts.rampTimeS ?? 0.4) / dt));
  const rampTime = rampSteps * dt;
  // Distance during speed-up + slow-down is speed × rampTime; the rest is at cruise speed.
  const cruiseSteps = Math.max(0, Math.round((p.lengthM / speed - rampTime) / dt));
  const totalSteps = 2 * rampSteps + cruiseSteps;
  const accel = speed / rampTime;
  const t = degToRad(p.angleDeg);
  const sin = Math.sin(t);
  const cos = Math.cos(t);
  const m = p.massKg;
  const frictionN = p.friction * m * G * cos;

  let x = 0;
  let v = 0;
  let inputJ = 0;
  let frictionJ = 0;
  const samples: PullSample[] = [{ tS: 0, positionM: 0, forceN: 0 }];
  const sampleEvery = Math.max(1, Math.round(1 / 60 / dt));

  for (let step = 0; step < totalSteps; step++) {
    const a = step < rampSteps ? accel : step >= rampSteps + cruiseSteps ? -accel : 0;
    // The last step lands exactly on rest, removing accumulated rounding.
    const vNext = step === totalSteps - 1 ? 0 : v + a * dt;
    const aStep = (vNext - v) / dt;
    const vAvg = (v + vNext) / 2;
    const forceN = m * aStep + m * G * sin + frictionN;
    x += vAvg * dt;
    inputJ += forceN * vAvg * dt;
    frictionJ += frictionN * vAvg * dt;
    v = vNext;
    if ((step + 1) % sampleEvery === 0) {
      samples.push({ tS: (step + 1) * dt, positionM: x, forceN });
    }
  }
  const time = totalSteps * dt;
  samples.push({ tS: time, positionM: x, forceN: 0 });

  const heightGainM = x * sin;
  const ledger: EnergyLedger = {
    inputJ,
    usefulJ: m * G * heightGainM,
    losses: [{ kind: 'friction', label: 'Friction on the ramp', joules: frictionJ }],
    deltaKineticJ: 0.5 * m * v * v,
  };

  return {
    durationS: time,
    steadyForceN: m * G * (sin + p.friction * cos),
    distanceM: x,
    heightGainM,
    ledger,
    samples,
  };
}
