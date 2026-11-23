import { appDb } from './db';

/**
 * Which local records have already been accepted by the online class, per learner, so a sync
 * only sends new ones. Re-sending is harmless anyway (the server ignores known ids).
 */
export interface SyncState {
  attemptIds: string[];
  eventIds: string[];
  lastSyncAt: string | null;
}

const key = (ownerId: string) => `sync:${ownerId}`;

export async function loadSyncState(ownerId: string): Promise<SyncState> {
  const v = (await (await appDb()).get('meta', key(ownerId))) as SyncState | undefined;
  return v ?? { attemptIds: [], eventIds: [], lastSyncAt: null };
}

export async function saveSyncState(ownerId: string, state: SyncState): Promise<void> {
  await (await appDb()).put('meta', state, key(ownerId));
}

export async function clearSyncState(ownerId: string): Promise<void> {
  await (await appDb()).delete('meta', key(ownerId));
}
