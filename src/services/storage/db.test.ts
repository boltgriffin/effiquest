import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { openEffiQuestDb } from './db';
import type { ProgressEvent } from '@/types';

let counter = 0;
const uniqueName = () => `effiquest-test-${counter++}`;

describe('openEffiQuestDb', () => {
  const opened: Array<{ close: () => void }> = [];
  afterEach(() => {
    opened.splice(0).forEach((db) => db.close());
  });

  it('creates every planned object store', async () => {
    const db = await openEffiQuestDb(uniqueName());
    opened.push(db);
    expect([...db.objectStoreNames].sort()).toEqual(
      [
        'attempt_responses',
        'attempts',
        'class_imports',
        'journal',
        'meta',
        'outbox',
        'progress_events',
        'settings',
        'sim_trials',
      ].sort(),
    );
  });

  it('round-trips a record and queries it by owner', async () => {
    const db = await openEffiQuestDb(uniqueName());
    opened.push(db);
    const event: ProgressEvent = {
      id: 'e1',
      ownerId: 'learner-1',
      kind: 'lesson_completed',
      refId: 'lesson-1',
      createdAt: '2026-11-22T00:00:00.000Z',
    };
    await db.put('progress_events', event);
    expect(await db.getAllFromIndex('progress_events', 'byOwner', 'learner-1')).toEqual([event]);
    expect(await db.getAllFromIndex('progress_events', 'byOwner', 'someone-else')).toEqual([]);
  });

  it('upgrades a version 1 database without losing learner records', async () => {
    const name = uniqueName();
    // Recreate the Milestone 02 (v1) schema with one stored event.
    const v1 = await openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore('settings');
        db.createObjectStore('attempt_responses', { keyPath: 'id' });
        db.createObjectStore('outbox', { keyPath: 'id' });
        db.createObjectStore('meta');
        for (const store of ['attempts', 'sim_trials', 'journal', 'progress_events']) {
          db.createObjectStore(store, { keyPath: 'id' }).createIndex('byOwner', 'ownerId');
        }
      },
    });
    await v1.put('progress_events', {
      id: 'old',
      ownerId: 'A-01',
      kind: 'lesson_completed',
      refId: 'torque',
      createdAt: '2026-11-22T00:00:00.000Z',
    });
    v1.close();

    const db = await openEffiQuestDb(name);
    opened.push(db);
    expect(db.objectStoreNames.contains('class_imports')).toBe(true);
    expect(await db.get('progress_events', 'old')).toMatchObject({ refId: 'torque' });
  });
});
