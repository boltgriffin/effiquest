import { DEFAULT_BICYCLE, type BicycleParams } from '@/physics-core';

/** Bicycle lab settings. Gears are tooth counts; the hill is a percentage grade. */
export type BicycleLabParams = {
  massKg: number;
  slopePercent: number;
  chainringTeeth: number;
  sprocketTeeth: number;
  rollingCoeff: number;
  chainFriction: number;
};

export const DEFAULT_BICYCLE_PARAMS: BicycleLabParams = {
  massKg: DEFAULT_BICYCLE.massKg,
  slopePercent: DEFAULT_BICYCLE.slopePercent,
  chainringTeeth: DEFAULT_BICYCLE.chainringTeeth,
  sprocketTeeth: DEFAULT_BICYCLE.sprocketTeeth,
  rollingCoeff: DEFAULT_BICYCLE.rollingCoeff,
  chainFriction: DEFAULT_BICYCLE.chainFriction,
};

/** Fixed bicycle (shown in the model assumptions). */
export const BICYCLE_FIXED = {
  crankM: DEFAULT_BICYCLE.crankM,
  wheelRadiusM: DEFAULT_BICYCLE.wheelRadiusM,
  chainPitchM: DEFAULT_BICYCLE.chainPitchM,
  pinRadiusM: DEFAULT_BICYCLE.pinRadiusM,
  bearingFriction: DEFAULT_BICYCLE.bearingFriction,
  bearingRadiusM: DEFAULT_BICYCLE.bearingRadiusM,
  dragAreaM2: DEFAULT_BICYCLE.dragAreaM2,
  airDensity: DEFAULT_BICYCLE.airDensity,
  distanceM: DEFAULT_BICYCLE.distanceM,
} as const;

/** Steady riding speed up the hill (m/s). */
export const BICYCLE_SPEED_MPS = 2;

export function toBicycleModel(p: BicycleLabParams): BicycleParams {
  return { ...p, ...BICYCLE_FIXED };
}
