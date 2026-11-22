import type { SimTrial } from '@/types';
import { appDb } from './db';

type Listener = () => void;
const listeners = new Set<Listener>();

export function onTrialsChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Recorded trials are append-only, like all learner records. */
export async function saveTrial(trial: SimTrial): Promise<void> {
  await (await appDb()).put('sim_trials', trial);
  listeners.forEach((l) => l());
}

export async function listTrials(ownerId: string, experimentId: string): Promise<SimTrial[]> {
  const all = await (await appDb()).getAllFromIndex('sim_trials', 'byOwner', ownerId);
  return all
    .filter((t) => t.experimentId === experimentId)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}
