import { G, isNonNegative, isPositive, validation, type Validation } from './constants';
import { accelAt, sampleEvery, trapezoidProfile, type MachineRun, type MachineSample } from './run';

/**
 * Hydraulic press: a small input piston (area A₁) pushes fluid into a large output piston (A₂)
 * that lifts the load. docs/PHYSICS_MODEL_PLAN.md section 3.6; concept note SRC-O4.
 *
 * Ideal (Pascal): the pressure P is the same everywhere in the fluid, so F₂ = P·A₂ = F₁·A₂/A₁ and
 * the input piston moves A₂/A₁ times as far as the output piston.
 *
 * Losses (named, physical; no efficiency setting):
 *  1. Seal friction: a constant force f₁, f₂ at each piston seal, opposing motion.
 *  2. Leakage: fluid escapes past the seals at q = k·P (laminar leak, k in m³/(Pa·s)). The input
 *     piston must push extra fluid, so it travels further than A₂/A₁ × the load's rise, and the
 *     escaping fluid carries away energy P·q.
 *
 * At each instant (output piston speed v₂, acceleration a):
 *   P·A₂ = W + m a + f₂,   A₁·v₁ = A₂·v₂ + k·P,   F₁ = P·A₁ + f₁
 * Energy: F₁v₁ = (W + m a + f₂)v₂ + k P² + f₁v₁  → useful + KE + seal friction + leakage.
 * Assumptions: incompressible fluid; pistons at the same height (no extra pressure from depth);
 * light pistons; leakage returns to the reservoir.
 */
export interface HydraulicParams {
  loadMassKg: number;
  inputDiameterM: number;
  outputDiameterM: number;
  /** Friction force at the input piston seal (N). */
  inputSealN: number;
  /** Friction force at the output piston seal (N). */
  outputSealN: number;
  /** Leak conductance k: leak flow per unit pressure (m³/(Pa·s)). */
  leakConductance: number;
  liftM: number;
}

export const areaFromDiameter = (d: number): number => (Math.PI * d * d) / 4;

export function validateHydraulic(p: HydraulicParams): Validation {
  const errors: string[] = [];
  if (!isPositive(p.loadMassKg)) errors.push('The load mass must be greater than 0 kg.');
  if (!isPositive(p.inputDiameterM)) errors.push('The input piston must be wider than 0 m.');
  if (!isPositive(p.outputDiameterM)) errors.push('The output piston must be wider than 0 m.');
  if (!isNonNegative(p.inputSealN) || !isNonNegative(p.outputSealN)) {
    errors.push('Seal friction cannot be negative.');
  }
  if (!isNonNegative(p.leakConductance)) errors.push('Leakage cannot be negative.');
  if (!isPositive(p.liftM)) errors.push('The lift height must be greater than 0 m.');
  return validation(errors);
}

export interface HydraulicSteady {
  /** Fluid pressure while lifting at steady speed (Pa). */
  pressurePa: number;
  effortN: number;
  areaRatio: number;
  /** Ideal output force from this effort by Pascal's principle, F₁·A₂/A₁ (N). */
  idealOutputN: number;
}

export function solveHydraulic(p: HydraulicParams): HydraulicSteady {
  const A1 = areaFromDiameter(p.inputDiameterM);
  const A2 = areaFromDiameter(p.outputDiameterM);
  const pressurePa = (p.loadMassKg * G + p.outputSealN) / A2;
  const effortN = pressurePa * A1 + p.inputSealN;
  return { pressurePa, effortN, areaRatio: A2 / A1, idealOutputN: (effortN * A2) / A1 };
}

export interface PressOptions {
  /** Steady speed of the output piston (m/s). */
  loadSpeedMps?: number;
  rampTimeS?: number;
  dtS?: number;
}

/** Time simulation of a steady lift; every energy term integrated separately. */
export function simulateHydraulicLift(p: HydraulicParams, opts: PressOptions = {}): MachineRun {
  const prof = trapezoidProfile(p.liftM, opts.loadSpeedMps ?? 0.02, opts.rampTimeS, opts.dtS);
  const dt = prof.dtS;
  const A1 = areaFromDiameter(p.inputDiameterM);
  const A2 = areaFromDiameter(p.outputDiameterM);
  const m = p.loadMassKg;
  const W = m * G;
  const k = p.leakConductance;
  const pressureFor = (a: number) => (W + m * a + p.outputSealN) / A2;

  let y = 0;
  let x1 = 0;
  let v = 0;
  let inputJ = 0;
  let usefulJ = 0;
  let sealJ = 0;
  let leakJ = 0;
  let leakedM3 = 0;
  const every = sampleEvery(prof);
  const samples: MachineSample[] = [
    {
      tS: 0,
      inputForceN: pressureFor(0) * A1 + p.inputSealN,
      inputDistanceM: 0,
      outputDistanceM: 0,
      inputWorkJ: 0,
      usefulWorkJ: 0,
    },
  ];

  for (let step = 0; step < prof.totalSteps; step++) {
    const vNext = step === prof.totalSteps - 1 ? 0 : v + accelAt(prof, step) * dt;
    const a = (vNext - v) / dt;
    const v2 = (v + vNext) / 2;
    const P = pressureFor(a);
    const leakFlow = k * P;
    const v1 = (A2 * v2 + leakFlow) / A1;
    const F1 = P * A1 + p.inputSealN;
    y += v2 * dt;
    x1 += v1 * dt;
    inputJ += F1 * v1 * dt;
    usefulJ += W * v2 * dt;
    sealJ += p.inputSealN * v1 * dt + p.outputSealN * v2 * dt;
    leakJ += P * leakFlow * dt;
    leakedM3 += leakFlow * dt;
    v = vNext;
    if ((step + 1) % every === 0 || step === prof.totalSteps - 1) {
      samples.push({
        tS: (step + 1) * dt,
        inputForceN: F1,
        inputDistanceM: x1,
        outputDistanceM: y,
        inputWorkJ: inputJ,
        usefulWorkJ: usefulJ,
      });
    }
  }

  const steady = solveHydraulic(p);
  return {
    durationS: prof.totalSteps * dt,
    steadyInputForceN: steady.effortN,
    totalOutputDistanceM: y,
    samples,
    idealInputDistanceM: y * (A2 / A1),
    extras: {
      pressurePa: steady.pressurePa,
      areaRatio: steady.areaRatio,
      idealOutputN: steady.idealOutputN,
      leakedVolumeM3: leakedM3,
    },
    ledger: {
      inputJ,
      usefulJ,
      losses: [
        { kind: 'friction', label: 'Friction at the piston seals', joules: sealJ },
        { kind: 'leakage', label: 'Fluid leaking past the seals', joules: leakJ },
      ],
      deltaKineticJ: 0.5 * m * v * v,
    },
  };
}
