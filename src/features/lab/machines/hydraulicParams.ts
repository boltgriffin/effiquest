import { areaFromDiameter, type HydraulicParams } from '@/physics-core';

/** Hydraulic press lab settings (SI units, except leakage in learner-friendly mL/s at 1 MPa). */
export type HydraulicLabParams = {
  loadMassKg: number;
  inputDiameterM: number;
  outputDiameterM: number;
  /** Friction force at each piston seal (N). */
  sealFrictionN: number;
  /** Leak flow at 1 MPa of pressure (mL/s); flow is proportional to pressure. */
  leakMlPerS: number;
};

export const DEFAULT_HYDRAULIC_PARAMS: HydraulicLabParams = {
  loadMassKg: 100,
  inputDiameterM: 0.02,
  outputDiameterM: 0.08,
  sealFrictionN: 5,
  leakMlPerS: 8,
};

/** Fixed apparatus: the load is raised 0.1 m at a steady 0.02 m/s. */
export const HYDRAULIC_LIFT_M = 0.1;
export const HYDRAULIC_SPEED_MPS = 0.02;

/** mL/s at 1 MPa → m³/(Pa·s). */
export const leakConductance = (mlPerS: number): number => (mlPerS * 1e-6) / 1e6;

export function toHydraulicModel(p: HydraulicLabParams): HydraulicParams {
  return {
    loadMassKg: p.loadMassKg,
    inputDiameterM: p.inputDiameterM,
    outputDiameterM: p.outputDiameterM,
    inputSealN: p.sealFrictionN,
    outputSealN: p.sealFrictionN,
    leakConductance: leakConductance(p.leakMlPerS),
    liftM: HYDRAULIC_LIFT_M,
  };
}

export const areaRatio = (p: HydraulicLabParams): number =>
  areaFromDiameter(p.outputDiameterM) / areaFromDiameter(p.inputDiameterM);
