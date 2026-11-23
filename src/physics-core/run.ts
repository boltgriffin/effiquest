import type { EnergyLedger } from './ledger';

/**
 * Shared shapes for time-stepped machine runs. Each machine keeps its own physics module; this
 * file only defines what a run looks like to the lab UI, plus the shared motion profile.
 */
export interface MachineSample {
  tS: number;
  /** Effort force at this instant, as a spring scale reads it (N). */
  inputForceN: number;
  /** Distance moved by the effort so far (m; arc length for rotating machines). */
  inputDistanceM: number;
  /** Height the load has risen so far (m). */
  outputDistanceM: number;
  /** Work done by the effort so far (J). */
  inputWorkJ: number;
  /** Useful work so far: potential energy gained by the load (J). */
  usefulWorkJ: number;
}

export interface MachineRun {
  durationS: number;
  /** Effort during the constant-speed part of the run (N). */
  steadyInputForceN: number;
  /** Total load rise for a complete run (m). */
  totalOutputDistanceM: number;
  samples: MachineSample[];
  ledger: EnergyLedger;
}

/**
 * Trapezoidal motion profile (rest → steady speed → rest) with a whole number of fixed steps per
 * phase, so the run ends exactly at rest. Used with step-average velocities (trapezoid rule) so
 * work integrals close the energy ledger to rounding error.
 */
export interface Profile {
  dtS: number;
  rampSteps: number;
  cruiseSteps: number;
  totalSteps: number;
  /** Acceleration magnitude during the ramps (units/s²). */
  accel: number;
}

export function trapezoidProfile(
  distance: number,
  speed: number,
  rampTimeS = 0.4,
  dtS = 1 / 240,
): Profile {
  const rampSteps = Math.max(1, Math.round(rampTimeS / dtS));
  const rampTime = rampSteps * dtS;
  const cruiseSteps = Math.max(0, Math.round((distance / speed - rampTime) / dtS));
  return {
    dtS,
    rampSteps,
    cruiseSteps,
    totalSteps: 2 * rampSteps + cruiseSteps,
    accel: speed / rampTime,
  };
}

/** Acceleration at a step: +a while speeding up, 0 cruising, −a while slowing down. */
export function accelAt(p: Profile, step: number): number {
  if (step < p.rampSteps) return p.accel;
  if (step >= p.rampSteps + p.cruiseSteps) return -p.accel;
  return 0;
}

/** Steps between ~60 Hz samples. */
export const sampleEvery = (p: Profile): number => Math.max(1, Math.round(1 / 60 / p.dtS));
