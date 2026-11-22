import type { JournalEntry } from '@/types';
import { appDb } from './db';

export async function saveJournalEntry(
  ownerId: string,
  input: Pick<JournalEntry, 'experimentId' | 'beliefBefore' | 'findingAfter'>,
): Promise<JournalEntry> {
  const entry: JournalEntry = {
    ...input,
    id: crypto.randomUUID(),
    ownerId,
    createdAt: new Date().toISOString(),
  };
  await (await appDb()).put('journal', entry);
  return entry;
}
