import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BICYCLE,
  simulateBicycleClimb,
  solveBicycle,
  sprocketRadius,
  validateBicycle,
} from './bicycle';
import { DEFAULT_BRAKE, simulateBrakeApply, solveBrake, validateBrake } from './brake';
import { checkLedger, imbalance } from './ledger';

describe('bicycle climbing a hill', () => {
  const run = simulateBicycleClimb(DEFAULT_BICYCLE);

  it('closes the energy ledger with every loss computed on its own', () => {
    expect(Math.abs(imbalance(run.ledger))).toBeLessThan(1e-9 * run.ledger.inputJ);
    expect(run.ledger.losses.map((l) => l.label)).toHaveLength(4);
    expect(checkLedger(run.ledger).valid).toBe(true);
  });

  it('IMA = gears × hill, from the geometry', () => {
    const r1 = sprocketRadius(34, 0.0127);
    const r2 = sprocketRadius(28, 0.0127);
    const sinA = Math.sin(Math.atan(0.06));
    const s = solveBicycle(DEFAULT_BICYCLE);
    expect(s.idealMA).toBeCloseTo((0.17 * r2) / (0.34 * r1) / sinA, 9);
    const last = run.samples.at(-1);
    expect((last?.inputDistanceM ?? 0) / (last?.outputDistanceM ?? 1)).toBeCloseTo(s.idealMA, 6);
  });

  it('steady effort matches a hand calculation (forces at 2 m/s)', () => {
    // Resisting force: 784.8 sin α + 0.006 × 784.8 cos α + ½ × 1.2 × 0.5 × 2² = 52.89 N
    const mg = 80 * 9.81;
    const a = Math.atan(0.06);
    const resist = mg * Math.sin(a) + 0.006 * mg * Math.cos(a) + 0.5 * 1.2 * 0.5 * 4;
    expect(resist).toBeCloseTo(52.89, 1);
    const s = solveBicycle(DEFAULT_BICYCLE);
    // Without drivetrain losses F = resist × R_w × (r₁/r₂) ÷ R_c; the losses add about 1 %.
    const ideal =
      (resist * 0.34 * (sprocketRadius(34, 0.0127) / sprocketRadius(28, 0.0127))) / 0.17;
    expect(s.effortN / ideal).toBeGreaterThan(1.001);
    expect(s.effortN / ideal).toBeLessThan(1.03);
  });

  it('with no losses at all it is ideal: η = 100 %', () => {
    const p = {
      ...DEFAULT_BICYCLE,
      rollingCoeff: 0,
      chainFriction: 0,
      bearingFriction: 0,
      dragAreaM2: 0,
    };
    const s = solveBicycle(p);
    expect(s.efficiencyPercent).toBeCloseTo(100, 6);
    expect(s.actualMA).toBeCloseTo(s.idealMA, 4);
  });

  it('drivetrain efficiency counts only chain and bearings (D-13)', () => {
    const s = solveBicycle(DEFAULT_BICYCLE);
    expect(s.drivetrainEfficiencyPercent).toBeGreaterThan(97);
    expect(s.drivetrainEfficiencyPercent).toBeLessThan(100);
    const clean = solveBicycle({ ...DEFAULT_BICYCLE, chainFriction: 0, bearingFriction: 0 });
    expect(clean.drivetrainEfficiencyPercent).toBeCloseTo(100, 6);
    // Overall efficiency is lower: rolling resistance and air also take work.
    expect(s.efficiencyPercent).toBeLessThan(s.drivetrainEfficiencyPercent);
  });

  it('a lower gear (bigger sprocket) makes pedalling easier without changing the work much', () => {
    const low = solveBicycle({ ...DEFAULT_BICYCLE, sprocketTeeth: 32 });
    const high = solveBicycle({ ...DEFAULT_BICYCLE, sprocketTeeth: 14 });
    expect(low.effortN).toBeLessThan(high.effortN);
    expect(Math.abs(low.efficiencyPercent - high.efficiencyPercent)).toBeLessThan(2);
  });

  it('a steeper hill needs more work and power; a larger share of it lifts the rider', () => {
    const gentle = solveBicycle({ ...DEFAULT_BICYCLE, slopePercent: 3 });
    const steep = solveBicycle({ ...DEFAULT_BICYCLE, slopePercent: 12 });
    expect(steep.powerW).toBeGreaterThan(gentle.powerW);
    expect(steep.efficiencyPercent).toBeGreaterThan(gentle.efficiencyPercent);
  });

  it('rejects impossible set-ups', () => {
    expect(validateBicycle({ ...DEFAULT_BICYCLE, slopePercent: 0 }).ok).toBe(false);
    expect(validateBicycle({ ...DEFAULT_BICYCLE, sprocketTeeth: 5 }).ok).toBe(false);
    expect(validateBicycle(DEFAULT_BICYCLE).ok).toBe(true);
  });
});

describe('hydraulic disc brake', () => {
  it('default set-up matches the hand calculation', () => {
    const s = solveBrake(DEFAULT_BRAKE);
    // A₂ = π·0.048²/4, P = (4000 + 15) N ÷ A₂ = 2.219 MPa; F₁ = P A₁ + 15 = 644.0 N
    expect(s.pressurePa / 1e6).toBeCloseTo(2.219, 3);
    expect(s.masterForceN).toBeCloseTo(644.0, 0);
    // F = (644.06 × 0.075 + 0.0012 × 644.06) ÷ (0.3 − 0.0012) = 164.25 N (scale shows 164.3)
    expect(s.effortN).toBeCloseTo(164.25, 1);
    expect(s.idealMA).toBeCloseTo(4 * (48 / 19) ** 2, 9);
    expect(s.efficiencyPercent).toBeCloseTo(95.4, 1);
    // Two pads, μ 0.4: 3200 N at the disc; × 0.12 m ÷ 0.3 m = 1280 N at the tyre
    expect(s.discFrictionN).toBeCloseTo(3200, 6);
    expect(s.tyreBrakingForceN).toBeCloseTo(1280, 6);
  });

  it('closes the energy ledger and agrees with the closed form', () => {
    const run = simulateBrakeApply(DEFAULT_BRAKE);
    expect(Math.abs(imbalance(run.ledger))).toBeLessThan(1e-9 * run.ledger.inputJ);
    const c = checkLedger(run.ledger);
    expect(c.valid && c.efficiencyPercent).toBeCloseTo(
      solveBrake(DEFAULT_BRAKE).efficiencyPercent,
      6,
    );
  });

  it('without friction it is ideal: AMA = IMA = pedal ratio × A₂/A₁', () => {
    const s = solveBrake({ ...DEFAULT_BRAKE, sealFrictionN: 0, pivotFriction: 0 });
    expect(s.efficiencyPercent).toBeCloseTo(100, 9);
  });

  it('a bigger caliper piston or pedal ratio needs less pedal force', () => {
    const big = solveBrake({ ...DEFAULT_BRAKE, caliperDiameterM: 0.06 });
    const longPedal = solveBrake({ ...DEFAULT_BRAKE, pedalRatio: 6 });
    const base = solveBrake(DEFAULT_BRAKE);
    expect(big.effortN).toBeLessThan(base.effortN);
    expect(longPedal.effortN).toBeLessThan(base.effortN);
  });

  it('rejects impossible set-ups', () => {
    expect(validateBrake({ ...DEFAULT_BRAKE, pedalRatio: 0.5 }).ok).toBe(false);
    expect(validateBrake(DEFAULT_BRAKE).ok).toBe(true);
  });
});
