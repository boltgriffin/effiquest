import { describe, expect, it } from 'vitest';
import {
  actualMechanicalAdvantage,
  angularAcceleration,
  efficiency,
  efficiencyFromMA,
  idealMA,
  pascalOutputDistance,
  pascalOutputForce,
  power,
  pressure,
  torque,
  velocityRatio,
  weight,
  work,
  type CalcResult,
  type Calculation,
} from './index';

function ok(r: CalcResult): Calculation {
  if (!r.ok)
    throw new Error(`expected success, got: ${r.errors.map((e) => e.message).join(' | ')}`);
  return r;
}
function fields(r: CalcResult): string[] {
  if (r.ok) throw new Error(`expected failure for ${r.quantity}`);
  return r.errors.map((e) => e.field);
}

describe('every successful result is complete and explicit about its basis', () => {
  const all = [
    work({ forceN: 100, distanceM: 3 }),
    power({ workJ: 300, timeS: 5 }),
    torque({ leverArmM: 0.5, forceN: 100 }),
    angularAcceleration({ netTorqueNm: 2, momentOfInertiaKgM2: 0.5 }),
    actualMechanicalAdvantage({ outputForceN: 98.1, inputForceN: 66.04 }),
    velocityRatio({ inputDistanceM: 2, outputDistanceM: 1 }),
    efficiency({ usefulWorkJ: 98.1, inputWorkJ: 132.08 }),
    efficiencyFromMA({ actualMA: 1.4855, idealMA: 2 }),
    pressure({ forceN: 50, areaM2: 0.001 }),
    pascalOutputForce({ inputForceN: 50, inputAreaM2: 0.001, outputAreaM2: 0.1 }),
    pascalOutputDistance({ inputDistanceM: 0.1, inputAreaM2: 0.001, outputAreaM2: 0.1 }),
    weight({ massKg: 10 }),
  ].map(ok);

  it.each(all.map((r) => [r.quantity, r] as const))('%s', (_, r) => {
    expect(Number.isFinite(r.value)).toBe(true);
    expect(r.formula).toMatch(/=/);
    expect(r.substitution).toMatch(/=.*=/);
    expect(r.explanation.length).toBeGreaterThan(40);
    expect(r.assumptions.length).toBeGreaterThan(0);
    expect(r.source).toMatch(/SRC|BRF|REC/);
    expect(['ideal', 'measured', 'simulated']).toContain(r.basis);
  });
});

describe('work: W = F d cos θ', () => {
  it('reference: 100 N over 3 m in the direction of motion is 300 J, using W = F × d', () => {
    const r = ok(work({ forceN: 100, distanceM: 3 }));
    expect(r.value).toBe(300);
    expect(r.unit).toBe('J');
    expect(r.formula).toBe('W = F × d');
    expect(r.substitution).toBe('W = 100 N × 3 m = 300 J');
  });

  it('uses the cosine form only when the force is not parallel', () => {
    const r = ok(work({ forceN: 100, distanceM: 3, angleDeg: 60 }));
    expect(r.value).toBeCloseTo(150, 12);
    expect(r.formula).toBe('W = F × d × cos θ');
  });

  it('boundaries: 90° gives exactly zero work with a warning; 180° gives negative work', () => {
    const perpendicular = ok(work({ forceN: 100, distanceM: 3, angleDeg: 90 }));
    expect(perpendicular.value).toBe(0);
    expect(perpendicular.warnings[0]).toMatch(/90°/);
    expect(ok(work({ forceN: 10, distanceM: 2, angleDeg: 180 })).value).toBe(-20);
  });

  it('zero force or distance gives zero work', () => {
    expect(ok(work({ forceN: 0, distanceM: 3 })).value).toBe(0);
    expect(ok(work({ forceN: 5, distanceM: 0 })).value).toBe(0);
  });

  it('rejects negative magnitudes, bad angles and non-numbers, listing every problem', () => {
    expect(fields(work({ forceN: -1, distanceM: -2, angleDeg: 200 }))).toEqual([
      'forceN',
      'distanceM',
      'angleDeg',
    ]);
    expect(fields(work({ forceN: Number.NaN, distanceM: 1 }))).toEqual(['forceN']);
    expect(fields(work({ forceN: 1, distanceM: Number.POSITIVE_INFINITY }))).toEqual(['distanceM']);
  });
});

describe('power: P = W / t', () => {
  it('reference: 300 J in 5 s is 60 W', () => {
    expect(ok(power({ workJ: 300, timeS: 5 })).value).toBe(60);
  });
  it('never divides by zero', () => {
    expect(fields(power({ workJ: 300, timeS: 0 }))).toEqual(['timeS']);
    expect(fields(power({ workJ: 300, timeS: -2 }))).toEqual(['timeS']);
  });
  it('accepts zero work', () => {
    expect(ok(power({ workJ: 0, timeS: 4 })).value).toBe(0);
  });
});

describe('torque: τ = r F sin θ, and α = τ_net / I', () => {
  it('reference: 100 N at 0.5 m is 50 N·m perpendicular and 25 N·m at 30°', () => {
    expect(ok(torque({ leverArmM: 0.5, forceN: 100 })).value).toBe(50);
    expect(ok(torque({ leverArmM: 0.5, forceN: 100, angleDeg: 30 })).value).toBe(25);
  });
  it('a force along the arm gives zero torque, with an explanation', () => {
    const r = ok(torque({ leverArmM: 0.5, forceN: 100, angleDeg: 0 }));
    expect(r.value).toBe(0);
    expect(r.warnings).toHaveLength(1);
  });
  it('rejects invalid input', () => {
    expect(fields(torque({ leverArmM: -0.5, forceN: 100, angleDeg: 270 }))).toEqual([
      'leverArmM',
      'angleDeg',
    ]);
  });
  it('angular acceleration reference: 2 N·m on 0.5 kg·m² gives 4 rad/s²', () => {
    expect(ok(angularAcceleration({ netTorqueNm: 2, momentOfInertiaKgM2: 0.5 })).value).toBe(4);
    expect(fields(angularAcceleration({ netTorqueNm: 2, momentOfInertiaKgM2: 0 }))).toEqual([
      'momentOfInertiaKgM2',
    ]);
  });
});

describe('mechanical advantage and velocity ratio', () => {
  it('reference (incline test case): AMA = 98.1 / 66.04 ≈ 1.485, measured', () => {
    const r = ok(actualMechanicalAdvantage({ outputForceN: 98.1, inputForceN: 66.04 }));
    expect(r.value).toBeCloseTo(1.4855, 4);
    expect(r.basis).toBe('measured');
  });
  it('velocity ratio is always an ideal value', () => {
    const r = ok(velocityRatio({ inputDistanceM: 2, outputDistanceM: 1 }));
    expect(r.value).toBe(2);
    expect(r.basis).toBe('ideal');
  });
  it('machine-specific IMA helpers', () => {
    expect(ok(idealMA.incline(5, 1)).value).toBe(5);
    expect(ok(idealMA.lever(0.8, 0.2)).value).toBeCloseTo(4, 12);
    expect(ok(idealMA.wheelAndAxle(0.3, 0.05)).value).toBeCloseTo(6, 12);
    expect(ok(idealMA.pulley(4)).value).toBe(4);
  });
  it('never divides by zero', () => {
    expect(fields(actualMechanicalAdvantage({ outputForceN: 10, inputForceN: 0 }))).toEqual([
      'inputForceN',
    ]);
    expect(fields(velocityRatio({ inputDistanceM: 1, outputDistanceM: 0 }))).toEqual([
      'outputDistanceM',
    ]);
  });
  it('AMA below 1 is explained, not rejected (e.g. a third-class lever)', () => {
    expect(
      ok(actualMechanicalAdvantage({ outputForceN: 10, inputForceN: 40 })).explanation,
    ).toMatch(/below 1/);
  });
});

describe('efficiency', () => {
  it('reference: 98.1 J out of 132.08 J is 74.3 %', () => {
    const r = ok(efficiency({ usefulWorkJ: 98.1, inputWorkJ: 132.08 }));
    expect(r.value).toBeCloseTo(74.27, 2);
    expect(r.substitution).toBe('η = 98.1 J ÷ 132.1 J × 100% = 74.3%');
    expect(r.explanation).toMatch(/25\.7%/);
  });
  it('agrees with the AMA ÷ IMA form for the same movement', () => {
    const fromWork = ok(efficiency({ usefulWorkJ: 98.1, inputWorkJ: 66.04 * 2 })).value;
    const fromMA = ok(efficiencyFromMA({ actualMA: 98.1 / 66.04, idealMA: 2 })).value;
    expect(fromMA).toBeCloseTo(fromWork, 10);
  });
  it('boundaries: 0 % is valid, 100 % is valid with an "ideal only" warning', () => {
    expect(ok(efficiency({ usefulWorkJ: 0, inputWorkJ: 10 })).value).toBe(0);
    const perfect = ok(efficiency({ usefulWorkJ: 10, inputWorkJ: 10 }));
    expect(perfect.value).toBe(100);
    expect(perfect.warnings[0]).toMatch(/ideal/);
  });
  it('accepts floating-point rounding at exactly 100 % (simulated perfect machine)', () => {
    const r = ok(
      efficiency({ usefulWorkJ: 98.10000000000001, inputWorkJ: 98.1 }, { basis: 'simulated' }),
    );
    expect(r.value).toBe(100);
    expect(r.warnings[0]).toMatch(/ideal/);
  });
  it('rejects output greater than input instead of reporting more than 100 %', () => {
    expect(fields(efficiency({ usefulWorkJ: 12, inputWorkJ: 10 }))).toEqual(['usefulWorkJ']);
    expect(fields(efficiencyFromMA({ actualMA: 3, idealMA: 2 }))).toEqual(['actualMA']);
  });
  it('rejects zero or negative input work, negative output and non-numbers', () => {
    expect(fields(efficiency({ usefulWorkJ: 5, inputWorkJ: 0 }))).toEqual(['inputWorkJ']);
    expect(fields(efficiency({ usefulWorkJ: -1, inputWorkJ: 10 }))).toEqual(['usefulWorkJ']);
    expect(fields(efficiency({ usefulWorkJ: Number.NaN, inputWorkJ: 10 }))).toEqual([
      'usefulWorkJ',
    ]);
  });
  it('can be labelled as simulated (from the physics model) but never as ideal', () => {
    expect(ok(efficiency({ usefulWorkJ: 9, inputWorkJ: 10 }, { basis: 'simulated' })).basis).toBe(
      'simulated',
    );
  });
});

describe("hydraulics: P = F / A and Pascal's principle", () => {
  it('reference: 50 N on 0.001 m² is 50 kPa; output on 0.1 m² is 5000 N', () => {
    expect(ok(pressure({ forceN: 50, areaM2: 0.001 })).value).toBeCloseTo(50000, 6);
    const f2 = ok(pascalOutputForce({ inputForceN: 50, inputAreaM2: 0.001, outputAreaM2: 0.1 }));
    expect(f2.value).toBeCloseTo(5000, 6);
    expect(f2.basis).toBe('ideal');
  });
  it('the output piston moves less: 0.1 m in gives 0.001 m out (work in = work out)', () => {
    const d2 = ok(
      pascalOutputDistance({ inputDistanceM: 0.1, inputAreaM2: 0.001, outputAreaM2: 0.1 }),
    );
    expect(d2.value).toBeCloseTo(0.001, 12);
    expect(50 * 0.1).toBeCloseTo(5000 * d2.value, 9);
  });
  it('rejects zero areas and warns when the output piston is smaller', () => {
    expect(fields(pressure({ forceN: 50, areaM2: 0 }))).toEqual(['areaM2']);
    expect(fields(pascalOutputForce({ inputForceN: 50, inputAreaM2: 0, outputAreaM2: 0 }))).toEqual(
      ['inputAreaM2', 'outputAreaM2'],
    );
    expect(
      ok(pascalOutputForce({ inputForceN: 50, inputAreaM2: 0.1, outputAreaM2: 0.001 })).warnings,
    ).toHaveLength(1);
  });
});

describe('weight: W = m g', () => {
  it('reference: 10 kg weighs 98.1 N', () => {
    const r = ok(weight({ massKg: 10 }));
    expect(r.value).toBeCloseTo(98.1, 12);
    expect(r.unit).toBe('N');
  });
  it('rejects zero or negative mass', () => {
    expect(fields(weight({ massKg: 0 }))).toEqual(['massKg']);
  });
});
