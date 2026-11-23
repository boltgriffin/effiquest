import { G, isNonNegative, isPositive, validation, type Validation } from './constants';
import { accelAt, sampleEvery, trapezoidProfile, type MachineRun, type MachineSample } from './run';

/**
 * Wheel and axle used as a winch: the effort pulls a rope wound on the wheel (radius R); the load
 * hangs from a rope wound on the axle (radius r). One rigid body, so both turn by the same angle θ:
 *   effort rope moves R·θ, load rises r·θ  ⇒  IMA = R ÷ r.
 *
 * Losses: friction in the axle bearing. The bearing (journal radius r_b, coefficient μ_b) carries
 * the effort, the load and the wheel's own weight (all vertical):
 *   N = F + (W + m a) + M g,  friction torque = μ_b·r_b·N.
 * Rotation (wheel = uniform disk, I = ½ M R²; this links to τ_net = I α, SRC-O1):
 *   F·R = (W + m a)·r + I α + μ_b r_b N,  a = α r
 *   ⇒ F = [(W + m a)(r + μ_b r_b) + μ_b r_b M g + I α] ÷ (R − μ_b r_b)
 * Assumptions: light ropes that do not stretch or slip; rope runs vertical; axle inertia ignored.
 */
export interface WheelAxleParams {
  loadMassKg: number;
  wheelRadiusM: number;
  axleRadiusM: number;
  bearingFriction: number;
  /** Radius of the bearing journal where friction acts (m). */
  bearingRadiusM: number;
  wheelMassKg: number;
  liftM: number;
}

export const DEFAULT_WHEEL_AXLE: WheelAxleParams = {
  loadMassKg: 10,
  wheelRadiusM: 0.3,
  axleRadiusM: 0.05,
  bearingFriction: 0.15,
  bearingRadiusM: 0.01,
  wheelMassKg: 2,
  liftM: 0.5,
};

export function validateWheelAxle(p: WheelAxleParams): Validation {
  const errors: string[] = [];
  if (!isPositive(p.loadMassKg)) errors.push('The load mass must be greater than 0 kg.');
  if (!isPositive(p.wheelRadiusM)) errors.push('The wheel radius must be greater than 0 m.');
  if (!isPositive(p.axleRadiusM)) errors.push('The axle radius must be greater than 0 m.');
  if (isPositive(p.wheelRadiusM) && isPositive(p.axleRadiusM) && p.axleRadiusM >= p.wheelRadiusM) {
    errors.push('The axle must be smaller than the wheel.');
  }
  if (!isNonNegative(p.bearingFriction)) errors.push('Bearing friction cannot be negative.');
  if (!isNonNegative(p.bearingRadiusM)) errors.push('The bearing radius cannot be negative.');
  if (!isNonNegative(p.wheelMassKg)) errors.push('The wheel mass cannot be negative.');
  if (!isPositive(p.liftM)) errors.push('The lift height must be greater than 0 m.');
  if (p.bearingFriction * p.bearingRadiusM >= p.wheelRadiusM) {
    errors.push('The bearing friction is too large for this wheel; it cannot turn.');
  }
  return validation(errors);
}

/** Effort for a given load acceleration a (m/s²); a = 0 gives the steady effort. */
function effortN(p: WheelAxleParams, a: number): number {
  const W = p.loadMassKg * G;
  const muRb = p.bearingFriction * p.bearingRadiusM;
  const I = 0.5 * p.wheelMassKg * p.wheelRadiusM ** 2;
  const alpha = a / p.axleRadiusM;
  return (
    ((W + p.loadMassKg * a) * (p.axleRadiusM + muRb) + muRb * p.wheelMassKg * G + I * alpha) /
    (p.wheelRadiusM - muRb)
  );
}

export interface WheelAxleSteady {
  loadN: number;
  effortN: number;
  idealMA: number;
  actualMA: number;
  /** Closed-form efficiency for a steady lift (%). */
  efficiencyPercent: number;
}

export function solveWheelAxle(p: WheelAxleParams): WheelAxleSteady {
  const loadN = p.loadMassKg * G;
  const F = effortN(p, 0);
  const idealMA = p.wheelRadiusM / p.axleRadiusM;
  return {
    loadN,
    effortN: F,
    idealMA,
    actualMA: loadN / F,
    efficiencyPercent: ((loadN * p.axleRadiusM) / (F * p.wheelRadiusM)) * 100,
  };
}

export interface WinchOptions {
  loadSpeedMps?: number;
  rampTimeS?: number;
  dtS?: number;
}

/** Time simulation of a steady lift; input, useful and friction work integrated separately. */
export function simulateWheelAxleLift(p: WheelAxleParams, opts: WinchOptions = {}): MachineRun {
  const prof = trapezoidProfile(p.liftM, opts.loadSpeedMps ?? 0.12, opts.rampTimeS, opts.dtS);
  const dt = prof.dtS;
  const m = p.loadMassKg;
  const W = m * G;
  const muRb = p.bearingFriction * p.bearingRadiusM;
  const I = 0.5 * p.wheelMassKg * p.wheelRadiusM ** 2;

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
    const dTheta = dy / p.axleRadiusM;
    const F = effortN(p, a);
    const N = F + W + m * a + p.wheelMassKg * G;
    y += dy;
    inputJ += F * p.wheelRadiusM * dTheta;
    usefulJ += W * dy;
    frictionJ += muRb * N * dTheta;
    v = vNext;
    if ((step + 1) % every === 0 || step === prof.totalSteps - 1) {
      samples.push({
        tS: (step + 1) * dt,
        inputForceN: F,
        inputDistanceM: (p.wheelRadiusM / p.axleRadiusM) * y,
        outputDistanceM: y,
        inputWorkJ: inputJ,
        usefulWorkJ: usefulJ,
      });
    }
  }

  const omega = v / p.axleRadiusM;
  return {
    durationS: prof.totalSteps * dt,
    steadyInputForceN: effortN(p, 0),
    totalOutputDistanceM: y,
    samples,
    ledger: {
      inputJ,
      usefulJ,
      losses: [{ kind: 'friction', label: 'Friction in the axle bearing', joules: frictionJ }],
      deltaKineticJ: 0.5 * m * v * v + 0.5 * I * omega * omega,
    },
  };
}
