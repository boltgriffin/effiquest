export type ProgressEventKind =
  | 'lesson_opened'
  | 'lesson_completed'
  | 'activity_completed'
  | 'quest_stage'
  | 'assessment_submitted';

/** Append-only record; client-generated id makes later sync idempotent (docs/DATABASE_PLAN.md section 5). */
export interface ProgressEvent {
  id: string;
  ownerId: string;
  kind: ProgressEventKind;
  refId: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  ownerId: string;
  experimentId: string;
  beliefBefore: string;
  findingAfter: string;
  createdAt: string;
}
