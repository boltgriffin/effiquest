import { describe, expect, it } from 'vitest';
import { questChecks } from '@/content/assessments';
import type { Attempt, AttemptResponse } from '@/types';
import { attemptsFor, diagnosticPercents, restoreAttempt } from './history';
import { scoreAttempt } from './scoring';

const attempt = (
  id: string,
  kind: Attempt['kind'],
  at: string,
  extra: Partial<Attempt> = {},
): Attempt => ({
  id,
  ownerId: 'A-01',
  assessmentId: kind === 'quest_check' ? 'check-turning-forces' : `diagnostic-${kind}`,
  assessmentVersion: '1.0.0-draft',
  kind,
  mode: kind === 'quest_check' ? 'practice' : 'test',
  startedAt: at,
  submittedAt: at,
  score: 0,
  maxScore: 0,
  ...extra,
});

const row = (
  attemptId: string,
  g: AttemptResponse['misconceptionId'],
  points: number,
  max = 1,
): AttemptResponse => ({
  id: `${attemptId}-${g}-${points}-${Math.random()}`,
  attemptId,
  itemId: 'i',
  response: '"x"',
  isCorrect: points === max,
  points,
  maxPoints: max,
  tries: 1,
  misconceptionId: g,
  answeredAt: '2027-03-01T00:00:00Z',
});

describe('diagnosticPercents', () => {
  it('uses the FIRST baseline attempt, per idea, ignoring unscored rows', () => {
    const attempts = [
      attempt('late', 'baseline', '2027-03-05T00:00:00Z'),
      attempt('early', 'baseline', '2027-03-01T00:00:00Z'),
    ];
    const responses = {
      early: [row('early', 'G1', 1), row('early', 'G1', 0), row('early', 'G2', 0, 0)],
      late: [row('late', 'G1', 1), row('late', 'G1', 1)],
    };
    expect(diagnosticPercents(attempts, responses, 'baseline')).toEqual({ G1: 50 });
    expect(diagnosticPercents(attempts, responses, 'post')).toBeUndefined();
  });
});

describe('restoreAttempt', () => {
  const check = questChecks.find((c) => c.id === 'check-turning-forces');
  if (!check) throw new Error('check missing');
  const answers = {
    'q3-1': '15',
    'q3-2': { p1: 'torque', p2: 'inertia', p3: 'alpha', p4: 'angle' },
    'q3-3': 'b',
  };
  const tries = { 'q3-1': 1, 'q3-2': 2, 'q3-3': 2 };
  const live = scoreAttempt(check, answers, tries);

  it('rebuilds the same score from stored rows', () => {
    const rows = live.items.map((r): AttemptResponse => ({
      ...row('a1', r.item.misconceptionId, r.points, r.check.maxPoints),
      itemId: r.item.id,
      response: JSON.stringify(r.response ?? null),
      tries: r.tries,
    }));
    const restored = restoreAttempt(
      check,
      attempt('a1', 'quest_check', '2027-03-01T00:00:00Z'),
      rows,
    );
    expect(restored?.score).toBe(live.score);
    expect(restored?.score).toBe(1); // only q3-1 was right first time
  });

  it('declines to rebuild results for an older version of the items', () => {
    const old = attempt('a1', 'quest_check', '2027-03-01T00:00:00Z', { assessmentVersion: '0.9' });
    expect(restoreAttempt(check, old, [])).toBeNull();
  });

  it('lists attempts newest first', () => {
    const list = attemptsFor(
      [
        attempt('a', 'quest_check', '2027-03-01T00:00:00Z'),
        attempt('b', 'quest_check', '2027-03-02T00:00:00Z'),
      ],
      'check-turning-forces',
    );
    expect(list.map((a) => a.id)).toEqual(['b', 'a']);
  });
});
