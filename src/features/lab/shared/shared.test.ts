import { describe, expect, it } from 'vitest';
import { simulateLeverTurn } from '@/physics-core';
import type { SimReadouts, SimTrial } from '@/types';
import { leverLab } from '../machines/lever';
import { hydraulicLab } from '../machines/hydraulic';
import { bicycleLab } from '../machines/bicycle';
import { brakeLab } from '../machines/brake';
import { screwLab } from '../machines/screw';
import { wedgeLab } from '../machines/wedge';
import { inclineLab } from '../machines/incline';
import { pulleyLab } from '../machines/pulley';
import { wheelAxleLab } from '../machines/wheelAxle';
import { toLeverModel } from '../machines/leverParams';
import { compareTrials } from './analysis';
import { compareMachines } from './compare';
import { knowledgeScore } from './knowledge';
import { measureRun, readingAt, sameParams } from './measurement';

const readouts = (o: Partial<SimReadouts>): SimReadouts => ({
  inputForceN: 10,
  outputForceN: 20,
  inputDistanceM: 2,
  outputDistanceM: 1,
  inputWorkJ: 20,
  outputWorkJ: 18,
  actualMA: 2,
  idealMA: 2.2,
  efficiencyPercent: 90,
  ...o,
});
const trial = (
  labId: string,
  params: Record<string, number>,
  r: Partial<SimReadouts>,
  i = 0,
): SimTrial => ({
  id: `${labId}-${i}`,
  ownerId: 'T',
  experimentId: labId,
  machine: 'lever',
  params,
  readouts: readouts(r),
  engineVersion: 't',
  seed: 0,
  valid: true,
  recordedAt: `2026-11-25T08:0${i}:00Z`,
});

describe('every machine definition runs end-to-end with its defaults', () => {
  it.each([
    ['incline', inclineLab],
    ['pulley', pulleyLab],
    ['lever', leverLab],
    ['wheel and axle', wheelAxleLab],
    ['hydraulic press', hydraulicLab],
    ['screw jack', screwLab],
    ['wedge', wedgeLab],
    ['bicycle', bicycleLab],
    ['hydraulic brake', brakeLab],
  ] as const)('%s', (_, def) => {
    const p = def.defaults as Record<string, number>;
    // @ts-expect-error -- each definition has its own parameter type; defaults always fit it.
    expect(def.validate(p).ok).toBe(true);
    // @ts-expect-error -- as above.
    const run = def.simulate(p);
    // @ts-expect-error -- as above.
    const m = measureRun(p, run, def.loadMassKg(p), def.rulerResolutionM);
    expect(m.check.valid).toBe(true);
    expect(m.ama.ok && m.vr.ok && m.eta.ok).toBe(true);
    if (m.ama.ok && m.vr.ok && m.eta.ok) {
      expect(m.ama.value).toBeLessThanOrEqual(m.vr.value + 0.05);
      expect(m.eta.value).toBeGreaterThan(0);
      expect(m.eta.value).toBeLessThan(100);
      // η = F_out·d_out ÷ (F_in·d_in) = AMA × d_out ÷ d_in, using the REAL distances (with
      // hydraulic leakage the effort travels further than the ideal ratio), within the scale's
      // 0.1 N resolution.
      const last = run.samples.at(-1);
      const amaTimesRatio =
        m.ama.value * ((last?.outputDistanceM ?? 0) / (last?.inputDistanceM ?? 1)) * 100;
      expect(Math.abs(amaTimesRatio - m.eta.value)).toBeLessThan(0.6);
    }
    expect(def.guide.knowledge.length).toBeGreaterThanOrEqual(3);
    for (const k of def.guide.knowledge)
      expect(k.options.some((o) => o.id === k.correctId)).toBe(true);
    expect(def.trialColumns.some((c) => c.key === def.trend.key)).toBe(true);
  });
});

describe('measurement', () => {
  it('lever: VR uses exact arcs, so a 7 cm arc does not distort the ideal value', () => {
    const p = { loadMassKg: 10, effortArmM: 0.8, loadArmM: 0.15, pivotFriction: 0.2 };
    const m = measureRun(p, simulateLeverTurn(toLeverModel(p)), 10, 0.001);
    expect(m.vr.ok && m.vr.value).toBeCloseTo(0.8 / 0.15, 9);
  });

  it('hydraulic: IMA stays the geometric area ratio even though leakage lengthens the stroke', () => {
    const p = hydraulicLab.defaults;
    const run = hydraulicLab.simulate(p);
    const m = measureRun(p, run, p.loadMassKg, hydraulicLab.rulerResolutionM);
    expect(m.vr.ok && m.vr.value).toBeCloseTo(16, 9); // (0.08 / 0.02)²
    const last = run.samples.at(-1);
    expect((last?.inputDistanceM ?? 0) / (last?.outputDistanceM ?? 1)).toBeGreaterThan(16);
    expect(m.inputForceN).toBe(66.6); // hand check: (981 + 5) N ÷ A₂ × A₁ + 5 N = 66.62 N
  });

  it('live reading at t = 0 and at the end', () => {
    const p = leverLab.defaults;
    const run = simulateLeverTurn(toLeverModel(p));
    expect(readingAt(run, 0, 0.001)).toMatchObject({
      fraction: 0,
      inputWorkJ: 0,
      outputDistanceM: 0,
    });
    expect(readingAt(run, run.durationS, 0.001).fraction).toBeCloseTo(1, 6);
  });

  it('compares parameter sets', () => {
    expect(sameParams({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(sameParams({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});

describe('compareTrials (one machine, one variable)', () => {
  const v = { key: 'effortArmM', label: 'effort arm', unit: 'm' };
  it('needs two different values', () => {
    expect(compareTrials([trial('lever', { effortArmM: 0.4 }, {})], v)).toBeNull();
  });
  it('describes the data and flags a non-fair test', () => {
    const t = compareTrials(
      [
        trial(
          'lever',
          { effortArmM: 0.4, loadArmM: 0.2 },
          { inputForceN: 50, actualMA: 1.9, efficiencyPercent: 97 },
          1,
        ),
        trial(
          'lever',
          { effortArmM: 0.8, loadArmM: 0.3 },
          { inputForceN: 30, actualMA: 2.6, efficiencyPercent: 98 },
          2,
        ),
      ],
      v,
    );
    expect(t?.sentence).toMatch(/effort arm went from 0.40 m to 0.80 m, the effort fell/);
    expect(t?.fairTest).toBe(false);
    expect(t?.sentence).toMatch(/not a fair test/);
    expect(t?.showsTradeOff).toBe(false);
  });
});

describe('compareMachines (across machines)', () => {
  const machines = [
    { labId: 'lever', title: 'Lever' },
    { labId: 'pulley', title: 'Pulley system' },
    { labId: 'incline', title: 'Inclined plane' },
  ];
  it('waits for two machines', () => {
    expect(compareMachines(machines, { lever: [trial('lever', {}, {})] }).sentence).toBeNull();
  });
  it('separates the most advantage from the most efficient', () => {
    const c = compareMachines(machines, {
      lever: [trial('lever', {}, { actualMA: 3.9, efficiencyPercent: 98.8 })],
      pulley: [trial('pulley', {}, { actualMA: 3.3, efficiencyPercent: 82.9 })],
      incline: [trial('incline', {}, { actualMA: 1.5, efficiencyPercent: 74.3 })],
    });
    expect(c.mostAdvantage?.labId).toBe('lever');
    expect(c.mostEfficient?.labId).toBe('lever');
    expect(c.sentence).toMatch(/do not have to go together/);
    const d = compareMachines(machines, {
      lever: [trial('lever', {}, { actualMA: 1.2, efficiencyPercent: 98 })],
      pulley: [trial('pulley', {}, { actualMA: 3.3, efficiencyPercent: 82.9 })],
    });
    expect(d.sentence).toMatch(
      /pulley system had the largest mechanical advantage.*but the lever was the most efficient/,
    );
    expect(d.rows.find((r) => r.labId === 'incline')?.trial).toBeNull();
  });
});

describe('knowledge check scoring', () => {
  it('counts correct and answered items', () => {
    const items = leverLab.guide.knowledge;
    expect(knowledgeScore(items, {})).toEqual({ correct: 0, answered: 0, total: 3 });
    expect(knowledgeScore(items, { k1: 'b', k2: 'a' })).toEqual({
      correct: 1,
      answered: 2,
      total: 3,
    });
  });
});
