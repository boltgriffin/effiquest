import type { PulleyParams } from '@/physics-core';

/**
 * Pulley lab settings the learner can change (owner decision 2026-11-23: selectable 1-4
 * supporting segments; effort is measured at a steady pull, not set).
 */
export type PulleyLabParams = {
  /** Supporting rope segments (whole number 1-4): 1 single fixed, 2 single movable, 3-4 block and tackle. */
  segments: number;
  loadMassKg: number;
  /** Movable pulley block mass (no movable block when segments = 1). */
  blockMassKg: number;
  /** Friction coefficient in each pulley's axle bearing (0 = frictionless). */
  bearingFriction: number;
};

export const DEFAULT_PULLEY_PARAMS: PulleyLabParams = {
  segments: 2,
  loadMassKg: 10,
  blockMassKg: 1,
  bearingFriction: 0.15,
};

/** Fixed apparatus dimensions (shown in the model assumptions). */
export const PULLEY_GEOMETRY = {
  liftM: 1,
  axleRadiusM: 0.005,
  sheaveRadiusM: 0.04,
} as const;

/** Steady load speed during a run (m/s). */
export const LOAD_SPEED_MPS = 0.2;

export const SEGMENT_NAMES: Record<number, string> = {
  1: 'Single fixed pulley',
  2: 'Single movable pulley',
  3: 'Block and tackle (3 segments)',
  4: 'Block and tackle (4 segments)',
};

export function toModel(p: PulleyLabParams): PulleyParams {
  return { ...p, ...PULLEY_GEOMETRY };
}

export function samePulleyParams(a: PulleyLabParams, b: PulleyLabParams): boolean {
  return (
    a.segments === b.segments &&
    a.loadMassKg === b.loadMassKg &&
    a.blockMassKg === b.blockMassKg &&
    a.bearingFriction === b.bearingFriction
  );
}
