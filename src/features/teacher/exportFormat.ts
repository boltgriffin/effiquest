import { misconceptions } from '@/content/misconceptions';
import { summarize } from '@/content/progress';
import type { LearnerExport, ProgressEvent, ProgressEventKind } from '@/types';

const KINDS: readonly ProgressEventKind[] = [
  'lesson_completed',
  'activity_completed',
  'quest_stage',
  'assessment_submitted',
];

export function buildLearnerExport(
  learnerCode: string,
  progressEvents: ProgressEvent[],
  now: Date = new Date(),
): LearnerExport {
  return {
    format: 'effiquest-learner-results',
    version: 1,
    exportedAt: now.toISOString(),
    learnerCode,
    progressEvents,
    diagnostics: {},
  };
}

export type ParseResult = { ok: true; data: LearnerExport } | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Validates an imported file. Files come from learners' devices, so nothing is trusted. */
export function parseLearnerExport(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not an EffiQuest results file (not valid JSON).' };
  }
  if (!isObject(raw) || raw.format !== 'effiquest-learner-results') {
    return { ok: false, error: 'This file is not an EffiQuest results file.' };
  }
  if (raw.version !== 1) {
    return { ok: false, error: 'This results file comes from a newer version of EffiQuest.' };
  }
  if (typeof raw.learnerCode !== 'string' || !/^[A-Z0-9-]{3,16}$/.test(raw.learnerCode)) {
    return { ok: false, error: 'The file has no valid learner code.' };
  }
  if (!Array.isArray(raw.progressEvents)) {
    return { ok: false, error: 'The file has no progress records.' };
  }
  const events: ProgressEvent[] = [];
  for (const e of raw.progressEvents) {
    if (
      !isObject(e) ||
      typeof e.id !== 'string' ||
      typeof e.refId !== 'string' ||
      typeof e.createdAt !== 'string' ||
      !KINDS.includes(e.kind as ProgressEventKind) ||
      Number.isNaN(Date.parse(e.createdAt))
    ) {
      return { ok: false, error: 'The file contains a damaged progress record.' };
    }
    events.push({
      id: e.id,
      ownerId: raw.learnerCode,
      kind: e.kind as ProgressEventKind,
      refId: e.refId,
      createdAt: e.createdAt,
    });
  }
  const diag = isObject(raw.diagnostics) ? raw.diagnostics : {};
  const scores = (v: unknown) => {
    if (!isObject(v)) return undefined;
    const out: Record<string, number> = {};
    for (const m of misconceptions) {
      const s = v[m.id];
      if (typeof s === 'number' && s >= 0 && s <= 100) out[m.id] = s;
    }
    return out;
  };
  const baseline = scores(diag.baseline);
  const post = scores(diag.post);
  return {
    ok: true,
    data: {
      format: 'effiquest-learner-results',
      version: 1,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      learnerCode: raw.learnerCode,
      progressEvents: events,
      diagnostics: { ...(baseline ? { baseline } : {}), ...(post ? { post } : {}) },
    },
  };
}

export interface LearnerRow {
  learnerCode: string;
  modulesDone: number;
  labsDone: number;
  questsDone: number;
  lastActivity: string | null;
  baseline: Partial<Record<string, number>>;
  post: Partial<Record<string, number>>;
}

export function toLearnerRow(data: LearnerExport): LearnerRow {
  const s = summarize(data.progressEvents);
  const last = data.progressEvents.reduce<string | null>(
    (acc, e) => (acc === null || e.createdAt > acc ? e.createdAt : acc),
    null,
  );
  return {
    learnerCode: data.learnerCode,
    modulesDone: s.modulesDone,
    labsDone: s.labsDone,
    questsDone: s.questsDone,
    lastActivity: last,
    baseline: data.diagnostics.baseline ?? {},
    post: data.diagnostics.post ?? {},
  };
}

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

const cell = (v: number | null | undefined, digits = 1): string =>
  v === null || v === undefined ? '' : Number.isInteger(v) ? String(v) : v.toFixed(digits);

/** Escapes a CSV field and neutralises spreadsheet formula injection. */
function csvField(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Class CSV for the Master Teacher I report (decision D-15): one row per learner with completions,
 * baseline/post score per misconception (G1-G6) and change; a final CLASS AVERAGE row.
 */
export function classCsv(rows: readonly LearnerRow[]): string {
  const ids = misconceptions.map((m) => m.id);
  const header = [
    'learner_code',
    'modules_completed',
    'labs_completed',
    'quests_completed',
    ...ids.map((id) => `baseline_${id}`),
    ...ids.map((id) => `post_${id}`),
    ...ids.map((id) => `change_${id}`),
    'last_activity',
  ];
  const change = (r: LearnerRow, id: string) => {
    const b = r.baseline[id];
    const p = r.post[id];
    return b === undefined || p === undefined ? undefined : p - b;
  };
  const lines = rows.map((r) =>
    [
      csvField(r.learnerCode),
      cell(r.modulesDone),
      cell(r.labsDone),
      cell(r.questsDone),
      ...ids.map((id) => cell(r.baseline[id])),
      ...ids.map((id) => cell(r.post[id])),
      ...ids.map((id) => cell(change(r, id))),
      r.lastActivity ?? '',
    ].join(','),
  );
  const avg = (pick: (r: LearnerRow) => number | undefined) =>
    cell(mean(rows.map(pick).filter((v): v is number => v !== undefined)));
  const average = [
    'CLASS AVERAGE',
    avg((r) => r.modulesDone),
    avg((r) => r.labsDone),
    avg((r) => r.questsDone),
    ...ids.map((id) => avg((r) => r.baseline[id])),
    ...ids.map((id) => avg((r) => r.post[id])),
    ...ids.map((id) => avg((r) => change(r, id))),
    '',
  ].join(',');
  return [header.join(','), ...lines, average].join('\n') + '\n';
}

/** Triggers a browser download of a text file. */
export function downloadText(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
