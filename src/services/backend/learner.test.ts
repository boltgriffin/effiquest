import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitAttempt } from '@/services/storage/attempts';
import { recordProgress } from '@/services/storage/progress';
import { loadSyncState } from '@/services/storage/syncState';
import type { Attempt, AttemptResponse } from '@/types';
import type * as ClientModule from './client';

/** A fake Supabase client recording what the sync sends. */
const sent = {
  rpc: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  upserts: [] as unknown[][],
};
let rpcError: ((args: Record<string, unknown>) => unknown) | null = null;

vi.mock('./client', async (orig) => {
  const actual = await orig<typeof ClientModule>();
  const fake = {
    rpc: (fn: string, args: Record<string, unknown>) => {
      sent.rpc.push({ fn, args });
      return Promise.resolve({ data: true, error: rpcError?.(args) ?? null });
    },
    from: () => ({
      upsert: (rows: unknown[]) => {
        sent.upserts.push(rows);
        return Promise.resolve({ error: null });
      },
    }),
  };
  return { ...actual, getBackend: () => Promise.resolve(fake) };
});

const { syncLearnerData } = await import('./learner');

async function localAttempt(owner: string, assessmentId: string) {
  const at = new Date().toISOString();
  const attempt: Attempt = {
    id: crypto.randomUUID(),
    ownerId: owner,
    assessmentId,
    assessmentVersion: '1.0.0-draft',
    kind: 'quest_check',
    mode: 'practice',
    startedAt: at,
    submittedAt: at,
    score: 1,
    maxScore: 3,
  };
  const responses: AttemptResponse[] = ['q1-1', 'q1-2', 'q1-3'].map((itemId, i) => ({
    id: crypto.randomUUID(),
    attemptId: attempt.id,
    itemId,
    response: '"a"',
    isCorrect: i === 0,
    points: i === 0 ? 1 : 0,
    maxPoints: 1,
    tries: 1,
    misconceptionId: 'G2',
    answeredAt: at,
  }));
  await submitAttempt(attempt, responses);
  return attempt;
}

describe('syncLearnerData', () => {
  beforeEach(() => {
    sent.rpc = [];
    sent.upserts = [];
    rpcError = null;
  });

  it('sends new attempts (via the validating RPC) and events once, then only new ones', async () => {
    const a = await localAttempt('S-01', 'check-effort-vs-efficiency');
    await recordProgress('S-01', 'lesson_completed', 'torque');

    const first = await syncLearnerData('S-01');
    expect(first).toMatchObject({ attemptsSent: 1, eventsSent: 2, rejected: [] });
    expect(sent.rpc[0]?.fn).toBe('submit_attempt');
    expect((sent.rpc[0]?.args.p_attempt as { id: string }).id).toBe(a.id);
    expect((sent.rpc[0]?.args.p_responses as unknown[]).length).toBe(3);
    // Events carry no owner id: the server sets it from the session.
    expect(sent.upserts[0]?.[0]).not.toHaveProperty('owner_id');

    const second = await syncLearnerData('S-01');
    expect(second).toMatchObject({ attemptsSent: 0, eventsSent: 0 });
    expect((await loadSyncState('S-01')).attemptIds).toContain(a.id);
  });

  it('reports a refused attempt without stopping the others', async () => {
    await localAttempt('S-02', 'check-effort-vs-efficiency');
    await localAttempt('S-02', 'check-effort-vs-efficiency');
    let calls = 0;
    rpcError = () =>
      ++calls === 1 ? { code: '22023', message: 'These answers are for an older version.' } : null;
    const report = await syncLearnerData('S-02');
    expect(report.attemptsSent).toBe(1);
    expect(report.rejected).toEqual([
      { attemptId: expect.any(String), reason: 'These answers are for an older version.' },
    ]);
  });

  it('stops on a network error and keeps nothing marked as sent', async () => {
    await localAttempt('S-03', 'check-effort-vs-efficiency');
    rpcError = () => ({ message: 'Failed to fetch' });
    await expect(syncLearnerData('S-03')).rejects.toMatchObject({ kind: 'offline' });
    expect((await loadSyncState('S-03')).attemptIds).toEqual([]);
  });
});
