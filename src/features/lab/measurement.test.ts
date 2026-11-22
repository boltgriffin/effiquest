import { describe, expect, it } from 'vitest';
import { simulateInclinePull } from '@/physics-core';
import { measureIncline, sameParams } from './measurement';
import { RAMP_LENGTH_M } from './params';

describe('measureIncline', () => {
  const params = { angleDeg: 30, friction: 0.2, massKg: 10 };
  const m = measureIncline(params, simulateInclinePull({ ...params, lengthM: RAMP_LENGTH_M }));

  it('reads the instruments at their resolution', () => {
    expect(m.scaleN).toBe(66);
    expect(m.loadN).toBe(98.1);
    expect(m.effortDistanceM).toBe(2);
    expect(m.heightM).toBe(1);
  });

  it('takes efficiency from the energy ledger, not from the rounded readings', () => {
    expect(m.check.valid).toBe(true);
    expect(m.readouts.efficiencyPercent).toBeCloseTo(74.27, 1);
    expect(m.readouts.inputWorkJ).toBeCloseTo(132.08, 1);
    expect(m.readouts.outputWorkJ).toBeCloseTo(98.1, 1);
  });

  it('a learner using the readings lands within the checker tolerance', () => {
    const learnerEta = ((m.loadN * m.heightM) / (m.scaleN * m.effortDistanceM)) * 100;
    expect(Math.abs(learnerEta - m.readouts.efficiencyPercent)).toBeLessThan(0.5);
  });

  it('compares set-ups', () => {
    expect(sameParams(params, { ...params })).toBe(true);
    expect(sameParams(params, { ...params, friction: 0.3 })).toBe(false);
  });
});
