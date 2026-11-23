import { describe, expect, it } from 'vitest';
import {
  checkLedger,
  DEFAULT_LEVER,
  DEFAULT_PULLEY,
  DEFAULT_WHEEL_AXLE,
  G,
  imbalance,
  inclineMachineRun,
  inclineSteadyState,
  pulleyMachineRun,
  simulateLeverTurn,
  solveLever,
  solvePulley,
  solveWheelAxle,
  simulateWheelAxleLift,
  validateWheelAxle,
  type EnergyLedger,
  type MachineRun,
} from './index';

const eta = (l: EnergyLedger) => {
  const c = checkLedger(l);
  if (!c.valid) throw new Error(`invalid ledger: ${c.reason}`);
  return c.efficiencyPercent;
};

/** Properties every machine run must have. */
function checkRun(run: MachineRun) {
  expect(Math.abs(imbalance(run.ledger)) / run.ledger.inputJ).toBeLessThan(1e-9);
  expect(run.ledger.deltaKineticJ).toBeLessThan(1e-12);
  expect(run.ledger.losses.every((l) => l.joules >= -1e-12)).toBe(true);
  for (let i = 1; i < run.samples.length; i++) {
    const a = run.samples[i - 1];
    const b = run.samples[i];
    if (!a || !b) throw new Error('missing sample');
    expect(b.tS).toBeGreaterThan(a.tS);
    expect(b.inputWorkJ).toBeGreaterThanOrEqual(a.inputWorkJ - 1e-12);
    expect(b.outputDistanceM).toBeGreaterThanOrEqual(a.outputDistanceM - 1e-12);
  }
  const last = run.samples.at(-1);
  expect(last?.outputDistanceM).toBeCloseTo(run.totalOutputDistanceM, 12);
  expect(last?.inputWorkJ).toBeCloseTo(run.ledger.inputJ, 9);
}

describe('lever (time simulation)', () => {
  it('reference: ideal 100 N load, 0.8 m / 0.2 m arms → 25 N, IMA 4, η 100 %', () => {
    const run = simulateLeverTurn({ ...DEFAULT_LEVER, loadMassKg: 100 / G, pivotFriction: 0 });
    checkRun(run);
    expect(run.steadyInputForceN).toBeCloseTo(25, 9);
    expect(eta(run.ledger)).toBeCloseTo(100, 9);
  });

  it('steady effort and efficiency agree with the closed-form lever', () => {
    const run = simulateLeverTurn(DEFAULT_LEVER);
    checkRun(run);
    const exact = solveLever(DEFAULT_LEVER);
    expect(run.steadyInputForceN).toBeCloseTo(exact.effortN, 9);
    expect(eta(run.ledger)).toBeCloseTo(eta(exact.ledger), 6);
  });

  it('effort and load move along arcs in the ratio of the arms (IMA = L_e ÷ L_l)', () => {
    const run = simulateLeverTurn(DEFAULT_LEVER);
    const last = run.samples.at(-1);
    expect((last?.inputDistanceM ?? 0) / (last?.outputDistanceM ?? 1)).toBeCloseTo(4, 12);
  });

  it('a load arm longer than the effort arm gives MA below 1 but still loses energy', () => {
    const p = { ...DEFAULT_LEVER, effortArmM: 0.2, loadArmM: 0.6 };
    const run = simulateLeverTurn(p);
    checkRun(run);
    expect((p.loadMassKg * G) / run.steadyInputForceN).toBeLessThan(1);
    expect(eta(run.ledger)).toBeLessThan(100);
  });
});

describe('wheel and axle', () => {
  it('reference: frictionless, R = 0.30 m, r = 0.05 m → IMA 6, F = W ÷ 6, η 100 %', () => {
    const p = { ...DEFAULT_WHEEL_AXLE, bearingFriction: 0 };
    const s = solveWheelAxle(p);
    expect(s.idealMA).toBeCloseTo(6, 12);
    expect(s.effortN).toBeCloseTo((10 * G) / 6, 9);
    const run = simulateWheelAxleLift(p);
    checkRun(run);
    expect(eta(run.ledger)).toBeCloseTo(100, 9);
  });

  it('reference with bearing friction: hand calculation matches', () => {
    const p = DEFAULT_WHEEL_AXLE; // 10 kg, R 0.3, r 0.05, μb 0.15, rb 0.01, wheel 2 kg
    const muRb = 0.15 * 0.01;
    const hand = (10 * G * (0.05 + muRb) + muRb * 2 * G) / (0.3 - muRb);
    expect(solveWheelAxle(p).effortN).toBeCloseTo(hand, 12);
    const run = simulateWheelAxleLift(p);
    checkRun(run);
    expect(run.steadyInputForceN).toBeCloseTo(hand, 12);
    expect(eta(run.ledger)).toBeCloseTo(solveWheelAxle(p).efficiencyPercent, 6);
  });

  it('rope distances are in the ratio R ÷ r', () => {
    const run = simulateWheelAxleLift(DEFAULT_WHEEL_AXLE);
    const last = run.samples.at(-1);
    expect((last?.inputDistanceM ?? 0) / (last?.outputDistanceM ?? 1)).toBeCloseTo(6, 12);
  });

  it('the wheel’s spin only matters while speeding up or slowing down (τ = I α)', () => {
    const heavy = simulateWheelAxleLift({
      ...DEFAULT_WHEEL_AXLE,
      wheelMassKg: 8,
      bearingFriction: 0,
    });
    const light = simulateWheelAxleLift({
      ...DEFAULT_WHEEL_AXLE,
      wheelMassKg: 0,
      bearingFriction: 0,
    });
    // Same steady effort and the same efficiency once the run is over…
    expect(heavy.steadyInputForceN).toBeCloseTo(light.steadyInputForceN, 12);
    expect(eta(heavy.ledger)).toBeCloseTo(eta(light.ledger), 9);
    // …but a larger push to start the heavier wheel turning.
    expect(heavy.samples[1]?.inputForceN ?? 0).toBeGreaterThan(light.samples[1]?.inputForceN ?? 0);
  });

  it('a heavier wheel adds bearing friction even with the same load', () => {
    const heavy = solveWheelAxle({ ...DEFAULT_WHEEL_AXLE, wheelMassKg: 8 });
    const light = solveWheelAxle({ ...DEFAULT_WHEEL_AXLE, wheelMassKg: 0 });
    expect(heavy.efficiencyPercent).toBeLessThan(light.efficiencyPercent);
  });

  it('a larger wheel gives more mechanical advantage', () => {
    const small = solveWheelAxle({ ...DEFAULT_WHEEL_AXLE, wheelRadiusM: 0.15 });
    const large = solveWheelAxle({ ...DEFAULT_WHEEL_AXLE, wheelRadiusM: 0.45 });
    expect(large.actualMA).toBeGreaterThan(small.actualMA);
    expect(large.actualMA).toBeLessThan(large.idealMA);
  });

  it('rejects an axle as large as the wheel and other invalid set-ups', () => {
    expect(validateWheelAxle({ ...DEFAULT_WHEEL_AXLE, axleRadiusM: 0.3 }).ok).toBe(false);
    expect(validateWheelAxle({ ...DEFAULT_WHEEL_AXLE, loadMassKg: 0 }).ok).toBe(false);
    expect(validateWheelAxle({ ...DEFAULT_WHEEL_AXLE, bearingFriction: -1 }).ok).toBe(false);
  });
});

describe('shared run shape for the existing machines', () => {
  it('incline adapter keeps the plan test vector', () => {
    const p = { angleDeg: 30, friction: 0.2, massKg: 10, lengthM: 2 };
    const run = inclineMachineRun(p);
    checkRun(run);
    expect(run.steadyInputForceN).toBeCloseTo(inclineSteadyState(p).inputForceN, 9);
    expect(run.totalOutputDistanceM).toBeCloseTo(1, 2);
    expect(eta(run.ledger)).toBeCloseTo(74.27, 1);
    expect(run.samples.at(-1)?.inputForceN).toBeGreaterThan(0);
  });

  it('pulley adapter keeps the closed form', () => {
    const run = pulleyMachineRun(DEFAULT_PULLEY);
    checkRun(run);
    expect(run.steadyInputForceN).toBeCloseTo(solvePulley(DEFAULT_PULLEY).effortN, 9);
  });
});
