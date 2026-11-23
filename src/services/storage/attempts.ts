import type { AssessmentDraft, Attempt, AttemptResponse, ProgressEvent } from '@/types';
import { appDb } from './db';
import { emitProgressChange } from './progress';

/** Submitted attempts for one learner, oldest first. */
export async function listAttempts(ownerId: string): Promise<Attempt[]> {
  const rows = await (await appDb()).getAllFromIndex('attempts', 'byOwner', ownerId);
  return rows.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export async function listResponses(attemptId: string): Promise<AttemptResponse[]> {
  return (await appDb()).getAllFromIndex('attempt_responses', 'byAttempt', attemptId);
}

/** Responses for many attempts at once, keyed by attempt id. */
export async function listResponsesFor(
  attemptIds: readonly string[],
): Promise<Record<string, AttemptResponse[]>> {
  const db = await appDb();
  const tx = db.transaction('attempt_responses');
  const index = tx.store.index('byAttempt');
  const out: Record<string, AttemptResponse[]> = {};
  await Promise.all(
    attemptIds.map(async (id) => {
      out[id] = await index.getAll(id);
    }),
  );
  await tx.done;
  return out;
}

/**
 * Saves a submitted attempt in ONE transaction: the attempt, its responses, the
 * `assessment_submitted` progress event, and removal of the draft. Either all of it is stored or
 * none of it, so progress can never show a submission whose answers are missing.
 */
export async function submitAttempt(
  attempt: Attempt,
  responses: readonly AttemptResponse[],
): Promise<void> {
  const db = await appDb();
  const tx = db.transaction(
    ['attempts', 'attempt_responses', 'progress_events', 'assessment_drafts'],
    'readwrite',
  );
  const event: ProgressEvent = {
    id: crypto.randomUUID(),
    ownerId: attempt.ownerId,
    kind: 'assessment_submitted',
    refId: attempt.assessmentId,
    createdAt: attempt.submittedAt,
  };
  await Promise.all([
    tx.objectStore('attempts').put(attempt),
    ...responses.map((r) => tx.objectStore('attempt_responses').put(r)),
    tx.objectStore('progress_events').put(event),
    tx.objectStore('assessment_drafts').delete(draftKey(attempt.ownerId, attempt.assessmentId)),
    tx.done,
  ]);
  emitProgressChange();
}

export const draftKey = (ownerId: string, assessmentId: string) => `${ownerId}:${assessmentId}`;

export async function loadDraft(
  ownerId: string,
  assessmentId: string,
): Promise<AssessmentDraft | undefined> {
  return (await appDb()).get('assessment_drafts', draftKey(ownerId, assessmentId));
}

export async function saveDraft(draft: AssessmentDraft): Promise<void> {
  await (await appDb()).put('assessment_drafts', draft);
}

export async function deleteDraft(ownerId: string, assessmentId: string): Promise<void> {
  await (await appDb()).delete('assessment_drafts', draftKey(ownerId, assessmentId));
}

/** Drafts in progress for one learner (to show "continue" on the Assess page). */
export async function listDrafts(ownerId: string): Promise<AssessmentDraft[]> {
  const all = await (await appDb()).getAll('assessment_drafts');
  return all.filter((d) => d.ownerId === ownerId);
}
