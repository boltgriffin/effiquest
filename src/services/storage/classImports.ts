import type { LearnerExport } from '@/types';
import { appDb, type ClassImport } from './db';

export async function listClassImports(): Promise<ClassImport[]> {
  const rows = await (await appDb()).getAll('class_imports');
  return rows.sort((a, b) => a.learnerCode.localeCompare(b.learnerCode));
}

/** Saves one learner's file. A newer file for the same learner code replaces the older one. */
export async function saveClassImport(data: LearnerExport): Promise<void> {
  await (
    await appDb()
  ).put('class_imports', {
    learnerCode: data.learnerCode,
    importedAt: new Date().toISOString(),
    data,
  });
}

export async function removeClassImport(learnerCode: string): Promise<void> {
  await (await appDb()).delete('class_imports', learnerCode);
}

export async function clearClassImports(): Promise<void> {
  await (await appDb()).clear('class_imports');
}
