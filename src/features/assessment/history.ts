import type {
  Assessment,
  AssessmentKind,
  Attempt,
  AttemptResponse,
  ItemResponse,
  MisconceptionId,
} from '@/types';
import { scoreAttempt, scoresByIdea, type AttemptScore } from './scoring';

/** Pure helpers that turn stored attempts back into results (no React, no storage). */

function parseResponse(json: string): ItemResponse | undefined {
  try {
    const v: unknown = JSON.parse(json);
    if (typeof v === 'string' || typeof v === 'boolean') return v;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(
        Object.entries(v).filter((e): e is [string, string] => typeof e[1] === 'string'),
      );
    }
  } catch {
    // A damaged row counts as "no answer".
  }
  return undefined;
}

/**
 * Rebuilds the results of a stored attempt. Returns null when the items have changed since
 * (different version): the stored totals are still valid, but item-by-item review is not.
 */
export function restoreAttempt(
  assessment: Assessment,
  attempt: Attempt,
  rows: readonly AttemptResponse[],
): AttemptScore | null {
  if (attempt.assessmentVersion !== assessment.version) return null;
  const responses: Record<string, ItemResponse> = {};
  const tries: Record<string, number> = {};
  for (const r of rows) {
    const v = parseResponse(r.response);
    if (v !== undefined) responses[r.itemId] = v;
    tries[r.itemId] = r.tries;
  }
  return scoreAttempt(assessment, responses, tries);
}

/** The learner's attempts at one assessment, newest first. */
export function attemptsFor(attempts: readonly Attempt[], assessmentId: string): Attempt[] {
  return attempts
    .filter((a) => a.assessmentId === assessmentId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/**
 * Percent per idea (G1..G6) for the FIRST submitted diagnostic of a kind (the one that counts for
 * the baseline/post comparison, decision D-15). Computed from the stored points, so it does not
 * depend on later item changes. Undefined if that diagnostic was not taken.
 */
export function diagnosticPercents(
  attempts: readonly Attempt[],
  responses: Readonly<Record<string, readonly AttemptResponse[]>>,
  kind: Extract<AssessmentKind, 'baseline' | 'post'>,
): Partial<Record<MisconceptionId, number>> | undefined {
  const first = [...attempts]
    .filter((a) => a.kind === kind)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))[0];
  if (!first) return undefined;
  const out: Partial<Record<MisconceptionId, number>> = {};
  for (const s of scoresByIdea(responses[first.id] ?? [])) out[s.id] = s.percent;
  return out;
}
