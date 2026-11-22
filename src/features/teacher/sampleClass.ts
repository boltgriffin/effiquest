import type { LearnerExport, ProgressEvent } from '@/types';

/**
 * Invented class for previewing the teacher dashboard ("Sample data" badge). Never stored.
 * Learner codes are pseudonyms in the format a teacher might issue.
 */
function events(
  code: string,
  items: Array<[ProgressEvent['kind'], string, number]>,
): ProgressEvent[] {
  return items.map(([kind, refId, hoursAgo], i) => ({
    id: `${code}-${i}`,
    ownerId: code,
    kind,
    refId,
    createdAt: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  }));
}

function learner(
  code: string,
  items: Array<[ProgressEvent['kind'], string, number]>,
  baseline: Record<string, number>,
  post?: Record<string, number>,
): LearnerExport {
  return {
    format: 'effiquest-learner-results',
    version: 1,
    exportedAt: new Date().toISOString(),
    learnerCode: code,
    progressEvents: events(code, items),
    diagnostics: { baseline, ...(post ? { post } : {}) },
  };
}

export function sampleClass(): LearnerExport[] {
  return [
    learner(
      'G11A-01',
      [
        ['lesson_completed', 'advantage-efficiency', 30],
        ['activity_completed', 'incline', 28],
        ['quest_stage', 'effort-vs-efficiency:reflect', 27],
        ['lesson_completed', 'torque', 3],
      ],
      { G1: 40, G2: 25, G3: 50, G4: 20, G5: 40, G6: 33 },
    ),
    learner(
      'G11A-02',
      [
        ['lesson_completed', 'advantage-efficiency', 50],
        ['lesson_completed', 'efficiency-practice', 26],
      ],
      { G1: 20, G2: 25, G3: 33, G4: 40, G5: 60, G6: 33 },
    ),
    learner('G11A-03', [], { G1: 60, G2: 50, G3: 33, G4: 20, G5: 20, G6: 67 }),
    learner(
      'G11A-04',
      [
        ['lesson_completed', 'hydraulics', 72],
        ['quest_stage', 'pressure-at-work:reflect', 70],
        ['lesson_completed', 'advantage-efficiency', 6],
        ['activity_completed', 'incline', 1],
      ],
      { G1: 40, G2: 0, G3: 67, G4: 20, G5: 40, G6: 50 },
    ),
  ];
}
