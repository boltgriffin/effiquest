import { describe, expect, it } from 'vitest';
import {
  actualMechanicalAdvantage,
  angularAcceleration,
  efficiency,
  G_STANDARD,
  pascalOutputForce,
  power,
  pressure,
  torque,
  velocityRatio,
  type CalcResult,
} from '@/edu-calc';
import { lessons, type LessonBlock } from './lessons';
import { misconceptions } from './misconceptions';
import { modules } from './modules';
import { labs, quests } from './quests';

const ok = (r: CalcResult): number => {
  if (!r.ok) throw new Error(`calculation failed: ${JSON.stringify(r)}`);
  return r.value;
};

const blocks = lessons.flatMap((l) => l.sections.flatMap((s) => s.blocks));
const examples = new Map(blocks.flatMap((b) => (b.kind === 'example' ? [[b.id, b] as const] : [])));
const answer = (id: string): number => {
  const e = examples.get(id);
  if (!e || e.kind !== 'example') throw new Error(`example ${id} missing`);
  return e.answer.value;
};

describe('lesson content', () => {
  it('has one draft lesson per module, each section traced to a source', () => {
    expect(lessons.map((l) => l.moduleId).sort()).toEqual(modules.map((m) => m.id).sort());
    for (const l of lessons) {
      expect(l.status).toBe('draft');
      expect(l.sections.length).toBeGreaterThanOrEqual(2);
      expect(new Set(l.sections.map((s) => s.id)).size).toBe(l.sections.length);
      for (const s of l.sections) expect(s.source).toMatch(/SRC-[A-Z]+\d/);
    }
  });

  it('links only to labs and misconceptions that exist', () => {
    const labIds = labs.map((l) => l.id);
    const ideaIds = misconceptions.map((m) => m.id);
    for (const b of blocks) {
      if (b.kind === 'lab') expect(labIds).toContain(b.labId);
      if (b.kind === 'idea') expect(ideaIds).toContain(b.misconceptionId);
    }
  });

  it('every quest lab stage points to a listed lab (regression: hydraulic press was missing)', () => {
    const labIds = labs.map((l) => l.id);
    for (const q of quests) {
      for (const st of q.stages) if (st.kind === 'lab') expect(labIds, q.id).toContain(st.labId);
    }
  });

  it('every module addresses each of its misconceptions with a "common idea" block', () => {
    for (const m of modules) {
      const lesson = lessons.find((l) => l.moduleId === m.id);
      const ideas = lesson?.sections.flatMap((s) =>
        s.blocks.flatMap((b: LessonBlock) => (b.kind === 'idea' ? [b.misconceptionId] : [])),
      );
      for (const id of m.misconceptionIds) expect(ideas, `${m.id} ${id}`).toContain(id);
    }
  });

  it('practice questions are well-formed and keyed correctly', () => {
    const items = blocks.flatMap((b) => (b.kind === 'check' ? [b.item] : []));
    expect(items.length).toBeGreaterThanOrEqual(10);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const item of items) {
      expect(item.status).toBe('draft');
      if (item.kind === 'mcq') {
        expect(item.options.map((o) => o.id)).toContain(item.correctId);
        expect(item.options.find((o) => o.id === item.correctId)?.misconceptionId).toBeUndefined();
      }
      if (item.kind === 'numeric') expect(item.tolerance).toBeGreaterThan(0);
    }
  });

  it('the bicycle-uphill section carries the D-13 teacher-check note', () => {
    const s = lessons
      .find((l) => l.moduleId === 'efficiency-practice')
      ?.sections.find((x) => x.id === 'scenarios');
    expect(s?.pendingCheck).toMatch(/D-13/);
  });
});

/** Worked-example answers recomputed with the project's calculation engine. */
describe('worked examples', () => {
  it('torque and angular acceleration', () => {
    expect(answer('torque-door')).toBeCloseTo(ok(torque({ leverArmM: 0.8, forceN: 40 })), 9);
    expect(answer('torque-angle')).toBeCloseTo(
      ok(torque({ leverArmM: 0.8, forceN: 40, angleDeg: 30 })),
      9,
    );
    expect(answer('angular-acc')).toBeCloseTo(
      ok(angularAcceleration({ netTorqueNm: 0.6, momentOfInertiaKgM2: 0.12 })),
      9,
    );
  });

  it('ramp: IMA 4.0, AMA 3.08, efficiency 76.9 %', () => {
    expect(ok(velocityRatio({ inputDistanceM: 2, outputDistanceM: 0.5 }))).toBeCloseTo(4, 9);
    expect(ok(actualMechanicalAdvantage({ outputForceN: 200, inputForceN: 65 }))).toBeCloseTo(
      3.08,
      2,
    );
    expect(answer('ramp')).toBeCloseTo(ok(efficiency({ usefulWorkJ: 100, inputWorkJ: 130 })), 1);
  });

  it('compound jack: efficiencies multiply', () => {
    expect(answer('jack')).toBeCloseTo(0.9 * 0.8 * 100, 9);
  });

  it('pressure and Pascal', () => {
    expect(answer('pressure-piston')).toBeCloseTo(
      ok(pressure({ forceN: 120, areaM2: 0.002 })) / 1000,
      9,
    );
    expect(answer('car-lift')).toBeCloseTo(
      ok(pascalOutputForce({ inputForceN: 300, inputAreaM2: 0.001, outputAreaM2: 0.05 })),
      6,
    );
  });

  it('pulley experiment, input power and the bicycle climb', () => {
    const load = 2 * G_STANDARD;
    expect(answer('pulley-exp')).toBeCloseTo(
      ok(efficiency({ usefulWorkJ: load * 0.3, inputWorkJ: 6 * 1.2 })),
      1,
    );
    expect(answer('power-input')).toBeCloseTo(ok(power({ workJ: 120 / 0.8, timeS: 4 })), 9);
    expect(answer('bike-hill')).toBeCloseTo((70 * G_STANDARD * 15) / 0.95 / 1000, 1);
  });
});
