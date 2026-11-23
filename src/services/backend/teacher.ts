import type { Attempt, AttemptResponse, ItemResponse, ProgressEvent } from '@/types';
import { BackendError, getBackend, toBackendError, unwrap, type Backend } from './client';
import type { AttemptRow, ClassRow, EnrollmentRow } from './database.types';
import { checkClassName, checkSchoolYear } from './validation';

/** Teacher data access. Every query is limited by RLS to the teacher's own classes. */

export type CloudClass = Pick<
  ClassRow,
  'id' | 'name' | 'school_year' | 'join_code' | 'archived_at'
>;

export async function listClasses(): Promise<CloudClass[]> {
  const sb = await getBackend();
  return unwrap(
    await sb
      .from('classes')
      .select('id, name, school_year, join_code, archived_at')
      .is('archived_at', null)
      .order('created_at'),
  );
}

export async function createClass(name: string, schoolYear: string): Promise<CloudClass> {
  const n = checkClassName(name);
  if (!n.ok) throw new BackendError('invalid', n.error);
  const y = checkSchoolYear(schoolYear);
  if (!y.ok) throw new BackendError('invalid', y.error);
  const sb = await getBackend();
  return unwrap(
    await sb
      .from('classes')
      .insert({ name: n.value, school_year: y.value })
      .select('id, name, school_year, join_code, archived_at')
      .single(),
  );
}

/** Archiving closes the class to new learners and ends the teacher's access to its records. */
export async function archiveClass(classId: string): Promise<void> {
  const sb = await getBackend();
  const { error } = await sb
    .from('classes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', classId);
  if (error) throw toBackendError(error);
}

export type RosterEntry = Pick<EnrollmentRow, 'learner_id' | 'learner_code' | 'joined_at'>;

export async function roster(classId: string): Promise<RosterEntry[]> {
  const sb = await getBackend();
  return unwrap(
    await sb
      .from('enrollments')
      .select('learner_id, learner_code, joined_at')
      .eq('class_id', classId)
      .order('learner_code'),
  );
}

export async function removeLearner(classId: string, learnerId: string): Promise<void> {
  const sb = await getBackend();
  const { error } = await sb
    .from('enrollments')
    .delete()
    .eq('class_id', classId)
    .eq('learner_id', learnerId);
  if (error) throw toBackendError(error);
}

/** Reads every row of a query in pages (PostgREST returns at most 1000 rows per request). */
async function fetchAll<T>(
  page: (
    sb: Backend,
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const sb = await getBackend();
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const rows = unwrap(await page(sb, from, from + size - 1));
    out.push(...rows);
    if (rows.length < size) return out;
  }
}

/** One learner's synced records, in the app's own types. */
export interface LearnerCloudRecords {
  learnerCode: string;
  events: ProgressEvent[];
  attempts: Attempt[];
  responses: Record<string, AttemptResponse[]>;
}

function parseStoredResponse(v: unknown): ItemResponse | null {
  if (typeof v === 'string' || typeof v === 'boolean') return v;
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, string>;
  return null;
}

/** Everything the class's learners have synced, grouped per learner code. */
export async function classRecords(classId: string): Promise<LearnerCloudRecords[]> {
  const learners = await roster(classId);
  if (learners.length === 0) return [];
  const ids = learners.map((l) => l.learner_id);
  const codeOf = new Map(learners.map((l) => [l.learner_id, l.learner_code]));

  const [events, attempts, responses] = await Promise.all([
    fetchAll((sb, a, b) =>
      sb.from('progress_events').select('*').in('owner_id', ids).order('created_at').range(a, b),
    ),
    fetchAll((sb, a, b) =>
      sb.from('attempts').select('*').in('owner_id', ids).order('submitted_at').range(a, b),
    ),
    fetchAll((sb, a, b) =>
      sb.from('attempt_responses').select('*').in('owner_id', ids).order('id').range(a, b),
    ),
  ]);

  const byLearner = new Map<string, LearnerCloudRecords>(
    learners.map((l) => [
      l.learner_id,
      { learnerCode: l.learner_code, events: [], attempts: [], responses: {} },
    ]),
  );
  for (const e of events) {
    byLearner.get(e.owner_id)?.events.push({
      id: e.id,
      ownerId: codeOf.get(e.owner_id) ?? '',
      kind: e.kind,
      refId: e.ref_id,
      createdAt: e.created_at,
    });
  }
  for (const a of attempts as AttemptRow[]) {
    byLearner.get(a.owner_id)?.attempts.push({
      id: a.id,
      ownerId: codeOf.get(a.owner_id) ?? '',
      assessmentId: a.assessment_id,
      assessmentVersion: a.assessment_version,
      kind: a.kind,
      mode: a.mode,
      startedAt: a.started_at,
      submittedAt: a.submitted_at,
      score: a.score,
      maxScore: a.max_score,
    });
  }
  for (const r of responses) {
    const rec = byLearner.get(r.owner_id);
    if (!rec) continue;
    (rec.responses[r.attempt_id] ??= []).push({
      id: r.id,
      attemptId: r.attempt_id,
      itemId: r.item_id,
      response: JSON.stringify(parseStoredResponse(r.response)),
      isCorrect: r.is_correct,
      points: r.points,
      maxPoints: r.max_points,
      tries: r.tries,
      misconceptionId: r.misconception_id as AttemptResponse['misconceptionId'],
      ...(r.revealed ? { revealed: r.revealed as AttemptResponse['misconceptionId'] } : {}),
      answeredAt: r.answered_at,
    });
  }
  return [...byLearner.values()];
}
