import type {
  Assessment,
  AssessmentItem,
  ItemResponse,
  MisconceptionId,
  NumericItem,
} from '@/types';

/**
 * Pure marking and scoring (docs/QUESTS_AND_ASSESSMENTS.md section 4). No React, no storage.
 * - mcq, true/false, numeric: 1 point.
 * - matching: 1 point per correct pair (partial credit); "correct" only when every pair is right.
 * - reflection: not scored (0 points); complete when it has at least `minChars` characters.
 */

/** Practice items: checks allowed before the answer is shown. */
export const PRACTICE_MAX_TRIES = 2;

/** Bands for the results summary (REC: thresholds for the teacher to confirm). */
export const STRENGTH_AT = 75;
export const NEEDS_WORK_BELOW = 50;

export interface ItemCheck {
  answered: boolean;
  correct: boolean;
  points: number;
  maxPoints: number;
  /** Idea revealed by a tagged wrong option. */
  revealed?: MisconceptionId;
  /** Numeric answers: why the input could not be read (shown before marking). */
  inputError?: string;
}

export function maxPointsOf(item: AssessmentItem): number {
  switch (item.kind) {
    case 'matching':
      return item.pairs.length;
    case 'reflection':
      return 0;
    default:
      return 1;
  }
}

/**
 * Reads a typed number. Accepts "12.5", " 1000 ", "1,000" (thousands) and "-3". Rejects anything
 * else with a message rather than guessing (e.g. "12 N", "1,5", "").
 */
export function parseNumber(
  raw: string,
): { ok: true; value: number } | { ok: false; error: string } {
  const s = raw.trim().replace(/\s+/g, '');
  if (s === '') return { ok: false, error: 'Type a number.' };
  const plain = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
  const grouped = /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/;
  if (grouped.test(s)) return { ok: true, value: Number(s.replace(/,/g, '')) };
  if (plain.test(s)) return { ok: true, value: Number(s) };
  if (/^[+-]?\d+,\d+$/.test(s)) {
    return { ok: false, error: 'Use a point for decimals, for example 2.5.' };
  }
  return { ok: false, error: 'Type the number only, without the unit.' };
}

export function isNumericCorrect(item: NumericItem, value: number): boolean {
  // A tiny epsilon keeps answers exactly on the tolerance edge correct despite float rounding.
  return (
    Math.abs(value - item.answer) <= item.tolerance + 1e-9 * Math.max(1, Math.abs(item.answer))
  );
}

export function isAnswered(item: AssessmentItem, response: ItemResponse | undefined): boolean {
  if (response === undefined) return false;
  switch (item.kind) {
    case 'mcq':
      return typeof response === 'string' && response !== '';
    case 'truefalse':
      return typeof response === 'boolean';
    case 'numeric':
      return typeof response === 'string' && response.trim() !== '';
    case 'reflection':
      return typeof response === 'string' && response.trim().length >= item.minChars;
    case 'matching':
      return typeof response === 'object' && item.pairs.every((p) => Boolean(response[p.id]));
  }
}

export function checkItem(item: AssessmentItem, response: ItemResponse | undefined): ItemCheck {
  const maxPoints = maxPointsOf(item);
  const answered = isAnswered(item, response);
  const none: ItemCheck = { answered, correct: false, points: 0, maxPoints };
  if (response === undefined) return none;

  switch (item.kind) {
    case 'mcq': {
      if (typeof response !== 'string' || !answered) return none;
      const correct = response === item.correctId;
      const chosen = item.options.find((o) => o.id === response);
      return {
        answered,
        correct,
        points: correct ? 1 : 0,
        maxPoints,
        ...(!correct && chosen?.misconceptionId ? { revealed: chosen.misconceptionId } : {}),
      };
    }
    case 'truefalse': {
      if (typeof response !== 'boolean') return none;
      const correct = response === item.answer;
      return { answered, correct, points: correct ? 1 : 0, maxPoints };
    }
    case 'numeric': {
      if (typeof response !== 'string' || !answered) return none;
      const parsed = parseNumber(response);
      if (!parsed.ok) return { ...none, inputError: parsed.error };
      const correct = isNumericCorrect(item, parsed.value);
      return { answered, correct, points: correct ? 1 : 0, maxPoints };
    }
    case 'matching': {
      if (typeof response !== 'object') return none;
      const points = item.pairs.filter((p) => response[p.id] === p.rightId).length;
      return { answered, correct: points === item.pairs.length, points, maxPoints };
    }
    case 'reflection':
      // Not scored: "correct" means complete, so it never counts against the learner.
      return { answered, correct: answered, points: 0, maxPoints: 0 };
  }
}

export interface IdeaScore {
  id: MisconceptionId;
  points: number;
  maxPoints: number;
  percent: number;
  band: 'strength' | 'developing' | 'needs-work';
}

export function bandOf(percent: number): IdeaScore['band'] {
  if (percent >= STRENGTH_AT) return 'strength';
  if (percent < NEEDS_WORK_BELOW) return 'needs-work';
  return 'developing';
}

/** Points per idea, from scored items only (reflection is excluded). Ideas keep item order. */
export function scoresByIdea(
  rows: ReadonlyArray<{ misconceptionId: MisconceptionId; points: number; maxPoints: number }>,
): IdeaScore[] {
  const map = new Map<MisconceptionId, { points: number; maxPoints: number }>();
  for (const r of rows) {
    if (r.maxPoints <= 0) continue;
    const acc = map.get(r.misconceptionId) ?? { points: 0, maxPoints: 0 };
    acc.points += r.points;
    acc.maxPoints += r.maxPoints;
    map.set(r.misconceptionId, acc);
  }
  return [...map].map(([id, { points, maxPoints }]) => {
    const percent = Math.round((points / maxPoints) * 1000) / 10;
    return { id, points, maxPoints, percent, band: bandOf(percent) };
  });
}

export interface ScoredItem {
  item: AssessmentItem;
  response: ItemResponse | undefined;
  check: ItemCheck;
  /** Points actually awarded (practice: only when correct on the first check). */
  points: number;
  tries: number;
}

export interface AttemptScore {
  items: ScoredItem[];
  score: number;
  maxScore: number;
  percent: number;
  ideas: IdeaScore[];
  unanswered: number;
}

/**
 * Scores a whole attempt.
 * - test mode: points for the submitted answers.
 * - practice mode: points only for items correct on the first check (tries[itemId] === 1), so the
 *   score reflects what the learner knew, while retries still let them learn.
 */
export function scoreAttempt(
  assessment: Assessment,
  responses: Readonly<Record<string, ItemResponse>>,
  tries: Readonly<Record<string, number>> = {},
): AttemptScore {
  const items = assessment.items.map((item): ScoredItem => {
    const response = responses[item.id];
    const check = checkItem(item, response);
    const t = assessment.mode === 'practice' ? (tries[item.id] ?? 0) : check.answered ? 1 : 0;
    const firstTime = assessment.mode === 'test' || t <= 1;
    return { item, response, check, points: firstTime ? check.points : 0, tries: t };
  });
  const score = items.reduce((a, r) => a + r.points, 0);
  const maxScore = items.reduce((a, r) => a + r.check.maxPoints, 0);
  return {
    items,
    score,
    maxScore,
    percent: maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0,
    ideas: scoresByIdea(
      items.map((r) => ({
        misconceptionId: r.item.misconceptionId,
        points: r.points,
        maxPoints: r.check.maxPoints,
      })),
    ),
    unanswered: items.filter((r) => !r.check.answered).length,
  };
}

/** The correct answer written out, for feedback after submission or after the last try. */
export function correctAnswerText(item: AssessmentItem): string {
  switch (item.kind) {
    case 'mcq': {
      const i = item.options.findIndex((o) => o.id === item.correctId);
      const o = item.options[i];
      return o ? `${String.fromCharCode(65 + i)}. ${o.label}` : '';
    }
    case 'truefalse':
      return item.answer ? 'True' : 'False';
    case 'numeric':
      return `${item.answer}${item.unit ? (item.unit === '%' ? '%' : ` ${item.unit}`) : ''}`;
    case 'matching':
      return item.pairs
        .map((p) => `${p.left} → ${item.choices.find((c) => c.id === p.rightId)?.label ?? ''}`)
        .join('; ');
    case 'reflection':
      return '';
  }
}

/** The learner's answer written out (for results and review). */
export function responseText(item: AssessmentItem, response: ItemResponse | undefined): string {
  if (response === undefined || !isAnswered(item, response)) {
    if (item.kind === 'numeric' && typeof response === 'string' && response.trim()) return response;
    return 'No answer';
  }
  switch (item.kind) {
    case 'mcq': {
      const i = item.options.findIndex((o) => o.id === response);
      const o = item.options[i];
      return o ? `${String.fromCharCode(65 + i)}. ${o.label}` : 'No answer';
    }
    case 'truefalse':
      return response ? 'True' : 'False';
    case 'numeric':
      return `${String(response).trim()}${item.unit ? (item.unit === '%' ? '%' : ` ${item.unit}`) : ''}`;
    case 'matching': {
      const r = response as Record<string, string>;
      return item.pairs
        .map((p) => `${p.left} → ${item.choices.find((c) => c.id === r[p.id])?.label ?? '?'}`)
        .join('; ');
    }
    case 'reflection':
      return String(response).trim();
  }
}
