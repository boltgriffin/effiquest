import { describe, expect, it } from 'vitest';
import type { ProgressEvent } from '@/types';
import { buildLearnerExport, classCsv, parseLearnerExport, toLearnerRow } from './exportFormat';

const event = (kind: ProgressEvent['kind'], refId: string, minute: number): ProgressEvent => ({
  id: `${refId}-${minute}`,
  ownerId: 'G11-07',
  kind,
  refId,
  createdAt: new Date(Date.UTC(2026, 10, 25, 8, minute)).toISOString(),
});

describe('learner export round trip', () => {
  it('parses what it builds', () => {
    const built = buildLearnerExport('G11-07', [event('lesson_completed', 'torque', 1)]);
    const parsed = parseLearnerExport(JSON.stringify(built));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.progressEvents).toHaveLength(1);
  });

  it('rejects non-JSON, foreign files, bad codes and damaged records', () => {
    expect(parseLearnerExport('not json').ok).toBe(false);
    expect(parseLearnerExport('{"format":"other"}').ok).toBe(false);
    const bad = buildLearnerExport('x', []);
    expect(parseLearnerExport(JSON.stringify(bad)).ok).toBe(false);
    const damaged = { ...buildLearnerExport('G11-07', []), progressEvents: [{ id: 1 }] };
    expect(parseLearnerExport(JSON.stringify(damaged)).ok).toBe(false);
  });

  it('keeps only valid diagnostic scores', () => {
    const file = {
      ...buildLearnerExport('G11-07', []),
      diagnostics: { baseline: { G1: 40, G2: 150, G9: 10 } },
    };
    const parsed = parseLearnerExport(JSON.stringify(file));
    expect(parsed.ok && parsed.data.diagnostics.baseline).toEqual({ G1: 40 });
  });
});

describe('classCsv', () => {
  it('writes one row per learner, per-misconception columns and a class average', () => {
    const a = toLearnerRow({
      ...buildLearnerExport('A-01', [event('lesson_completed', 'torque', 1)]),
      diagnostics: { baseline: { G1: 40 }, post: { G1: 80 } },
    });
    const b = toLearnerRow({
      ...buildLearnerExport('B-02', []),
      diagnostics: { baseline: { G1: 20 }, post: { G1: 50 } },
    });
    const lines = classCsv([a, b]).trim().split('\n');
    const header = lines[0]?.split(',') ?? [];
    expect(header).toContain('baseline_G1');
    expect(header).toContain('change_G6');
    expect(lines).toHaveLength(4);
    const avg = lines[3]?.split(',') ?? [];
    expect(avg[0]).toBe('CLASS AVERAGE');
    expect(avg[header.indexOf('baseline_G1')]).toBe('30');
    expect(avg[header.indexOf('change_G1')]).toBe('35');
    expect(avg[header.indexOf('modules_completed')]).toBe('0.5');
  });

  it('guards against spreadsheet formula injection', () => {
    const row = toLearnerRow(buildLearnerExport('A-01', []));
    expect(classCsv([{ ...row, learnerCode: '=CMD()' }])).toContain("'=CMD()");
  });
});
