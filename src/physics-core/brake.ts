import { G, isNonNegative, isPositive, validation, type Validation } from './constants';
import { sampleEvery, trapezoidProfile, type MachineRun, type MachineSample } from './run';

/**
 * Hydraulic disc brake: a compound machine (SRC-O4, SRC-O6, SRC-G6).
 *   brake pedal (lever, pedal ratio i = pedal arm ÷ pushrod arm)
 *   → master cylinder (piston area A₁) → brake fluid (Pascal: same pressure everywhere)
 *   → caliper piston (area A₂) → the pads squeeze the disc with the clamp force Q
 *   → friction on the disc (pad coefficient μ_pad) → braking force at the tyre (disc radius ÷ wheel radius)
 * Pushing the caliper piston x₂ moves the master piston x₁ = x₂ A₂/A₁ and the pedal x₁ i:
 *   IMA = i × A₂/A₁.
 *
 * The run: the pads are pushed through the last `padTravelM` of their stroke against the full
 * clamp force Q (a steady squeeze; real clamp force builds up as the pads compress).
 * Losses, each from its own parameter: a constant friction force at each piston seal, and
 * friction in the pedal pivot pin (coefficient μ_p, pin radius r_p) under the pivot force F₁ + F.
 * Fluid is incompressible and free of air; the brake line does not swell.
 */
export interface BrakeParams {
  clampForceN: number;
  pedalRatio: number;
  masterDiameterM: number;
  caliperDiameterM: number;
  sealFrictionN: number;
  pivotFriction: number;
  padFriction: number;
  pedalArmM: number;
  pivotPinRadiusM: number;
  padTravelM: number;
  discRadiusM: number;
  wheelRadiusM: number;
}

export const DEFAULT_BRAKE: BrakeParams = {
  clampForceN: 4000,
  pedalRatio: 4,
  masterDiameterM: 0.019,
  caliperDiameterM: 0.048,
  sealFrictionN: 15,
  pivotFriction: 0.2,
  padFriction: 0.4,
  pedalArmM: 0.3,
  pivotPinRadiusM: 0.006,
  padTravelM: 0.0005,
  discRadiusM: 0.12,
  wheelRadiusM: 0.3,
};

const area = (d: number) => (Math.PI * d * d) / 4;

export function validateBrake(p: BrakeParams): Validation {
  const errors: string[] = [];
  if (!isPositive(p.clampForceN)) errors.push('The clamp force must be greater than 0 N.');
  if (!(p.pedalRatio >= 1)) errors.push('The pedal ratio must be at least 1.');
  if (!isPositive(p.masterDiameterM))
    errors.push('The master cylinder diameter must be greater than 0 m.');
  if (!isPositive(p.caliperDiameterM))
    errors.push('The caliper piston diameter must be greater than 0 m.');
  for (const [v, name] of [
    [p.sealFrictionN, 'Seal friction'],
    [p.pivotFriction, 'Pivot friction'],
    [p.padFriction, 'Pad friction'],
  ] as const) {
    if (!isNonNegative(v)) errors.push(`${name} cannot be negative.`);
  }
  if (p.pivotFriction * p.pivotPinRadiusM >= p.pedalArmM)
    errors.push('The pedal pivot is too stiff to move.');
  return validation(errors);
}

export interface BrakeSteady {
  pressurePa: number;
  masterForceN: number;
  effortN: number;
  idealMA: number;
  actualMA: number;
  efficiencyPercent: number;
  discFrictionN: number;
  tyreBrakingForceN: number;
}

function steady(p: BrakeParams) {
  const A1 = area(p.masterDiameterM);
  const A2 = area(p.caliperDiameterM);
  const P = (p.clampForceN + p.sealFrictionN) / A2;
  const F1 = P * A1 + p.sealFrictionN;
  const muR = p.pivotFriction * p.pivotPinRadiusM;
  // Pedal: F·L = F₁·(L/i) + μ_p r_p (F₁ + F)
  const F = (F1 * (p.pedalArmM / p.pedalRatio) + muR * F1) / (p.pedalArmM - muR);
  return { A1, A2, P, F1, F, muR };
}

export function solveBrake(p: BrakeParams): BrakeSteady {
  const s = steady(p);
  const idealMA = p.pedalRatio * (s.A2 / s.A1);
  const discFrictionN = 2 * p.padFriction * p.clampForceN; // two pads, one on each side of the disc
  return {
    pressurePa: s.P,
    masterForceN: s.F1,
    effortN: s.F,
    idealMA,
    actualMA: p.clampForceN / s.F,
    efficiencyPercent: (p.clampForceN / s.F / idealMA) * 100,
    discFrictionN,
    tyreBrakingForceN: (discFrictionN * p.discRadiusM) / p.wheelRadiusM,
  };
}

export interface BrakeOptions {
  /** Caliper piston speed while squeezing (m/s). */
  padSpeedMps?: number;
  rampTimeS?: number;
  dtS?: number;
}

/** Time simulation of the squeeze; pad work, seal friction and pivot friction integrated separately. */
export function simulateBrakeApply(p: BrakeParams, opts: BrakeOptions = {}): MachineRun {
  const prof = trapezoidProfile(
    p.padTravelM,
    opts.padSpeedMps ?? 0.0002,
    opts.rampTimeS ?? 0.3,
    opts.dtS ?? 1 / 240,
  );
  const dt = prof.dtS;
  const s = steady(p);
  const ratioMaster = s.A2 / s.A1;

  let x2 = 0;
  let v = 0;
  let inputJ = 0;
  let usefulJ = 0;
  let sealJ = 0;
  let pivotJ = 0;
  const every = sampleEvery(prof);
  const samples: MachineSample[] = [
    {
      tS: 0,
      inputForceN: s.F,
      inputDistanceM: 0,
      outputDistanceM: 0,
      inputWorkJ: 0,
      usefulWorkJ: 0,
    },
  ];
  for (let step = 0; step < prof.totalSteps; step++) {
    const accel =
      step < prof.rampSteps
        ? prof.accel
        : step >= prof.rampSteps + prof.cruiseSteps
          ? -prof.accel
          : 0;
    const vNext = step === prof.totalSteps - 1 ? 0 : v + accel * dt;
    const dx2 = ((v + vNext) / 2) * dt;
    const dx1 = dx2 * ratioMaster;
    const dTheta = (dx1 * p.pedalRatio) / p.pedalArmM;
    x2 += dx2;
    // Pistons and pedal are light: forces are the steady ones throughout the squeeze.
    inputJ += s.F * p.pedalArmM * dTheta;
    usefulJ += p.clampForceN * dx2;
    sealJ += p.sealFrictionN * (dx1 + dx2);
    pivotJ += s.muR * (s.F1 + s.F) * dTheta;
    v = vNext;
    if ((step + 1) % every === 0 || step === prof.totalSteps - 1) {
      samples.push({
        tS: (step + 1) * dt,
        inputForceN: s.F,
        inputDistanceM: x2 * ratioMaster * p.pedalRatio,
        outputDistanceM: x2,
        inputWorkJ: inputJ,
        usefulWorkJ: usefulJ,
      });
    }
  }
  const sol = solveBrake(p);
  return {
    durationS: prof.totalSteps * dt,
    steadyInputForceN: s.F,
    totalOutputDistanceM: x2,
    samples,
    ledger: {
      inputJ,
      usefulJ,
      losses: [
        { kind: 'friction', label: 'Friction at the piston seals', joules: sealJ },
        { kind: 'friction', label: 'Friction in the pedal pivot', joules: pivotJ },
      ],
      deltaKineticJ: 0,
    },
    extras: {
      pressurePa: s.P,
      masterForceN: s.F1,
      discFrictionN: sol.discFrictionN,
      tyreBrakingForceN: sol.tyreBrakingForceN,
      pedalTravelM: p.padTravelM * ratioMaster * p.pedalRatio,
    },
  };
}

/** Used by the lab template, which treats the output force as a weight: Q expressed in kg. */
export const clampForceAsMassKg = (clampForceN: number): number => clampForceN / G;
