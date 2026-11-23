import { describe, expect, it } from 'vitest';
import {
  areaFromDiameter,
  checkLedger,
  G,
  imbalance,
  simulateHydraulicLift,
  solveHydraulic,
  validateHydraulic,
  type HydraulicParams,
} from './index';

const eta = (r: ReturnType<typeof simulateHydraulicLift>) => {
  const c = checkLedger(r.ledger);
  if (!c.valid) throw new Error(c.reason);
  return c.efficiencyPercent;
};

const base: HydraulicParams = {
  loadMassKg: 100,
  inputDiameterM: 0.02,
  outputDiameterM: 0.08,
  inputSealN: 5,
  outputSealN: 5,
  leakConductance: 8e-12,
  liftM: 0.1,
};

/** Diameter giving an area (m²). */
const dia = (area: number) => Math.sqrt((4 * area) / Math.PI);

describe('hydraulic press', () => {
  it('plan test vector: A₁ 0.001, A₂ 0.1 m², f₁ 5 N, f₂ 200 N, 5000 N load → F₁ = 57 N, η 87.7 %', () => {
    const p: HydraulicParams = {
      loadMassKg: 5000 / G,
      inputDiameterM: dia(0.001),
      outputDiameterM: dia(0.1),
      inputSealN: 5,
      outputSealN: 200,
      leakConductance: 0,
      liftM: 0.01,
    };
    expect(solveHydraulic(p).effortN).toBeCloseTo(57, 9);
    const run = simulateHydraulicLift(p, { loadSpeedMps: 0.002 });
    expect(Math.abs(imbalance(run.ledger)) / run.ledger.inputJ).toBeLessThan(1e-9);
    expect(eta(run)).toBeCloseTo((5000 / (57 * 100)) * 100, 6);
  });

  it("ideal press (no seal friction, no leakage) follows Pascal's principle exactly", () => {
    const p = { ...base, inputSealN: 0, outputSealN: 0, leakConductance: 0 };
    const s = solveHydraulic(p);
    expect(s.areaRatio).toBeCloseTo(16, 12);
    expect(s.pressurePa).toBeCloseTo((100 * G) / areaFromDiameter(0.08), 6);
    expect(s.effortN * s.areaRatio).toBeCloseTo(100 * G, 9);
    const run = simulateHydraulicLift(p);
    expect(eta(run)).toBeCloseTo(100, 9);
    const last = run.samples.at(-1);
    expect((last?.inputDistanceM ?? 0) / (last?.outputDistanceM ?? 1)).toBeCloseTo(16, 9);
  });

  it('energy closes for the default set-up; losses are named and non-negative', () => {
    const run = simulateHydraulicLift(base);
    expect(Math.abs(imbalance(run.ledger)) / run.ledger.inputJ).toBeLessThan(1e-9);
    expect(run.ledger.deltaKineticJ).toBeLessThan(1e-12);
    expect(run.ledger.losses.map((l) => l.kind)).toEqual(['friction', 'leakage']);
    expect(run.ledger.losses.every((l) => l.joules > 0)).toBe(true);
  });

  it('leakage makes the input piston travel further than A₂/A₁ × the rise; IMA stays geometric', () => {
    const run = simulateHydraulicLift(base);
    const last = run.samples.at(-1);
    const ideal = run.idealInputDistanceM ?? 0;
    expect(ideal).toBeCloseTo(16 * (last?.outputDistanceM ?? 0), 9);
    expect(last?.inputDistanceM ?? 0).toBeGreaterThan(ideal);
    // Extra stroke = leaked volume ÷ A₁.
    const extra = (last?.inputDistanceM ?? 0) - ideal;
    expect(extra).toBeCloseTo((run.extras?.leakedVolumeM3 ?? 0) / areaFromDiameter(0.02), 9);
  });

  it('efficiency falls with seal friction and with leakage', () => {
    const e = (o: Partial<HydraulicParams>) => eta(simulateHydraulicLift({ ...base, ...o }));
    expect(e({ inputSealN: 0, outputSealN: 0 })).toBeGreaterThan(e({}));
    expect(e({ leakConductance: 0 })).toBeGreaterThan(e({}));
    expect(e({ leakConductance: 2e-11 })).toBeLessThan(e({}));
  });

  it('a wider output piston multiplies force more but needs a longer input stroke', () => {
    const small = simulateHydraulicLift({ ...base, outputDiameterM: 0.06 });
    const large = simulateHydraulicLift({ ...base, outputDiameterM: 0.1 });
    expect(large.steadyInputForceN).toBeLessThan(small.steadyInputForceN);
    expect(large.samples.at(-1)?.inputDistanceM ?? 0).toBeGreaterThan(
      small.samples.at(-1)?.inputDistanceM ?? 0,
    );
  });

  it('reports the extras the lab shows', () => {
    const run = simulateHydraulicLift(base);
    expect(run.extras?.pressurePa).toBeCloseTo(solveHydraulic(base).pressurePa, 9);
    expect(run.extras?.idealOutputN).toBeGreaterThan(100 * G); // effort includes seal friction
  });

  it('rejects invalid set-ups', () => {
    expect(validateHydraulic({ ...base, inputDiameterM: 0 }).ok).toBe(false);
    expect(validateHydraulic({ ...base, leakConductance: -1 }).ok).toBe(false);
    expect(validateHydraulic({ ...base, inputSealN: -2 }).ok).toBe(false);
  });
});
