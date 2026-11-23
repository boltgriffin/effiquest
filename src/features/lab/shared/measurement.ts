import {
  actualMechanicalAdvantage,
  efficiency,
  velocityRatio,
  weight,
  type CalcResult,
} from '@/edu-calc';
import { checkLedger, quantize, type LedgerCheck, type MachineRun } from '@/physics-core';
import type { SimReadouts } from '@/types';

export const SCALE_RESOLUTION_N = 0.1;

/** What the instruments show at one moment of a run (live readouts). */
export interface LiveReading {
  inputForceN: number;
  inputDistanceM: number;
  outputDistanceM: number;
  inputWorkJ: number;
  usefulWorkJ: number;
  /** 0..1 progress of the run (by load rise). */
  fraction: number;
}

/** Interpolated reading at time t (s); instruments are read at their resolution. */
export function readingAt(run: MachineRun, tS: number, rulerResolutionM: number): LiveReading {
  const s = run.samples;
  const first = s[0];
  const last = s[s.length - 1];
  if (!first || !last) throw new Error('empty run');
  let a = first;
  let b = last;
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
  const out = lerp(a.outputDistanceM, b.outputDistanceM);
  return {
    // A spring scale shows the force at that moment; use the nearer sample, not a blend.
    inputForceN: quantize(f < 0.5 ? a.inputForceN : b.inputForceN, SCALE_RESOLUTION_N),
    inputDistanceM: quantize(lerp(a.inputDistanceM, b.inputDistanceM), rulerResolutionM),
    outputDistanceM: quantize(out, rulerResolutionM),
    inputWorkJ: lerp(a.inputWorkJ, b.inputWorkJ),
    usefulWorkJ: lerp(a.usefulWorkJ, b.usefulWorkJ),
    fraction:
      run.totalOutputDistanceM > 0 ? Math.min(1, Math.max(0, out / run.totalOutputDistanceM)) : 0,
  };
}

/** Final results of a completed run, computed by the calculation engine from the model. */
export interface Measurement<P> {
  params: P;
  loadWeightN: number;
  /** Spring-scale reading during the steady part of the run (N). */
  inputForceN: number;
  /** Force on the load while it rises at steady speed = its weight (N). */
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
  readouts: SimReadouts;
}

export function measureRun<P>(
  params: P,
  run: MachineRun,
  loadMassKg: number,
  rulerResolutionM: number,
): Measurement<P> {
  const last = run.samples[run.samples.length - 1];
  if (!last) throw new Error('empty run');
  const load = weight({ massKg: loadMassKg });
  const loadWeightN = quantize(load.ok ? load.value : Number.NaN, SCALE_RESOLUTION_N);
  const inputForceN = quantize(run.steadyInputForceN, SCALE_RESOLUTION_N);
  const check = checkLedger(run.ledger);
  const ama = actualMechanicalAdvantage(
    { outputForceN: loadWeightN, inputForceN },
    { basis: 'simulated' },
  );
  // VR is geometric, so use the exact distances: rounding a short distance (e.g. a 7 cm lever
  // arc) to the ruler would make the ideal value misleading.
  // When losses change the effort's travel (hydraulic leakage), the machine supplies the
  // loss-free distance so the ideal value stays geometric.
  const vr = velocityRatio({
    inputDistanceM: run.idealInputDistanceM ?? last.inputDistanceM,
    outputDistanceM: last.outputDistanceM,
  });
  const eta = efficiency(
    { usefulWorkJ: run.ledger.usefulJ, inputWorkJ: run.ledger.inputJ },
    { basis: 'simulated' },
  );
  return {
    params,
    loadWeightN,
    inputForceN,
    outputForceN: loadWeightN,
    inputDistanceM: quantize(last.inputDistanceM, rulerResolutionM),
    outputDistanceM: quantize(last.outputDistanceM, rulerResolutionM),
    inputWorkJ: run.ledger.inputJ,
    outputWorkJ: run.ledger.usefulJ,
    losses: run.ledger.losses.map((l) => ({ label: l.label, joules: l.joules })),
    check,
    ama,
    vr,
    eta,
    readouts: {
      inputForceN,
      outputForceN: loadWeightN,
      inputDistanceM: last.inputDistanceM,
      outputDistanceM: last.outputDistanceM,
      inputWorkJ: run.ledger.inputJ,
      outputWorkJ: run.ledger.usefulJ,
      actualMA: ama.ok ? ama.value : Number.NaN,
      idealMA: vr.ok ? vr.value : Number.NaN,
      efficiencyPercent: check.valid && eta.ok ? eta.value : Number.NaN,
    },
  };
}

export function sameParams(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if (a[k] !== b[k]) return false;
  return true;
}
