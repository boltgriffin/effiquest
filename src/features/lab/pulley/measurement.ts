import {
  actualMechanicalAdvantage,
  efficiency,
  velocityRatio,
  weight,
  type CalcResult,
} from '@/edu-calc';
import {
  checkLedger,
  quantize,
  type LedgerCheck,
  type LiftResult,
  type LiftSample,
} from '@/physics-core';
import type { SimReadouts } from '@/types';
import { type PulleyLabParams } from './params';

export const SCALE_RESOLUTION_N = 0.1;
export const RULER_RESOLUTION_M = 0.01;

/** What the instruments show at one moment of a run (live readouts). */
export interface LiveReading {
  effortN: number;
  ropePulledM: number;
  loadRiseM: number;
  inputWorkJ: number;
  usefulWorkJ: number;
  /** 0..1 progress of the lift. */
  fraction: number;
}

/** Linear interpolation between ~60 Hz samples. */
export function readingAt(run: LiftResult, liftM: number, tS: number): LiveReading {
  const s = run.samples;
  const first = s[0];
  const last = s[s.length - 1];
  if (!first || !last) throw new Error('empty run');
  let a: LiftSample = first;
  let b: LiftSample = last;
  if (tS <= first.tS) b = first;
  else if (tS >= last.tS) a = last;
  else {
    let i = 1;
    while (i < s.length && (s[i]?.tS ?? 0) < tS) i++;
    a = s[i - 1] ?? first;
    b = s[i] ?? last;
  }
  const f = b.tS === a.tS ? 1 : (tS - a.tS) / (b.tS - a.tS);
  const lerp = (x: number, y: number) => x + f * (y - x);
  const loadRiseM = lerp(a.loadRiseM, b.loadRiseM);
  return {
    // A spring scale shows the force at that moment; use the nearer sample, not a blend.
    effortN: quantize(f < 0.5 ? a.effortN : b.effortN, SCALE_RESOLUTION_N),
    ropePulledM: quantize(lerp(a.ropePulledM, b.ropePulledM), RULER_RESOLUTION_M),
    loadRiseM: quantize(loadRiseM, RULER_RESOLUTION_M),
    inputWorkJ: lerp(a.inputWorkJ, b.inputWorkJ),
    usefulWorkJ: lerp(a.usefulWorkJ, b.usefulWorkJ),
    fraction: Math.min(1, Math.max(0, loadRiseM / liftM)),
  };
}

/** Final results of a completed lift, computed by the calculation engine from the model. */
export interface PulleyMeasurement {
  params: PulleyLabParams;
  /** Load weight W = m g (N). */
  loadWeightN: number;
  /** Spring-scale reading during the steady part of the pull (N). */
  inputForceN: number;
  /** Force the machine exerts on the load while lifting at steady speed = load weight (N). */
  outputForceN: number;
  inputDistanceM: number;
  outputDistanceM: number;
  inputWorkJ: number;
  outputWorkJ: number;
  losses: { label: string; joules: number }[];
  check: LedgerCheck;
  ama: CalcResult;
  vr: CalcResult;
  eta: CalcResult;
  load: CalcResult;
  readouts: SimReadouts;
}

export function measurePulley(params: PulleyLabParams, run: LiftResult): PulleyMeasurement {
  const last = run.samples[run.samples.length - 1];
  if (!last) throw new Error('empty run');
  const load = weight({ massKg: params.loadMassKg });
  const loadWeightN = quantize(load.ok ? load.value : Number.NaN, SCALE_RESOLUTION_N);
  const inputForceN = quantize(run.steadyEffortN, SCALE_RESOLUTION_N);
  const inputDistanceM = quantize(last.ropePulledM, RULER_RESOLUTION_M);
  const outputDistanceM = quantize(last.loadRiseM, RULER_RESOLUTION_M);
  const check = checkLedger(run.ledger);
  const ama = actualMechanicalAdvantage(
    { outputForceN: loadWeightN, inputForceN },
    { basis: 'simulated' },
  );
  const vr = velocityRatio({ inputDistanceM, outputDistanceM });
  const eta = efficiency(
    { usefulWorkJ: run.ledger.usefulJ, inputWorkJ: run.ledger.inputJ },
    { basis: 'simulated' },
  );
  return {
    params,
    loadWeightN,
    inputForceN,
    outputForceN: loadWeightN,
    inputDistanceM,
    outputDistanceM,
    inputWorkJ: run.ledger.inputJ,
    outputWorkJ: run.ledger.usefulJ,
    losses: run.ledger.losses.map((l) => ({ label: l.label, joules: l.joules })),
    check,
    ama,
    vr,
    eta,
    load,
    readouts: {
      inputForceN,
      outputForceN: loadWeightN,
      inputDistanceM,
      outputDistanceM,
      inputWorkJ: run.ledger.inputJ,
      outputWorkJ: run.ledger.usefulJ,
      actualMA: ama.ok ? ama.value : Number.NaN,
      idealMA: vr.ok ? vr.value : Number.NaN,
      efficiencyPercent: check.valid && eta.ok ? eta.value : Number.NaN,
    },
  };
}
