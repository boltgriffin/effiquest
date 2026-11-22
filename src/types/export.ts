import type { ProgressEvent } from './progress';

/** Results file a learner's device exports for the teacher (decision D-15). Versioned. */
export interface LearnerExport {
  format: 'effiquest-learner-results';
  version: 1;
  exportedAt: string;
  learnerCode: string;
  progressEvents: ProgressEvent[];
  /**
   * Diagnostic scores per misconception (percent), once diagnostics exist.
   * Empty in version 1 files produced before the diagnostic is built.
   */
  diagnostics: {
    baseline?: Partial<Record<string, number>>;
    post?: Partial<Record<string, number>>;
  };
}
