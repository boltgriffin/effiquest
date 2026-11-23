import { G, isNonNegative, isPositive, validation, type Validation } from './constants';
import { accelAt, sampleEvery, trapezoidProfile, type MachineRun, type MachineSample } from './run';

/**
 * Lifting wedge: a wedge of angle α is pushed along the floor under a load that can only move up
 * (held by smooth guides). Pushing the wedge a distance x raises the load x tan α:
 *   IMA = x ÷ (x tan α) = 1 ÷ tan α  (= wedge length ÷ thickness).
 *
 * Friction μ on both faces (wedge–load and wedge–floor). With Q = W + m a, the load's vertical
 * balance gives the face normal force N₁ = Q ÷ (cos α − μ sin α); the floor carries N₂ = Q
 * (light wedge). The push is
 *   P = N₁ (sin α + μ cos α) + μ N₂ = Q [tan(α + φ) + tan φ],  tan φ = μ.
 * Friction work is computed face by face: the load slides x ÷ cos α along the top face and the
 * wedge slides x along the floor.
 * Self-locking: the wedge stays put when released if α ≤ 2φ (it does not pop out).
 * Assumptions: light rigid wedge; smooth vertical guides; same μ on both faces; push horizontal.
 */
export interface WedgeParams {
  loadMassKg: number;
  wedgeAngleDeg: number;
  friction: number;
  pushM: number;
}

export const DEFAULT_WEDGE: WedgeParams = {
  loadMassKg: 100,
  wedgeAngleDeg: 10,
  friction: 0.15,
  pushM: 0.2,
};

const rad = (deg: number) => (deg * Math.PI) / 180;

export function validateWedge(p: WedgeParams): Validation {
  const errors: string[] = [];
  if (!isPositive(p.loadMassKg)) errors.push('The load mass must be greater than 0 kg.');
  if (!(p.wedgeAngleDeg > 0 && p.wedgeAngleDeg < 60)) {
    errors.push('The wedge angle must be between 0° and 60°.');
  }
  if (!isNonNegative(p.friction)) errors.push('Friction cannot be negative.');
  if (!isPositive(p.pushM)) errors.push('The push distance must be greater than 0 m.');
  if (errors.length === 0) {
    const a = rad(p.wedgeAngleDeg);
    if (Math.cos(a) - p.friction * Math.sin(a) <= 1e-6) {
      errors.push('With this much friction the wedge jams and cannot be pushed in.');
    }
  }
  return validation(errors);
}

function forces(p: WedgeParams, aLoad: number) {
  const alpha = rad(p.wedgeAngleDeg);
  const mu = p.friction;
  const Q = p.loadMassKg * (G + aLoad);
  const N1 = Q / (Math.cos(alpha) - mu * Math.sin(alpha));
  const N2 = Q;
  const P = N1 * (Math.sin(alpha) + mu * Math.cos(alpha)) + mu * N2;
  return { alpha, N1, N2, P };
}

export interface WedgeSteady {
  loadN: number;
  effortN: number;
  idealMA: number;
  actualMA: number;
  efficiencyPercent: number;
  selfLocking: boolean;
}

export function solveWedge(p: WedgeParams): WedgeSteady {
  const loadN = p.loadMassKg * G;
  const { alpha, P } = forces(p, 0);
  return {
    loadN,
    effortN: P,
    idealMA: 1 / Math.tan(alpha),
    actualMA: loadN / P,
    efficiencyPercent: ((loadN * Math.tan(alpha)) / P) * 100,
    selfLocking: p.wedgeAngleDeg <= 2 * ((Math.atan(p.friction) * 180) / Math.PI),
  };
}

export interface WedgeOptions {
  pushSpeedMps?: number;
  rampTimeS?: number;
  dtS?: number;
}

/** Time simulation of pushing the wedge in; input, useful and both friction works integrated separately. */
export function simulateWedgePush(p: WedgeParams, opts: WedgeOptions = {}): MachineRun {
  const prof = trapezoidProfile(p.pushM, opts.pushSpeedMps ?? 0.1, opts.rampTimeS, opts.dtS);
  const dt = prof.dtS;
  const m = p.loadMassKg;
  const W = m * G;
  const tanA = Math.tan(rad(p.wedgeAngleDeg));
  const cosA = Math.cos(rad(p.wedgeAngleDeg));

  let x = 0;
  let u = 0; // wedge speed
  let inputJ = 0;
  let usefulJ = 0;
  let topJ = 0;
  let floorJ = 0;
  const every = sampleEvery(prof);
  const samples: MachineSample[] = [
    {
      tS: 0,
      inputForceN: forces(p, 0).P,
      inputDistanceM: 0,
      outputDistanceM: 0,
      inputWorkJ: 0,
      usefulWorkJ: 0,
    },
  ];

  for (let step = 0; step < prof.totalSteps; step++) {
    const uNext = step === prof.totalSteps - 1 ? 0 : u + accelAt(prof, step) * dt;
    const aLoad = ((uNext - u) / dt) * tanA;
    const dx = ((u + uNext) / 2) * dt;
    const { N1, N2, P } = forces(p, aLoad);
    x += dx;
    inputJ += P * dx;
    usefulJ += W * dx * tanA;
    topJ += (p.friction * N1 * dx) / cosA;
    floorJ += p.friction * N2 * dx;
    u = uNext;
    if ((step + 1) % every === 0 || step === prof.totalSteps - 1) {
      samples.push({
        tS: (step + 1) * dt,
        inputForceN: P,
        inputDistanceM: x,
        outputDistanceM: x * tanA,
        inputWorkJ: inputJ,
        usefulWorkJ: usefulJ,
      });
    }
  }

  const s = solveWedge(p);
  const vLoad = u * tanA;
  return {
    durationS: prof.totalSteps * dt,
    steadyInputForceN: s.effortN,
    totalOutputDistanceM: x * tanA,
    samples,
    ledger: {
      inputJ,
      usefulJ,
      losses: [
        { kind: 'friction', label: 'Friction between the wedge and the load', joules: topJ },
        { kind: 'friction', label: 'Friction between the wedge and the floor', joules: floorJ },
      ],
      deltaKineticJ: 0.5 * m * vLoad * vLoad,
    },
    extras: { selfLocking: s.selfLocking ? 1 : 0, riseM: x * tanA },
  };
}
