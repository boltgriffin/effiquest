import type { MisconceptionId } from './content';

export type AssessmentKind = 'baseline' | 'weekly' | 'post' | 'performance_task';
export type ItemType = 'mcq' | 'numeric' | 'short';

export interface ItemOption {
  id: string;
  label: string;
  /** Wrong answers can reveal which misconception the learner holds. */
  misconceptionId?: MisconceptionId;
}

export interface AssessmentItem {
  id: string;
  type: ItemType;
  stem: string;
  unit?: string;
  options?: ItemOption[];
  order: number;
}

export interface Assessment {
  id: string;
  kind: AssessmentKind;
  title: string;
  items: AssessmentItem[];
}

export interface AttemptResponse {
  id: string;
  itemId: string;
  response: string | number;
  isCorrect: boolean;
  misconceptionId?: MisconceptionId;
  answeredAt: string;
}

export interface Attempt {
  id: string;
  ownerId: string;
  assessmentId: string;
  packVersion: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  mode: 'local' | 'server_graded';
}
