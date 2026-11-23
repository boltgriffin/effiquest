import { describe, expect, it } from 'vitest';
import type { Assessment, MatchingItem, McqItem, NumericItem, ReflectionItem } from '@/types';
import {
  bandOf,
  checkItem,
  correctAnswerText,
  parseNumber,
  responseText,
  scoreAttempt,
  scoresByIdea,
} from './scoring';

const base = { objective: 'SRC-O2', explanation: 'because', status: 'draft' as const };

const mcq: McqItem = {
  ...base,
  id: 'm',
  kind: 'mcq',
  prompt: 'Pick',
  misconceptionId: 'G2',
  options: [
    { id: 'a', label: 'Wrong, tagged', misconceptionId: 'G4' },
    { id: 'b', label: 'Right' },
  ],
  correctId: 'b',
};
const numeric: NumericItem = {
  ...base,
  id: 'n',
  kind: 'numeric',
  prompt: 'How many?',
  misconceptionId: 'G5',
  answer: 80,
  tolerance: 0.5,
  unit: '%',
};
const matching: MatchingItem = {
  ...base,
  id: 'x',
  kind: 'matching',
  prompt: 'Match',
  misconceptionId: 'G3',
  pairs: [
    { id: 'p1', left: 'One', rightId: 'c1' },
    { id: 'p2', left: 'Two', rightId: 'c2' },
  ],
  choices: [
    { id: 'c1', label: 'First' },
    { id: 'c2', label: 'Second' },
  ],
};
const reflection: ReflectionItem = {
  id: 'r',
  kind: 'reflection',
  prompt: 'Why?',
  misconceptionId: 'G2',
  objective: 'SRC-O2',
  status: 'draft',
  minChars: 10,
};

describe('checkItem', () => {
  it('marks multiple choice and reports the idea behind a tagged wrong option', () => {
    expect(checkItem(mcq, 'b')).toMatchObject({ correct: true, points: 1, maxPoints: 1 });
    expect(checkItem(mcq, 'a')).toMatchObject({ correct: false, points: 0, revealed: 'G4' });
    expect(checkItem(mcq, undefined)).toMatchObject({ answered: false, correct: false });
  });

  it('marks true/false', () => {
    const tf = {
      ...base,
      id: 't',
      kind: 'truefalse' as const,
      prompt: 'p',
      misconceptionId: 'G4' as const,
      answer: false,
    };
    expect(checkItem(tf, false).correct).toBe(true);
    expect(checkItem(tf, true).correct).toBe(false);
  });

  it('accepts numbers within the tolerance, including the edge', () => {
    expect(checkItem(numeric, '80').correct).toBe(true);
    expect(checkItem(numeric, '80.5').correct).toBe(true);
    expect(checkItem(numeric, '79.5').correct).toBe(true);
    expect(checkItem(numeric, '80.6').correct).toBe(false);
  });

  it('does not mark an unreadable number; it explains instead', () => {
    expect(checkItem(numeric, '80 %')).toMatchObject({
      correct: false,
      inputError: expect.any(String),
    });
    expect(checkItem(numeric, '80,5').inputError).toMatch(/point/);
  });

  it('gives partial credit for matching', () => {
    expect(checkItem(matching, { p1: 'c1', p2: 'c1' })).toMatchObject({
      answered: true,
      correct: false,
      points: 1,
      maxPoints: 2,
    });
    expect(checkItem(matching, { p1: 'c1', p2: 'c2' })).toMatchObject({ correct: true, points: 2 });
    expect(checkItem(matching, { p1: 'c1' }).answered).toBe(false);
  });

  it('never scores a reflection; it is complete at the minimum length', () => {
    expect(checkItem(reflection, 'too short')).toMatchObject({ answered: false, maxPoints: 0 });
    expect(checkItem(reflection, 'long enough answer')).toMatchObject({
      answered: true,
      points: 0,
      maxPoints: 0,
    });
  });
});

describe('parseNumber', () => {
  it('reads plain, signed, grouped and scientific numbers', () => {
    expect(parseNumber(' 12.5 ')).toEqual({ ok: true, value: 12.5 });
    expect(parseNumber('-3')).toEqual({ ok: true, value: -3 });
    expect(parseNumber('1,000')).toEqual({ ok: true, value: 1000 });
    expect(parseNumber('1e3')).toEqual({ ok: true, value: 1000 });
    expect(parseNumber('.5')).toEqual({ ok: true, value: 0.5 });
  });
  it('rejects text, units and empty input', () => {
    expect(parseNumber('').ok).toBe(false);
    expect(parseNumber('12 N').ok).toBe(false);
    expect(parseNumber('abc').ok).toBe(false);
  });
});

const assessment = (mode: 'test' | 'practice'): Assessment => ({
  id: 'a',
  kind: mode === 'test' ? 'baseline' : 'quest_check',
  mode,
  title: 'T',
  version: '1',
  revealAnswers: true,
  items: [mcq, numeric, matching, reflection],
});

describe('scoreAttempt', () => {
  const responses = { m: 'b', n: '81', x: { p1: 'c1', p2: 'c1' }, r: 'a long reflection' };

  it('test mode: totals points and excludes the reflection from the maximum', () => {
    const s = scoreAttempt(assessment('test'), responses);
    expect(s).toMatchObject({ score: 2, maxScore: 4, percent: 50, unanswered: 0 });
    expect(s.ideas.map((i) => [i.id, i.percent])).toEqual([
      ['G2', 100],
      ['G5', 0],
      ['G3', 50],
    ]);
  });

  it('practice mode: points only for answers correct on the first check', () => {
    const s = scoreAttempt(assessment('practice'), { ...responses, n: '80' }, { m: 2, n: 1, x: 1 });
    // mcq right on the 2nd try (0), numeric right first time (1), matching 1 pair first time (1).
    expect(s.score).toBe(2);
    expect(s.items.find((r) => r.item.id === 'm')).toMatchObject({ points: 0, tries: 2 });
  });

  it('counts unanswered items', () => {
    expect(scoreAttempt(assessment('test'), {}).unanswered).toBe(4);
  });
});

describe('ideas and bands', () => {
  it('sums points per idea and skips unscored rows', () => {
    expect(
      scoresByIdea([
        { misconceptionId: 'G1', points: 1, maxPoints: 1 },
        { misconceptionId: 'G1', points: 0, maxPoints: 2 },
        { misconceptionId: 'G2', points: 0, maxPoints: 0 },
      ]),
    ).toEqual([{ id: 'G1', points: 1, maxPoints: 3, percent: 33.3, band: 'needs-work' }]);
  });
  it('uses 75 % and 50 % as the band edges', () => {
    expect(bandOf(75)).toBe('strength');
    expect(bandOf(74.9)).toBe('developing');
    expect(bandOf(50)).toBe('developing');
    expect(bandOf(49.9)).toBe('needs-work');
  });
});

describe('answer text', () => {
  it('writes correct answers and responses out', () => {
    expect(correctAnswerText(mcq)).toBe('B. Right');
    expect(correctAnswerText(numeric)).toBe('80%');
    expect(correctAnswerText(matching)).toBe('One → First; Two → Second');
    expect(responseText(mcq, 'a')).toBe('A. Wrong, tagged');
    expect(responseText(numeric, undefined)).toBe('No answer');
  });
});
