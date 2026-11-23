import { G, isNonNegative, isPositive, validation, type Validation } from './constants';
import { accelAt, sampleEvery, trapezoidProfile, type MachineRun, type MachineSample } from './run';

/**
 * Bicycle climbing a hill: a compound machine (SRC-G3, SRC-O6).
 *   pedal crank (wheel and axle, crank length R_c) → chainring (z₁ teeth)
 *   → chain → rear sprocket (z₂ teeth) → rear wheel (radius R_w) → the hill (inclined plane, slope α)
 * Sprocket pitch radius r = p ÷ (2 sin(π/z)) for chain pitch p. One crank turn moves the chain
 * 2π r₁, turns the wheel by r₁/r₂ of a turn and so moves the bike 2π R_w r₁/r₂ along the road.
 *   IMA (pedal path ÷ height gained) = (R_c r₂ ÷ R_w r₁) ÷ sin α = gears × hill.
 *
 * Losses, each computed from its own named parameter:
 *   rolling resistance  C_rr m g cos α  per metre of road (tyre flexing → heat)
 *   air drag            ½ ρ C_dA v²     per metre of road
 *   hub bearings        μ_b r_b m g cos α per radian of the wheel
 *   chain friction      μ_c T r_pin (2π/z₁ + 2π/z₂) per link passing (each link bends onto the
 *                       chainring and onto the sprocket under the tension T)
 *   bottom bracket      μ_b r_b (T + F) per radian of the crank
 * The effort F is the steady force on the pedal at right angles to the crank.
 * Drivetrain efficiency = work delivered at the rear wheel ÷ pedal work (decision D-13 framing).
 */
export interface BicycleParams {
  massKg: number;
  slopePercent: number;
  chainringTeeth: number;
  sprocketTeeth: number;
  rollingCoeff: number;
  chainFriction: number;
  bearingFriction: number;
  crankM: number;
  wheelRadiusM: number;
  chainPitchM: number;
  pinRadiusM: number;
  bearingRadiusM: number;
  dragAreaM2: number;
  airDensity: number;
  distanceM: number;
}

export const DEFAULT_BICYCLE: BicycleParams = {
  massKg: 80,
  slopePercent: 6,
  chainringTeeth: 34,
  sprocketTeeth: 28,
  rollingCoeff: 0.006,
  chainFriction: 0.1,
  bearingFriction: 0.002,
  crankM: 0.17,
  wheelRadiusM: 0.34,
  chainPitchM: 0.0127,
  pinRadiusM: 0.0018,
  bearingRadiusM: 0.01,
  dragAreaM2: 0.5,
  airDensity: 1.2,
  distanceM: 30,
};

export const sprocketRadius = (teeth: number, pitchM: number): number =>
  pitchM / (2 * Math.sin(Math.PI / teeth));

export function validateBicycle(p: BicycleParams): Validation {
  const errors: string[] = [];
  if (!isPositive(p.massKg)) errors.push('The mass must be greater than 0 kg.');
  if (!(p.slopePercent > 0 && p.slopePercent <= 30))
    errors.push('The slope must be between 0 % and 30 %.');
  if (!(Number.isInteger(p.chainringTeeth) && p.chainringTeeth >= 20))
    errors.push('The chainring needs at least 20 teeth.');
  if (!(Number.isInteger(p.sprocketTeeth) && p.sprocketTeeth >= 9))
    errors.push('The sprocket needs at least 9 teeth.');
  for (const [v, name] of [
    [p.rollingCoeff, 'Rolling resistance'],
    [p.chainFriction, 'Chain friction'],
    [p.bearingFriction, 'Bearing friction'],
  ] as const) {
    if (!isNonNegative(v)) errors.push(`${name} cannot be negative.`);
  }
  if (!isPositive(p.distanceM)) errors.push('The climb must be longer than 0 m.');
  return validation(errors);
}

interface Geometry {
  alpha: number;
  r1: number;
  r2: number;
  /** chain-friction work per metre of chain per newton of tension */
  chainK: number;
}

function geometry(p: BicycleParams): Geometry {
  const r1 = sprocketRadius(p.chainringTeeth, p.chainPitchM);
  const r2 = sprocketRadius(p.sprocketTeeth, p.chainPitchM);
  const chainK =
    (p.chainFriction *
      p.pinRadiusM *
      ((2 * Math.PI) / p.chainringTeeth + (2 * Math.PI) / p.sprocketTeeth)) /
    p.chainPitchM;
  return { alpha: Math.atan(p.slopePercent / 100), r1, r2, chainK };
}

interface StepForces {
  F: number;
  T: number;
  wheelForce: number;
}

/** Forces for road speed v and acceleration a. */
function forces(p: BicycleParams, g: Geometry, v: number, a: number): StepForces {
  const { alpha, r1, r2, chainK } = g;
  const mg = p.massKg * G;
  const muRb = p.bearingFriction * p.bearingRadiusM;
  const wheelForce =
    mg * Math.sin(alpha) +
    p.rollingCoeff * mg * Math.cos(alpha) +
    0.5 * p.airDensity * p.dragAreaM2 * v * v +
    p.massKg * a;
  const tauRear = wheelForce * p.wheelRadiusM + muRb * mg * Math.cos(alpha);
  const T = tauRear / r2;
  // Chainring torque: chain tension plus chain friction per radian of the crank.
  const tauFront = T * r1 * (1 + chainK);
  const F = (tauFront + muRb * T) / (p.crankM - muRb);
  return { F, T, wheelForce };
}

export interface BicycleSteady {
  weightN: number;
  effortN: number;
  idealMA: number;
  actualMA: number;
  gearRatio: number;
  efficiencyPercent: number;
  drivetrainEfficiencyPercent: number;
  cadenceRpm: number;
  powerW: number;
}

export function solveBicycle(p: BicycleParams, speedMps = 2): BicycleSteady {
  const run = simulateBicycleClimb(p, { speedMps });
  const g = geometry(p);
  const { F } = forces(p, g, speedMps, 0);
  const weightN = p.massKg * G;
  const omegaCrank = (speedMps / p.wheelRadiusM) * (g.r2 / g.r1);
  return {
    weightN,
    effortN: F,
    idealMA: (p.crankM * g.r2) / (p.wheelRadiusM * g.r1) / Math.sin(g.alpha),
    actualMA: weightN / F,
    gearRatio: p.chainringTeeth / p.sprocketTeeth,
    efficiencyPercent: (run.ledger.usefulJ / run.ledger.inputJ) * 100,
    drivetrainEfficiencyPercent: run.extras?.drivetrainEfficiencyPercent ?? Number.NaN,
    cadenceRpm: (omegaCrank * 60) / (2 * Math.PI),
    powerW: F * p.crankM * omegaCrank,
  };
}

export interface BicycleOptions {
  speedMps?: number;
  rampTimeS?: number;
  dtS?: number;
}

/** Time simulation of the climb; every loss integrated on its own. */
export function simulateBicycleClimb(p: BicycleParams, opts: BicycleOptions = {}): MachineRun {
  const speed = opts.speedMps ?? 2;
  const prof = trapezoidProfile(p.distanceM, speed, opts.rampTimeS ?? 1, opts.dtS ?? 1 / 120);
  const dt = prof.dtS;
  const g = geometry(p);
  const mg = p.massKg * G;
  const cos = Math.cos(g.alpha);
  const sin = Math.sin(g.alpha);
  const muRb = p.bearingFriction * p.bearingRadiusM;
  const pedalPerRoad = (p.crankM * g.r2) / (p.wheelRadiusM * g.r1);

  let d = 0;
  let v = 0;
  let inputJ = 0;
  let usefulJ = 0;
  let rollJ = 0;
  let airJ = 0;
  let hubJ = 0;
  let chainJ = 0;
  let bbJ = 0;
  let wheelJ = 0;
  const every = sampleEvery(prof) * 2;
  const s0 = forces(p, g, 0, 0);
  const samples: MachineSample[] = [
    {
      tS: 0,
      inputForceN: s0.F,
      inputDistanceM: 0,
      outputDistanceM: 0,
      inputWorkJ: 0,
      usefulWorkJ: 0,
    },
  ];

  for (let step = 0; step < prof.totalSteps; step++) {
    const vNext = step === prof.totalSteps - 1 ? 0 : v + accelAt(prof, step) * dt;
    const a = (vNext - v) / dt;
    const vMid = (v + vNext) / 2;
    const dd = vMid * dt;
    const dPhi = dd / p.wheelRadiusM;
    const ds = dPhi * g.r2;
    const dTheta = ds / g.r1;
    // Air drag uses the step's mean of v² so the work matches ½ρC_dA ∫v² dd.
    const v2 = (v * v + v * vNext + vNext * vNext) / 3;
    const { F, T, wheelForce } = forces(p, g, Math.sqrt(v2), a);
    d += dd;
    inputJ += F * p.crankM * dTheta;
    usefulJ += mg * sin * dd;
    rollJ += p.rollingCoeff * mg * cos * dd;
    airJ += 0.5 * p.airDensity * p.dragAreaM2 * v2 * dd;
    hubJ += muRb * mg * cos * dPhi;
    chainJ += g.chainK * T * ds;
    bbJ += muRb * (T + F) * dTheta;
    wheelJ += wheelForce * dd;
    v = vNext;
    if ((step + 1) % every === 0 || step === prof.totalSteps - 1) {
      samples.push({
        tS: (step + 1) * dt,
        inputForceN: F,
        inputDistanceM: pedalPerRoad * d,
        outputDistanceM: d * sin,
        inputWorkJ: inputJ,
        usefulWorkJ: usefulJ,
      });
    }
  }

  const steady = forces(p, g, speed, 0);
  return {
    durationS: prof.totalSteps * dt,
    steadyInputForceN: steady.F,
    totalOutputDistanceM: d * sin,
    samples,
    ledger: {
      inputJ,
      usefulJ,
      losses: [
        {
          kind: 'friction',
          label: 'Tyres flexing on the road (rolling resistance)',
          joules: rollJ,
        },
        { kind: 'friction', label: 'Air resistance', joules: airJ },
        { kind: 'friction', label: 'Friction in the chain', joules: chainJ },
        {
          kind: 'friction',
          label: 'Friction in the bearings (pedals and wheels)',
          joules: hubJ + bbJ,
        },
      ],
      deltaKineticJ: 0.5 * p.massKg * v * v,
    },
    extras: {
      // Work reaching the road through the rear wheel ÷ pedal work (D-13: how much of the
      // rider's effort reaches the wheels).
      drivetrainEfficiencyPercent: (wheelJ / inputJ) * 100,
      gearRatio: p.chainringTeeth / p.sprocketTeeth,
      distanceM: d,
      cadenceRpm: ((speed / p.wheelRadiusM) * (g.r2 / g.r1) * 60) / (2 * Math.PI),
      powerW: steady.F * p.crankM * (speed / p.wheelRadiusM) * (g.r2 / g.r1),
    },
  };
}
