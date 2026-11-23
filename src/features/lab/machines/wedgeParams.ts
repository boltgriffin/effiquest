import type { WedgeParams } from '@/physics-core';

/** Lifting-wedge lab settings (SI units, angle in degrees). */
export type WedgeLabParams = {
  loadMassKg: number;
  wedgeAngleDeg: number;
  friction: number;
};

export const DEFAULT_WEDGE_PARAMS: WedgeLabParams = {
  loadMassKg: 100,
  wedgeAngleDeg: 10,
  friction: 0.15,
};

/** Fixed apparatus: the wedge is pushed 0.20 m at a steady 0.1 m/s. */
export const WEDGE_PUSH_M = 0.2;
export const WEDGE_SPEED_MPS = 0.1;

export function toWedgeModel(p: WedgeLabParams): WedgeParams {
  return { ...p, pushM: WEDGE_PUSH_M };
}
