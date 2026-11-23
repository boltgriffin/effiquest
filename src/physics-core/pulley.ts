import { G, isNonNegative, isPositive, validation, type Validation } from './constants';
import type { EnergyLedger } from './ledger';
import type { MachineRun } from './run';

/**
 * Pulley system with n supporting rope segments (1 = single fixed pulley; 2-6 = block and
 * tackle), raised slowly. docs/PHYSICS_MODEL_PLAN.md section 3.3.
 *
 * Losses come from two named mechanisms:
 *  1. The movable block's own weight is lifted too (not useful work).
 *  2. Bearing friction in each sheave. For a sheave of radius R on an axle of radius r with
 *     bearing friction μ_b and parallel rope runs T_slack, T_tight:
 *       μ_b·r·(T_slack + T_tight) = (T_tight − T_slack)·R  ⇒  T_tight = K·T_slack,
 *       K = (R + μ_b·r) / (R − μ_b·r).
 *     Going from the dead end to the hauling end, each sheave multiplies the tension by K:
 *       T_i = T_1·K^(i−1) for the n supporting segments, effort F = T_1·K^n,
 *       and Σ T_i = W_load + W_block.
 * Assumptions: massless, inextensible rope with no slip; rope runs parallel; n sheaves in total
 * (the last one turns the hauling line); constant g.
 */
export interface PulleyParams {
  segments: number;
  loadMassKg: number;
  /** Mass of the movable block. Ignored (no movable block) when segments = 1. */
  blockMassKg: number;
  bearingFriction: number;
  axleRadiusM: number;
  sheaveRadiusM: number;
  liftM: number;
}

export const DEFAULT_PULLEY: PulleyParams = {
  segments: 4,
  loadMassKg: 20,
  blockMassKg: 1,
  bearingFriction: 0.1,
  axleRadiusM: 0.005,
  sheaveRadiusM: 0.04,
  liftM: 1,
};

export function validatePulley(p: PulleyParams): Validation {
  const errors: string[] = [];
  if (!(Number.isInteger(p.segments) && p.segments >= 1 && p.segments <= 6)) {
    errors.push('Supporting rope segments must be a whole number from 1 to 6.');
  }
  if (!isPositive(p.loadMassKg)) errors.push('The load mass must be greater than 0 kg.');
  if (!isNonNegative(p.blockMassKg)) errors.push('The block mass cannot be negative.');
  if (!isNonNegative(p.bearingFriction)) errors.push('Bearing friction cannot be negative.');
  if (!isNonNegative(p.axleRadiusM)) errors.push('The axle radius cannot be negative.');
  if (!isPositive(p.sheaveRadiusM))
    errors.push('The pulley wheel radius must be greater than 0 m.');
  if (!isPositive(p.liftM)) errors.push('The lift height must be greater than 0 m.');
  if (p.bearingFriction * p.axleRadiusM >= p.sheaveRadiusM) {
    errors.push('The bearing friction is too large for this pulley wheel; it cannot turn.');
  }
  return validation(errors);
}

export interface PulleyResult {
  loadN: number;
  blockN: number;
  effortN: number;
  /** Tension in each supporting segment, dead end first (N). */
  tensionsN: number[];
  ropePulledM: number;
  idealMA: number;
  actualMA: number;
  ledger: EnergyLedger;
}

export function solvePulley(p: PulleyParams): PulleyResult {
  const n = p.segments;
  const loadN = p.loadMassKg * G;
  const blockN = n >= 2 ? p.blockMassKg * G : 0;
  const muR = p.bearingFriction * p.axleRadiusM;
  const k = (p.sheaveRadiusM + muR) / (p.sheaveRadiusM - muR);
  // Σ_{i=1..n} K^(i−1) — equals n when K = 1.
  const series = k === 1 ? n : (Math.pow(k, n) - 1) / (k - 1);
  const t1 = (loadN + blockN) / series;
  const tensionsN = Array.from({ length: n }, (_, i) => t1 * Math.pow(k, i));
  const effortN = t1 * Math.pow(k, n);
  const ropePulledM = n * p.liftM;
  const inputJ = effortN * ropePulledM;
  const usefulJ = loadN * p.liftM;
  const blockJ = blockN * p.liftM;
  return {
    loadN,
    blockN,
    effortN,
    tensionsN,
    ropePulledM,
    idealMA: n,
    actualMA: loadN / effortN,
    ledger: {
      inputJ,
      usefulJ,
      losses: [
        { kind: 'machine-parts', label: 'Lifting the movable pulley block', joules: blockJ },
        {
          kind: 'friction',
          label: 'Friction in the pulley bearings',
          joules: inputJ - usefulJ - blockJ,
        },
      ],
      deltaKineticJ: 0,
    },
  };
}

export interface LiftOptions {
  /** Steady upward speed of the load (m/s). */
  loadSpeedMps?: number;
  /** Time to speed up from rest, and to slow to rest at the top (s). */
  rampTimeS?: number;
  /** Fixed integration step (s). */
  dtS?: number;
}

export interface LiftSample {
  tS: number;
  /** Height the load has risen (m). */
  loadRiseM: number;
  /** Rope pulled through the effort hand (m) = n × load rise. */
  ropePulledM: number;
  /** Effort force at this instant, as a spring scale would read it (N). */
  effortN: number;
  /** Work done by the effort so far (J). */
  inputWorkJ: number;
  /** Useful work so far: potential energy gained by the load (J). */
  usefulWorkJ: number;
}

export interface LiftResult {
  durationS: number;
  /** Effort during the constant-speed part: equals solvePulley(p).effortN. */
  steadyEffortN: number;
  samples: LiftSample[];
  ledger: EnergyLedger;
}

/**
 * Time simulation of a steady lift: the load rises `liftM` with a trapezoidal speed profile
 * (rest → steady speed → rest). Rope and sheaves are massless, so at each instant
 *   Σ T_i − (W_load + W_block) = (m_load + m_block)·a,   F = T_1·K^n,   rope speed = n·v_load.
 * Work terms use the step-average velocity, so the ledger closes to rounding error and the
 * kinetic-energy change over the whole run is zero.
 */
export function simulatePulleyLift(p: PulleyParams, opts: LiftOptions = {}): LiftResult {
  const speed = opts.loadSpeedMps ?? 0.2;
  const dt = opts.dtS ?? 1 / 240;
  const rampSteps = Math.max(1, Math.round((opts.rampTimeS ?? 0.4) / dt));
  const rampTime = rampSteps * dt;
  const cruiseSteps = Math.max(0, Math.round((p.liftM / speed - rampTime) / dt));
  const totalSteps = 2 * rampSteps + cruiseSteps;
  const accel = speed / rampTime;

  const n = p.segments;
  const loadM = p.loadMassKg;
  const blockM = n >= 2 ? p.blockMassKg : 0;
  const movingM = loadM + blockM;
  const muR = p.bearingFriction * p.axleRadiusM;
  const k = (p.sheaveRadiusM + muR) / (p.sheaveRadiusM - muR);
  const series = k === 1 ? n : (Math.pow(k, n) - 1) / (k - 1);
  const effortFor = (a: number) => (Math.pow(k, n) * movingM * (G + a)) / series;

  let y = 0;
  let v = 0;
  let inputJ = 0;
  let blockJ = 0;
  let usefulJ = 0;
  let frictionJ = 0;
  const samples: LiftSample[] = [
    { tS: 0, loadRiseM: 0, ropePulledM: 0, effortN: effortFor(0), inputWorkJ: 0, usefulWorkJ: 0 },
  ];
  const sampleEvery = Math.max(1, Math.round(1 / 60 / dt));

  for (let step = 0; step < totalSteps; step++) {
    const a = step < rampSteps ? accel : step >= rampSteps + cruiseSteps ? -accel : 0;
    const vNext = step === totalSteps - 1 ? 0 : v + a * dt;
    const aStep = (vNext - v) / dt;
    const vAvg = (v + vNext) / 2;
    const effortN = effortFor(aStep);
    const dy = vAvg * dt;
    y += dy;
    inputJ += effortN * n * dy;
    usefulJ += loadM * G * dy;
    blockJ += blockM * G * dy;
    // Bearing friction power = effort power − power delivered to the moving block by the ropes
    // (Σ T = m(g + a)). Computed independently so the ledger check is a real test.
    frictionJ += (effortN * n - movingM * (G + aStep)) * dy;
    v = vNext;
    if ((step + 1) % sampleEvery === 0 || step === totalSteps - 1) {
      samples.push({
        tS: (step + 1) * dt,
        loadRiseM: y,
        ropePulledM: n * y,
        effortN,
        inputWorkJ: inputJ,
        usefulWorkJ: usefulJ,
      });
    }
  }

  return {
    durationS: totalSteps * dt,
    steadyEffortN: effortFor(0),
    samples,
    ledger: {
      inputJ,
      usefulJ,
      losses: [
        { kind: 'machine-parts', label: 'Lifting the movable pulley block', joules: blockJ },
        { kind: 'friction', label: 'Friction in the pulley bearings', joules: frictionJ },
      ],
      deltaKineticJ: 0.5 * movingM * v * v,
    },
  };
}

/** The pulley run in the shared lab shape (input distance = rope pulled, output = load rise). */
export function pulleyMachineRun(p: PulleyParams, opts: LiftOptions = {}): MachineRun {
  const r = simulatePulleyLift(p, opts);
  const last = r.samples[r.samples.length - 1];
  return {
    durationS: r.durationS,
    steadyInputForceN: r.steadyEffortN,
    totalOutputDistanceM: last?.loadRiseM ?? 0,
    ledger: r.ledger,
    samples: r.samples.map((s) => ({
      tS: s.tS,
      inputForceN: s.effortN,
      inputDistanceM: s.ropePulledM,
      outputDistanceM: s.loadRiseM,
      inputWorkJ: s.inputWorkJ,
      usefulWorkJ: s.usefulWorkJ,
    })),
  };
}
