import type { ProgressEvent, ProgressEventKind } from '@/types';
import { appDb } from './db';

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to "progress changed" so open screens refresh after a write. */
export function onProgressChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Tells open screens that progress or assessment records changed. */
export function emitProgressChange(): void {
  listeners.forEach((l) => l());
}

export async function listProgress(ownerId: string): Promise<ProgressEvent[]> {
  const events = await (await appDb()).getAllFromIndex('progress_events', 'byOwner', ownerId);
  return events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Append a progress event. Events are never edited; repeats are allowed and harmless. */
export async function recordProgress(
  ownerId: string,
  kind: ProgressEventKind,
  refId: string,
): Promise<ProgressEvent> {
  const event: ProgressEvent = {
    id: crypto.randomUUID(),
    ownerId,
    kind,
    refId,
    createdAt: new Date().toISOString(),
  };
  await (await appDb()).put('progress_events', event);
  emitProgressChange();
  return event;
}
