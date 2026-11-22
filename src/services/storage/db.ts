import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Attempt,
  AttemptResponse,
  JournalEntry,
  LearnerExport,
  ProgressEvent,
  SimTrial,
} from '@/types';

/**
 * Local IndexedDB schema (subset of docs/DATABASE_PLAN.md section 4).
 * Learner records are append-only with client-generated ids, so later sync is an idempotent insert.
 */
export interface OutboxItem {
  id: string;
  store: LearnerStore;
  payload: unknown;
  state: 'pending' | 'failed';
  tries: number;
  lastError?: string;
}

/** A learner results file imported on the teacher's device (decision D-15). */
export interface ClassImport {
  learnerCode: string;
  importedAt: string;
  data: LearnerExport;
}

export interface EffiQuestDB extends DBSchema {
  settings: { key: string; value: unknown };
  attempts: { key: string; value: Attempt; indexes: { byOwner: string } };
  attempt_responses: { key: string; value: AttemptResponse };
  sim_trials: { key: string; value: SimTrial; indexes: { byOwner: string } };
  journal: { key: string; value: JournalEntry; indexes: { byOwner: string } };
  progress_events: { key: string; value: ProgressEvent; indexes: { byOwner: string } };
  outbox: { key: string; value: OutboxItem };
  meta: { key: string; value: unknown };
  class_imports: { key: string; value: ClassImport };
}

export type LearnerStore =
  'attempts' | 'attempt_responses' | 'sim_trials' | 'journal' | 'progress_events';

export const DB_NAME = 'effiquest';
export const DB_VERSION = 2;

export function openEffiQuestDb(name: string = DB_NAME): Promise<IDBPDatabase<EffiQuestDB>> {
  return openDB<EffiQuestDB>(name, DB_VERSION, {
    // One `if (oldVersion < N)` block per schema change, each covered by a test.
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('settings');
        db.createObjectStore('attempt_responses', { keyPath: 'id' });
        db.createObjectStore('outbox', { keyPath: 'id' });
        db.createObjectStore('meta');
        for (const store of ['attempts', 'sim_trials', 'journal', 'progress_events'] as const) {
          db.createObjectStore(store, { keyPath: 'id' }).createIndex('byOwner', 'ownerId');
        }
      }
      if (oldVersion < 2) {
        db.createObjectStore('class_imports', { keyPath: 'learnerCode' });
      }
    },
  });
}

let shared: ReturnType<typeof openEffiQuestDb> | null = null;

/** The app's single shared connection. */
export function appDb(): ReturnType<typeof openEffiQuestDb> {
  shared ??= openEffiQuestDb();
  return shared;
}
