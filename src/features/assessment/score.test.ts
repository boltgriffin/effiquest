import { describe, expect, it } from 'vitest';
import { sampleItems } from './sampleItems';
import { scoreAll, scoreItem } from './score';

const [mcq, numeric] = sampleItems;
if (!mcq || !numeric) throw new Error('sample items missing');

describe('scoreItem', () => {
  it('marks the correct option as correct', () => {
    expect(scoreItem(mcq, 'c')).toEqual({ itemId: 'sample-1', correct: true, answered: true });
  });

  it('reports the misconception behind a tagged distractor', () => {
    expect(scoreItem(mcq, 'a')).toMatchObject({ correct: false, revealed: 'G2' });
  });

  it('accepts numeric answers within tolerance only', () => {
    expect(scoreItem(numeric, '74.3').correct).toBe(true);
    expect(scoreItem(numeric, '75').correct).toBe(false);
    expect(scoreItem(numeric, 'abc').correct).toBe(false);
  });

  it('treats blank responses as unanswered', () => {
    expect(scoreItem(numeric, '  ')).toEqual({
      itemId: 'sample-2',
      correct: false,
      answered: false,
    });
  });
});

describe('scoreAll', () => {
  it('totals correct answers', () => {
    expect(
      scoreAll(sampleItems, { 'sample-1': 'c', 'sample-2': '74.27', 'sample-3': 'a' }),
    ).toMatchObject({
      score: 2,
      max: 3,
    });
  });
});
