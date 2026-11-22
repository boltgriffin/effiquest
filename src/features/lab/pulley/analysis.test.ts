import { describe, expect, it } from 'vitest';
import { simulatePulleyLift } from '@/physics-core';
import type { SimTrial } from '@/types';
import { segmentTrend } from './analysis';
import { measurePulley } from './measurement';
import { DEFAULT_PULLEY_PARAMS, toModel, type PulleyLabParams } from './params';

function trial(params: PulleyLabParams, i: number): SimTrial {
  const m = measurePulley(params, simulatePulleyLift(toModel(params)));
  return {
    id: `t${i}`,
    ownerId: 'T',
    experimentId: 'pulley',
    machine: 'pulley',
    params: { ...params },
    readouts: m.readouts,
    engineVersion: 'test',
    seed: 0,
    valid: m.check.valid,
    recordedAt: `2026-11-25T08:0${i}:00Z`,
  };
}

describe('segmentTrend', () => {
  it('waits for two different segment counts', () => {
    expect(segmentTrend([])).toBeNull();
    expect(
      segmentTrend([trial(DEFAULT_PULLEY_PARAMS, 1), trial(DEFAULT_PULLEY_PARAMS, 2)]),
    ).toBeNull();
  });

  it('describes the MA-vs-efficiency trade-off from the learner’s own data', () => {
    const t = segmentTrend([
      trial({ ...DEFAULT_PULLEY_PARAMS, segments: 1 }, 1),
      trial({ ...DEFAULT_PULLEY_PARAMS, segments: 4 }, 2),
    ]);
    expect(t?.showsTradeOff).toBe(true);
    expect(t?.sentence).toMatch(/From 1 to 4 supporting segments, the effort fell/);
    expect(t?.sentence).toMatch(/efficiency fell/);
    expect(t?.sentence).not.toMatch(/fair test/);
  });

  it('flags comparisons where other settings changed too', () => {
    const t = segmentTrend([
      trial({ ...DEFAULT_PULLEY_PARAMS, segments: 1 }, 1),
      trial({ ...DEFAULT_PULLEY_PARAMS, segments: 3, loadMassKg: 30 }, 2),
    ]);
    expect(t?.sentence).toMatch(/not a fair test/);
  });
});
