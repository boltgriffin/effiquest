import type { ScrewParams } from '@/physics-core';

/** Screw-jack lab settings (SI units, except the pitch in millimetres for readability). */
export type ScrewLabParams = {
  loadMassKg: number;
  handleRadiusM: number;
  pitchMm: number;
  threadFriction: number;
};

export const DEFAULT_SCREW_PARAMS: ScrewLabParams = {
  loadMassKg: 500,
  handleRadiusM: 0.25,
  pitchMm: 5,
  threadFriction: 0.15,
};

/** Fixed apparatus (shown in the model assumptions). */
export const SCREW_FIXED = { threadRadiusM: 0.012, liftM: 0.02 } as const;
/** Steady rise speed of the load (m/s). */
export const SCREW_SPEED_MPS = 0.004;

export function toScrewModel(p: ScrewLabParams): ScrewParams {
  return {
    loadMassKg: p.loadMassKg,
    handleRadiusM: p.handleRadiusM,
    pitchM: p.pitchMm / 1000,
    threadFriction: p.threadFriction,
    ...SCREW_FIXED,
  };
}
