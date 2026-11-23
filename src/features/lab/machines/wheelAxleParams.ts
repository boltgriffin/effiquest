import type { WheelAxleParams } from '@/physics-core';

/** Wheel-and-axle lab settings (SI units). */
export type WheelAxleLabParams = {
  loadMassKg: number;
  wheelRadiusM: number;
  axleRadiusM: number;
  bearingFriction: number;
};

export const DEFAULT_WHEEL_AXLE_PARAMS: WheelAxleLabParams = {
  loadMassKg: 10,
  wheelRadiusM: 0.3,
  axleRadiusM: 0.05,
  bearingFriction: 0.15,
};

/** Fixed apparatus (shown in the model assumptions). */
export const WHEEL_AXLE_FIXED = {
  bearingRadiusM: 0.01,
  wheelMassKg: 2,
  liftM: 0.5,
} as const;

/** Steady load speed (m/s). */
export const WHEEL_LOAD_SPEED_MPS = 0.12;

export function toWheelAxleModel(p: WheelAxleLabParams): WheelAxleParams {
  return { ...p, ...WHEEL_AXLE_FIXED };
}
