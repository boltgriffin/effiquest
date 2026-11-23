import type { LeverParams } from '@/physics-core';

/** Lever lab settings (SI units). First-class lever: fulcrum between load and effort. */
export type LeverLabParams = {
  loadMassKg: number;
  effortArmM: number;
  loadArmM: number;
  /** Friction coefficient in the pivot pin. */
  pivotFriction: number;
};

export const DEFAULT_LEVER_PARAMS: LeverLabParams = {
  loadMassKg: 10,
  effortArmM: 0.8,
  loadArmM: 0.2,
  pivotFriction: 0.2,
};

/** Fixed apparatus: pivot pin radius (m) and how far the beam is turned in a run (°). */
export const LEVER_PIN_RADIUS_M = 0.01;
export const LEVER_ROTATION_DEG = 20;
/** Steady turning speed (rad/s). */
export const LEVER_ANGULAR_SPEED = 0.12;

export function toLeverModel(p: LeverLabParams): LeverParams {
  return { ...p, pinRadiusM: LEVER_PIN_RADIUS_M, rotationDeg: LEVER_ROTATION_DEG };
}
