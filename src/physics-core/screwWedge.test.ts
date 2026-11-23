import { describe, expect, it } from 'vitest';
import { checkLedger, imbalance } from './ledger';
import { DEFAULT_SCREW, simulateScrewLift, solveScrew, validateScrew } from './screw';
import { DEFAULT_WEDGE, simulateWedgePush, solveWedge, validateWedge } from './wedge';

describe('screw jack', () => {
  it('default set-up matches the hand calculation', () => {
    const s = solveScrew(DEFAULT_SCREW);
    // λ = atan(0.005 / (2π·0.012)) = 3.79°, φ = atan(0.15) = 8.53°
    expect(s.leadAngleDeg).toBeCloseTo(3.794, 2);
    expect(s.frictionAngleDeg).toBeCloseTo(8.531, 2);
    // τ = 4905 N × 0.012 m × tan(12.33°) = 12.86 N·m; F = τ ÷ 0.25 m = 51.4 N
    expect(s.torqueNm).toBeCloseTo(12.86, 1);
    expect(s.effortN).toBeCloseTo(51.44, 1);
    expect(s.idealMA).toBeCloseTo(314.16, 1);
    expect(s.efficiencyPercent).toBeCloseTo(30.35, 1);
    expect(s.selfLocking).toBe(true);
  });

  it('closes the energy ledger and agrees with the closed form', () => {
    const run = simulateScrewLift(DEFAULT_SCREW);
    expect(Math.abs(imbalance(run.ledger))).toBeLessThan(1e-9 * run.ledger.inputJ);
    const c = checkLedger(run.ledger);
    expect(c.valid && c.efficiencyPercent).toBeCloseTo(
      solveScrew(DEFAULT_SCREW).efficiencyPercent,
      1,
    );
    expect(run.totalOutputDistanceM).toBeCloseTo(DEFAULT_SCREW.liftM, 9);
    const last = run.samples.at(-1);
    expect(last?.inputDistanceM).toBeCloseTo((2 * Math.PI * 0.25 * 0.02) / 0.005, 6);
  });

  it('without friction it is ideal: η = 100 %, AMA = IMA = 2πR ÷ p', () => {
    const p = { ...DEFAULT_SCREW, threadFriction: 0 };
    const s = solveScrew(p);
    expect(s.efficiencyPercent).toBeCloseTo(100, 9);
    expect(s.actualMA).toBeCloseTo(s.idealMA, 6);
    expect(s.selfLocking).toBe(false);
  });

  it('a finer pitch needs less effort but is less efficient', () => {
    const coarse = solveScrew({ ...DEFAULT_SCREW, pitchM: 0.008 });
    const fine = solveScrew({ ...DEFAULT_SCREW, pitchM: 0.002 });
    expect(fine.effortN).toBeLessThan(coarse.effortN);
    expect(fine.efficiencyPercent).toBeLessThan(coarse.efficiencyPercent);
  });

  it('rejects impossible set-ups', () => {
    expect(validateScrew({ ...DEFAULT_SCREW, pitchM: 0 }).ok).toBe(false);
    expect(validateScrew({ ...DEFAULT_SCREW, threadFriction: -0.1 }).ok).toBe(false);
    expect(validateScrew(DEFAULT_SCREW).ok).toBe(true);
  });
});

describe('lifting wedge', () => {
  it('default set-up matches the hand calculation', () => {
    const s = solveWedge(DEFAULT_WEDGE);
    // P = 981 N × [tan(10° + 8.53°) + 0.15] = 476.0 N; IMA = 1 ÷ tan 10° = 5.67
    expect(s.effortN).toBeCloseTo(476.0, 0);
    expect(s.idealMA).toBeCloseTo(5.671, 2);
    expect(s.efficiencyPercent).toBeCloseTo(36.34, 1);
    expect(s.selfLocking).toBe(true); // 10° ≤ 2 × 8.53°
  });

  it('closes the energy ledger with both friction faces computed separately', () => {
    const run = simulateWedgePush(DEFAULT_WEDGE);
    expect(Math.abs(imbalance(run.ledger))).toBeLessThan(1e-9 * run.ledger.inputJ);
    expect(run.ledger.losses).toHaveLength(2);
    const c = checkLedger(run.ledger);
    expect(c.valid && c.efficiencyPercent).toBeCloseTo(
      solveWedge(DEFAULT_WEDGE).efficiencyPercent,
      1,
    );
    expect(run.totalOutputDistanceM).toBeCloseTo(0.2 * Math.tan((10 * Math.PI) / 180), 9);
  });

  it('without friction it is ideal: η = 100 %', () => {
    expect(solveWedge({ ...DEFAULT_WEDGE, friction: 0 }).efficiencyPercent).toBeCloseTo(100, 9);
  });

  it('a thinner wedge needs less push but wastes a larger share of the work', () => {
    const thin = solveWedge({ ...DEFAULT_WEDGE, wedgeAngleDeg: 5 });
    const thick = solveWedge({ ...DEFAULT_WEDGE, wedgeAngleDeg: 25 });
    expect(thin.effortN).toBeLessThan(thick.effortN);
    expect(thin.efficiencyPercent).toBeLessThan(thick.efficiencyPercent);
    expect(thick.selfLocking).toBe(false); // 25° > 2 × 8.53°: it would pop out
  });

  it('rejects impossible set-ups', () => {
    expect(validateWedge({ ...DEFAULT_WEDGE, wedgeAngleDeg: 0 }).ok).toBe(false);
    expect(validateWedge({ ...DEFAULT_WEDGE, wedgeAngleDeg: 55, friction: 2 }).ok).toBe(false);
    expect(validateWedge(DEFAULT_WEDGE).ok).toBe(true);
  });
});
