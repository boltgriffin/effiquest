import type { MisconceptionId } from '@/types';
import type { SampleItem } from './sampleItems';

export interface ItemResult {
  itemId: string;
  correct: boolean;
  answered: boolean;
  /** Misconception revealed by the chosen distractor, if it is tagged. */
  revealed?: MisconceptionId;
}

export function scoreItem(item: SampleItem, response: string | undefined): ItemResult {
  const answered = response !== undefined && response.trim() !== '';
  if (!answered) return { itemId: item.id, correct: false, answered };
  if (item.type === 'mcq') {
    const chosen = item.options.find((o) => o.id === response);
    const correct = response === item.correctOptionId;
    return {
      itemId: item.id,
      correct,
      answered,
      ...(!correct && chosen?.misconceptionId ? { revealed: chosen.misconceptionId } : {}),
    };
  }
  const value = Number(response);
  const correct = Number.isFinite(value) && Math.abs(value - item.answer) <= item.tolerance;
  return { itemId: item.id, correct, answered };
}

export function scoreAll(items: readonly SampleItem[], responses: Record<string, string>) {
  const results = items.map((item) => scoreItem(item, responses[item.id]));
  return { results, score: results.filter((r) => r.correct).length, max: items.length };
}
