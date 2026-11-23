import { listAttempts, listResponsesFor } from '@/services/storage/attempts';
import { listProgress } from '@/services/storage/progress';
import { clearSyncState, loadSyncState, saveSyncState } from '@/services/storage/syncState';
import type { Attempt, AttemptResponse } from '@/types';
import { signOut } from './auth';
import { getBackend, toBackendError, unwrap } from './client';

export interface LearnerClass {
  classId: string;
  className: string;
  learnerCode: string;
}

/** The class this device's learner session belongs to, or null if not joined / signed out. */
export async function myClass(): Promise<LearnerClass | null> {
  const sb = await getBackend();
  const { data } = await sb.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;
  const enrollments = unwrap(
    await sb.from('enrollments').select('class_id, learner_code').eq('learner_id', uid).limit(1),
  );
  const e = enrollments[0];
  if (!e) return null;
  const classes = unwrap(await sb.from('classes').select('name').eq('id', e.class_id).limit(1));
  return { classId: e.class_id, className: classes[0]?.name ?? '', learnerCode: e.learner_code };
}

export interface SyncReport {
  attemptsSent: number;
  eventsSent: number;
  /** Attempts the server refused, with a learner-safe reason. */
  rejected: Array<{ attemptId: string; reason: string }>;
  at: string;
}

const toServerAttempt = (a: Attempt) => ({
  id: a.id,
  assessmentId: a.assessmentId,
  assessmentVersion: a.assessmentVersion,
  kind: a.kind,
  mode: a.mode,
  startedAt: a.startedAt,
  submittedAt: a.submittedAt,
  score: a.score,
  maxScore: a.maxScore,
});

const toServerResponse = (r: AttemptResponse) => ({
  id: r.id,
  itemId: r.itemId,
  response: r.response,
  isCorrect: r.isCorrect,
  points: r.points,
  maxPoints: r.maxPoints,
  tries: r.tries,
  misconceptionId: r.misconceptionId,
  ...(r.revealed ? { revealed: r.revealed } : {}),
  answeredAt: r.answeredAt,
});

/**
 * Sends this learner's new attempts and progress events to the online class. Journals and lab
 * trials stay on the device (free text and detailed data are not needed by the teacher view).
 * A refused attempt does not stop the others; network errors stop the sync and keep state.
 */
export async function syncLearnerData(ownerId: string): Promise<SyncReport> {
  const sb = await getBackend();
  const state = await loadSyncState(ownerId);
  const sentAttempts = new Set(state.attemptIds);
  const sentEvents = new Set(state.eventIds);

  const [attempts, events] = await Promise.all([listAttempts(ownerId), listProgress(ownerId)]);
  const newAttempts = attempts.filter((a) => !sentAttempts.has(a.id));
  const responses = await listResponsesFor(newAttempts.map((a) => a.id));
  const rejected: SyncReport['rejected'] = [];
  let attemptsSent = 0;

  // Attempts go through submit_attempt (validated on the server). Their `assessment_submitted`
  // events are sent below with the other events, so the teacher sees the same log as the device.
  for (const a of newAttempts) {
    const { error } = await sb.rpc('submit_attempt', {
      p_attempt: toServerAttempt(a),
      p_responses: (responses[a.id] ?? []).map(toServerResponse),
    });
    if (error) {
      const e = toBackendError(error);
      if (e.kind === 'offline' || e.kind === 'not-signed-in' || e.kind === 'unknown') throw e;
      rejected.push({ attemptId: a.id, reason: e.message });
    } else {
      attemptsSent++;
    }
    sentAttempts.add(a.id); // refused ones are not retried forever; the reason is reported once
  }

  const newEvents = events.filter((e) => !sentEvents.has(e.id));
  for (let i = 0; i < newEvents.length; i += 200) {
    const batch = newEvents.slice(i, i + 200);
    const { error } = await sb.from('progress_events').upsert(
      batch.map((e) => ({ id: e.id, kind: e.kind, ref_id: e.refId, created_at: e.createdAt })),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error) throw toBackendError(error);
    batch.forEach((e) => sentEvents.add(e.id));
  }

  const at = new Date().toISOString();
  await saveSyncState(ownerId, {
    attemptIds: [...sentAttempts],
    eventIds: [...sentEvents],
    lastSyncAt: at,
  });
  return { attemptsSent, eventsSent: newEvents.length, rejected, at };
}

/** Removes everything the server holds about this learner, then signs out on this device. */
export async function deleteMyCloudData(ownerId: string): Promise<void> {
  const sb = await getBackend();
  const { error } = await sb.rpc('delete_my_cloud_data');
  if (error) throw toBackendError(error);
  await clearSyncState(ownerId);
  await signOut();
}
