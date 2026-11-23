import { clampForceAsMassKg, DEFAULT_BRAKE, type BrakeParams } from '@/physics-core';

/** Hydraulic brake lab settings (forces in N, piston diameters in mm for readability). */
export type BrakeLabParams = {
  clampForceN: number;
  pedalRatio: number;
  masterDiameterMm: number;
  caliperDiameterMm: number;
  sealFrictionN: number;
  padFriction: number;
};

export const DEFAULT_BRAKE_PARAMS: BrakeLabParams = {
  clampForceN: DEFAULT_BRAKE.clampForceN,
  pedalRatio: DEFAULT_BRAKE.pedalRatio,
  masterDiameterMm: DEFAULT_BRAKE.masterDiameterM * 1000,
  caliperDiameterMm: DEFAULT_BRAKE.caliperDiameterM * 1000,
  sealFrictionN: DEFAULT_BRAKE.sealFrictionN,
  padFriction: DEFAULT_BRAKE.padFriction,
};

/** Fixed parts (shown in the model assumptions). */
export const BRAKE_FIXED = {
  pivotFriction: DEFAULT_BRAKE.pivotFriction,
  pedalArmM: DEFAULT_BRAKE.pedalArmM,
  pivotPinRadiusM: DEFAULT_BRAKE.pivotPinRadiusM,
  padTravelM: DEFAULT_BRAKE.padTravelM,
  discRadiusM: DEFAULT_BRAKE.discRadiusM,
  wheelRadiusM: DEFAULT_BRAKE.wheelRadiusM,
} as const;

export function toBrakeModel(p: BrakeLabParams): BrakeParams {
  return {
    clampForceN: p.clampForceN,
    pedalRatio: p.pedalRatio,
    masterDiameterM: p.masterDiameterMm / 1000,
    caliperDiameterM: p.caliperDiameterMm / 1000,
    sealFrictionN: p.sealFrictionN,
    padFriction: p.padFriction,
    ...BRAKE_FIXED,
  };
}

/** The lab template treats the output force as a weight: the clamp force expressed in kg. */
export const brakeLoadMassKg = (p: BrakeLabParams): number => clampForceAsMassKg(p.clampForceN);
