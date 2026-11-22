import { describe, expect, it } from 'vitest';
import {
  checkLedger,
  DEFAULT_LEVER,
  DEFAULT_PULLEY,
  imbalance,
  inclineSteadyState,
  quantize,
  simulateInclinePull,
  solveLever,
  solvePulley,
  validateIncline,
  validateLever,
  validatePulley,
  type EnergyLedger,
} from './index';

const eff = (l: EnergyLedger) => {
  const c = checkLedger(l);
  if (!c.valid) throw new Error(`ledger invalid: ${c.reason}`);
  return c.efficiencyPercent;
};

describe('inclined plane (plan 3.1)', () => {
  const base = { angleDeg: 30, friction: 0.2, massKg: 10, lengthM: 2 };

  it('matches the plan test vector: m=10 kg, θ=30°, μ=0.20', () => {
    const s = inclineSteadyState(base);
    expect(s.inputForceN).toBeCloseTo(66.04, 2);
    expect(s.idealMA).toBeCloseTo(2, 10);
    expect(s.actualMA).toBeCloseTo(1.485, 3);
    expect(s.efficiencyPercent).toBeCloseTo(74.27, 2);
  });

  it('simulation conserves energy and agrees with the closed form', () => {
    const run = simulateInclinePull(base);
    expect(Math.abs(imbalance(run.ledger)) / run.ledger.inputJ).toBeLessThan(1e-9);
    expect(run.ledger.deltaKineticJ).toBeLessThan(1e-9);
    expect(run.distanceM).toBeCloseTo(2, 2);
    expect(eff(run.ledger)).toBeCloseTo(74.27, 1);
    expect(run.steadyForceN).toBeCloseTo(66.04, 2);
  });

  it('is exactly 100 % without friction, and efficiency falls as μ rises', () => {
    expect(eff(simulateInclinePull({ ...base, friction: 0 }).ledger)).toBeCloseTo(100, 6);
    let previous = Infinity;
    for (const friction of [0, 0.1, 0.2, 0.4, 0.8]) {
      const e = inclineSteadyState({ ...base, friction }).efficiencyPercent;
      expect(e).toBeLessThan(previous + 1e-9);
      previous = e;
    }
  });

  it('a gentler ramp has more mechanical advantage but lower efficiency (misconception G2)', () => {
    const gentle = inclineSteadyState({ ...base, angleDeg: 10 });
    const steep = inclineSteadyState({ ...base, angleDeg: 45 });
    expect(gentle.idealMA).toBeGreaterThan(steep.idealMA);
    expect(gentle.efficiencyPercent).toBeLessThan(steep.efficiencyPercent);
  });

  it('never has actual MA above ideal MA', () => {
    for (const angleDeg of [5, 20, 40, 60]) {
      for (const friction of [0, 0.3, 0.8]) {
        const s = inclineSteadyState({ ...base, angleDeg, friction });
        expect(s.actualMA).toBeLessThanOrEqual(s.idealMA + 1e-9);
      }
    }
  });

  it('rejects impossible set-ups instead of clamping', () => {
    expect(validateIncline({ ...base, angleDeg: 90 }).ok).toBe(false);
    expect(validateIncline({ ...base, massKg: 0 }).ok).toBe(false);
    expect(validateIncline({ ...base, friction: -0.1 }).ok).toBe(false);
  });
});

describe('lever (plan 3.2)', () => {
  it('ideal lever: 100 N at 0.8/0.2 m needs 25 N and is 100 % efficient', () => {
    const r = solveLever({ ...DEFAULT_LEVER, loadMassKg: 100 / 9.81, pivotFriction: 0 });
    expect(r.effortN).toBeCloseTo(25, 6);
    expect(r.idealMA).toBeCloseTo(4, 10);
    expect(eff(r.ledger)).toBeCloseTo(100, 6);
  });

  it('pivot friction lowers efficiency and the ledger balances exactly', () => {
    const r = solveLever(DEFAULT_LEVER);
    expect(Math.abs(imbalance(r.ledger))).toBeLessThan(1e-9);
    expect(eff(r.ledger)).toBeLessThan(100);
    expect(r.actualMA).toBeLessThan(r.idealMA);
    // η = AMA / IMA for the same quasi-static motion.
    expect(eff(r.ledger)).toBeCloseTo((r.actualMA / r.idealMA) * 100, 9);
  });

  it('rejects a pivot that cannot turn', () => {
    expect(validateLever({ ...DEFAULT_LEVER, pivotFriction: 100, pinRadiusM: 0.01 }).ok).toBe(
      false,
    );
  });
});

describe('pulley (plan 3.3)', () => {
  it('matches the plan test vector: n=4, W=200 N, W_block=10 N, frictionless → 52.5 N, 95.2 %', () => {
    const r = solvePulley({
      ...DEFAULT_PULLEY,
      loadMassKg: 200 / 9.81,
      blockMassKg: 10 / 9.81,
      bearingFriction: 0,
    });
    expect(r.effortN).toBeCloseTo(52.5, 6);
    expect(r.ropePulledM).toBe(4);
    expect(eff(r.ledger)).toBeCloseTo(95.24, 2);
  });

  it('single fixed pulley without friction: effort equals load, IMA 1, 100 %', () => {
    const r = solvePulley({ ...DEFAULT_PULLEY, segments: 1, bearingFriction: 0 });
    expect(r.effortN).toBeCloseTo(r.loadN, 9);
    expect(r.idealMA).toBe(1);
    expect(eff(r.ledger)).toBeCloseTo(100, 9);
  });

  it('more segments: more mechanical advantage but lower efficiency (misconception G2)', () => {
    const results = [1, 2, 3, 4, 5, 6].map((segments) =>
      solvePulley({ ...DEFAULT_PULLEY, segments }),
    );
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const cur = results[i];
      if (!prev || !cur) throw new Error('missing result');
      expect(cur.actualMA).toBeGreaterThan(prev.actualMA);
      expect(eff(cur.ledger)).toBeLessThan(eff(prev.ledger));
    }
  });

  it('tensions support the load, ledger losses are non-negative and balance', () => {
    const r = solvePulley(DEFAULT_PULLEY);
    const support = r.tensionsN.reduce((a, b) => a + b, 0);
    expect(support).toBeCloseTo(r.loadN + r.blockN, 9);
    expect(r.ledger.losses.every((l) => l.joules >= 0)).toBe(true);
    expect(Math.abs(imbalance(r.ledger))).toBeLessThan(1e-9);
  });

  it('rejects invalid segment counts', () => {
    expect(validatePulley({ ...DEFAULT_PULLEY, segments: 0 }).ok).toBe(false);
    expect(validatePulley({ ...DEFAULT_PULLEY, segments: 2.5 }).ok).toBe(false);
  });
});

describe('ledger check', () => {
  it('reports more-than-100 % as invalid, never clamps', () => {
    expect(
      checkLedger({
        inputJ: 10,
        usefulJ: 12,
        losses: [{ kind: 'friction', label: '', joules: -2 }],
        deltaKineticJ: 0,
      }),
    ).toMatchObject({ valid: false });
  });

  it('reports a ledger that does not balance', () => {
    expect(checkLedger({ inputJ: 10, usefulJ: 5, losses: [], deltaKineticJ: 0 })).toEqual({
      valid: false,
      reason: 'energy-not-conserved',
    });
  });
});

describe('quantize', () => {
  it('rounds to the instrument resolution', () => {
    expect(quantize(66.0415, 0.1)).toBe(66);
    expect(quantize(1.0049, 0.01)).toBe(1);
    expect(quantize(-0.01, 0.1)).toBe(0);
  });
});
