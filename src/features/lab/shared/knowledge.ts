import type { KnowledgeItem } from './types';

/** Formative score for a knowledge check (not saved). */
export function knowledgeScore(
  items: readonly KnowledgeItem[],
  answers: Readonly<Record<string, string>>,
): { correct: number; answered: number; total: number } {
  const answered = items.filter((i) => answers[i.id] !== undefined).length;
  const correct = items.filter((i) => answers[i.id] === i.correctId).length;
  return { correct, answered, total: items.length };
}
