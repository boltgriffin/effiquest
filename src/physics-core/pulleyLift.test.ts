import { describe, expect, it } from 'vitest';
import {
  checkLedger,
  DEFAULT_PULLEY,
  G,
  imbalance,
  simulatePulleyLift,
  solvePulley,
  type PulleyParams,
} from './index';

const base: PulleyParams = { ...DEFAULT_PULLEY, liftM: 1 };

describe('simulatePulleyLift', () => {
  it.each([1, 2, 3, 4])('n = %i: steady effort equals the closed-form solution', (segments) => {
    const p = { ...base, segments };
    const run = simulatePulleyLift(p);
    expect(run.steadyEffortN).toBeCloseTo(solvePulley(p).effortN, 9);
  });

  it.each([1, 2, 3, 4])('n = %i: energy is conserved to rounding error', (segments) => {
    const run = simulatePulleyLift({ ...base, segments });
    expect(Math.abs(imbalance(run.ledger)) / run.ledger.inputJ).toBeLessThan(1e-9);
    expect(run.ledger.deltaKineticJ).toBeLessThan(1e-12);
  });

  it.each([1, 2, 3, 4])('n = %i: efficiency agrees with the closed form', (segments) => {
    const p = { ...base, segments };
    const sim = checkLedger(simulatePulleyLift(p).ledger);
    const exact = checkLedger(solvePulley(p).ledger);
    if (!sim.valid || !exact.valid) throw new Error('invalid ledger');
    expect(sim.efficiencyPercent).toBeCloseTo(exact.efficiencyPercent, 6);
  });

  it('the rope is pulled n times as far as the load rises (velocity ratio)', () => {
    const run = simulatePulleyLift({ ...base, segments: 3 });
    const last = run.samples[run.samples.length - 1];
    expect(last?.loadRiseM).toBeCloseTo(1, 2);
    expect(last?.ropePulledM).toBeCloseTo(3 * (last?.loadRiseM ?? 0), 12);
    for (const s of run.samples) expect(s.ropePulledM).toBeCloseTo(3 * s.loadRiseM, 12);
  });

  it('plan test vector: n = 4, W = 200 N, block 10 N, no friction → 52.5 N and 95.2 %', () => {
    const run = simulatePulleyLift({
      ...base,
      segments: 4,
      loadMassKg: 200 / G,
      blockMassKg: 10 / G,
      bearingFriction: 0,
    });
    expect(run.steadyEffortN).toBeCloseTo(52.5, 9);
    const c = checkLedger(run.ledger);
    expect(c.valid && c.efficiencyPercent).toBeCloseTo(95.238, 2);
  });

  it('frictionless single fixed pulley is 100 % efficient; friction losses are never negative', () => {
    const ideal = checkLedger(
      simulatePulleyLift({ ...base, segments: 1, bearingFriction: 0 }).ledger,
    );
    expect(ideal.valid && ideal.efficiencyPercent).toBeCloseTo(100, 9);
    const run = simulatePulleyLift({ ...base, segments: 4, bearingFriction: 0.3 });
    expect(run.ledger.losses.every((l) => l.joules >= 0)).toBe(true);
  });

  it('samples are time-ordered and cumulative work never decreases', () => {
    const { samples } = simulatePulleyLift(base);
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1];
      const b = samples[i];
      if (!a || !b) throw new Error('missing sample');
      expect(b.tS).toBeGreaterThan(a.tS);
      expect(b.inputWorkJ).toBeGreaterThanOrEqual(a.inputWorkJ);
      expect(b.usefulWorkJ).toBeGreaterThanOrEqual(a.usefulWorkJ);
    }
  });
});
