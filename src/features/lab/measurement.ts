import {
  checkLedger,
  G,
  quantize,
  type EnergyLedger,
  type LedgerCheck,
  type PullResult,
} from '@/physics-core';
import type { SimReadouts } from '@/types';
import { RULER_RESOLUTION_M, SCALE_RESOLUTION_N, type InclineParams } from './params';

/** What the learner reads after one run of the inclined-plane experiment. */
export interface InclineMeasurement {
  params: InclineParams;
  /** Spring-scale reading while pulling at steady speed (N, 0.1 N resolution). */
  scaleN: number;
  /** Weight of the load (N, 0.1 N resolution). */
  loadN: number;
  /** Distance pulled along the ramp (m, ruler resolution). */
  effortDistanceM: number;
  /** Height the load rose (m, ruler resolution). */
  heightM: number;
  ledger: EnergyLedger;
  check: LedgerCheck;
  readouts: SimReadouts;
}

export function measureIncline(params: InclineParams, run: PullResult): InclineMeasurement {
  const scaleN = quantize(run.steadyForceN, SCALE_RESOLUTION_N);
  const loadN = quantize(params.massKg * G, SCALE_RESOLUTION_N);
  const effortDistanceM = quantize(run.distanceM, RULER_RESOLUTION_M);
  const heightM = quantize(run.heightGainM, RULER_RESOLUTION_M);
  const check = checkLedger(run.ledger);
  return {
    params,
    scaleN,
    loadN,
    effortDistanceM,
    heightM,
    ledger: run.ledger,
    check,
    readouts: {
      inputForceN: scaleN,
      outputForceN: loadN,
      inputDistanceM: effortDistanceM,
      outputDistanceM: heightM,
      inputWorkJ: run.ledger.inputJ,
      outputWorkJ: run.ledger.usefulJ,
      actualMA: loadN / scaleN,
      idealMA: effortDistanceM / heightM,
      efficiencyPercent: check.valid ? check.efficiencyPercent : Number.NaN,
    },
  };
}

export function sameParams(a: InclineParams, b: InclineParams): boolean {
  return a.angleDeg === b.angleDeg && a.friction === b.friction && a.massKg === b.massKg;
}
