import { describe, expect, it } from 'vitest';
import { efficiency, pascalOutputForce, pressure, torque } from '@/edu-calc';
import { allAssessments, baselineDiagnostic, findAssessment, questChecks } from './assessments';
import { misconceptions } from './misconceptions';
import { quests } from './quests';

/** Content validation: every drafted item must be well-formed, traced and correctly keyed. */
describe('assessment content', () => {
  const items = allAssessments.flatMap((a) => a.items.map((item) => ({ a, item })));

  it('has unique item ids within each assessment and unique assessment ids', () => {
    expect(new Set(allAssessments.map((a) => a.id)).size).toBe(allAssessments.length);
    for (const a of allAssessments) {
      expect(new Set(a.items.map((i) => i.id)).size).toBe(a.items.length);
    }
  });

  it('traces every item to a concept-note objective and a misconception, marked draft', () => {
    const ids = misconceptions.map((m) => m.id);
    for (const { item } of items) {
      expect(item.objective).toMatch(/^SRC-O[1-6](, SRC-O[1-6])*$/);
      expect(ids).toContain(item.misconceptionId);
      expect(item.status).toBe('draft');
      expect(item.prompt.length).toBeGreaterThan(10);
      if (item.kind !== 'reflection') expect(item.explanation.length).toBeGreaterThan(10);
    }
  });

  it('keys every choice item to an existing option, and matching pairs to existing choices', () => {
    for (const { item } of items) {
      if (item.kind === 'mcq') {
        expect(item.options.map((o) => o.id)).toContain(item.correctId);
        // A tagged distractor can never be the correct answer.
        const correct = item.options.find((o) => o.id === item.correctId);
        expect(correct?.misconceptionId).toBeUndefined();
      }
      if (item.kind === 'matching') {
        const choiceIds = item.choices.map((c) => c.id);
        for (const p of item.pairs) expect(choiceIds).toContain(p.rightId);
        expect(new Set(item.pairs.map((p) => p.rightId)).size).toBe(item.pairs.length);
      }
      if (item.kind === 'numeric') {
        expect(Number.isFinite(item.answer)).toBe(true);
        expect(item.tolerance).toBeGreaterThan(0);
        // Tolerance stays "reasonable": at most 2 % of the answer.
        expect(item.tolerance).toBeLessThanOrEqual(Math.abs(item.answer) * 0.02 + 0.05);
      }
    }
  });

  it('covers every idea G1-G6 with at least two scored diagnostic items', () => {
    for (const m of misconceptions) {
      const scored = baselineDiagnostic.items.filter(
        (i) => i.misconceptionId === m.id && i.kind !== 'reflection',
      );
      expect(scored.length, m.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('gives each quest a knowledge check that exists and targets the quest idea', () => {
    for (const q of quests) {
      const stage = q.stages.find((s) => s.kind === 'check');
      expect(stage, q.id).toBeDefined();
      const check = stage?.kind === 'check' ? findAssessment(stage.assessmentId) : undefined;
      expect(check?.mode).toBe('practice');
      expect(check?.items.every((i) => i.misconceptionId === q.misconceptionId)).toBe(true);
    }
    expect(questChecks).toHaveLength(quests.length);
  });
});

/** Numeric answer keys recomputed with the project's calculation engine. */
describe('numeric answer keys', () => {
  const value = (id: string): number => {
    const item = allAssessments.flatMap((a) => a.items).find((i) => i.id === id);
    if (item?.kind !== 'numeric') throw new Error(`numeric item ${id} missing`);
    return item.answer;
  };
  const ok = (r: ReturnType<typeof torque>) => {
    if (!r.ok) throw new Error('calculation failed');
    return r.value;
  };

  it('torque items', () => {
    expect(value('d-g1-2')).toBeCloseTo(ok(torque({ leverArmM: 0.25, forceN: 40 })), 9);
    expect(value('q3-1')).toBeCloseTo(ok(torque({ leverArmM: 0.5, forceN: 30 })), 9);
  });

  it('efficiency items', () => {
    expect(value('d-g5-1')).toBeCloseTo(ok(efficiency({ usefulWorkJ: 200, inputWorkJ: 250 })), 9);
    // 75 % efficient ramp, 300 N raised 1 m: W_in = 300 J ÷ 0.75.
    expect(ok(efficiency({ usefulWorkJ: 300, inputWorkJ: value('d-g5-2') }))).toBeCloseTo(75, 9);
    expect(value('d-g3-2')).toBeCloseTo(80 * 0.5, 9);
    expect(value('q2-1')).toBe(600 - 480);
    expect(value('q1-2')).toBeCloseTo(120 / 50, 9);
  });

  it('pressure and Pascal items', () => {
    expect(value('q4-1')).toBeCloseTo(ok(pressure({ forceN: 150, areaM2: 0.003 })) / 1000, 9);
    expect(value('d-g6-1')).toBeCloseTo(
      ok(pascalOutputForce({ inputForceN: 200, inputAreaM2: 2e-4, outputAreaM2: 10e-4 })),
      6,
    );
    expect(value('q4-3')).toBeCloseTo((9800 * 0.002) / 0.2, 9);
  });

  it('the two-ramp data come from one surface (mu = 0.1) at 14 and 30 degrees', () => {
    const ramp = (deg: number) => {
      const t = (deg * Math.PI) / 180;
      const per = Math.sin(t) + 0.1 * Math.cos(t);
      return { ama: 1 / per, eta: (Math.sin(t) / per) * 100 };
    };
    expect(ramp(14).ama).toBeCloseTo(3.0, 1);
    expect(Math.round(ramp(14).eta)).toBe(71);
    expect(ramp(30).ama).toBeCloseTo(1.7, 1);
    expect(Math.round(ramp(30).eta)).toBe(85);
  });
});
