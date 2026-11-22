import type { MachineId } from './content';

/**
 * Measured quantities from one lab run, in SI units (N, m, J).
 * Efficiency is always an OUTPUT computed from work, never a user input (BRF-5).
 */
export interface SimReadouts {
  inputForceN: number;
  outputForceN: number;
  inputDistanceM: number;
  outputDistanceM: number;
  inputWorkJ: number;
  outputWorkJ: number;
  /** Actual mechanical advantage = outputForce / inputForce. */
  actualMA: number;
  /** Ideal mechanical advantage = velocity ratio = inputDistance / outputDistance. */
  idealMA: number;
  /** Efficiency in percent = outputWork / inputWork * 100. */
  efficiencyPercent: number;
}

export interface SimTrial {
  id: string;
  ownerId: string;
  experimentId: string;
  machine: MachineId;
  params: Record<string, number>;
  readouts: SimReadouts;
  engineVersion: string;
  seed: number;
  /** False when the run failed consistency checks (e.g. efficiency > 100%). */
  valid: boolean;
  recordedAt: string;
}
