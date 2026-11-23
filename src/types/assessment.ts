import type { MisconceptionId } from './content';

/**
 * Assessment model (docs/QUESTS_AND_ASSESSMENTS.md).
 * - test: baseline / post diagnostic (SRC-N1, SRC-T2, SRC-T7). No feedback until submitted.
 * - practice: quest knowledge checks (formative, SRC-N2). Feedback after each answer, retries.
 */
export type AssessmentKind = 'baseline' | 'post' | 'quest_check';
export type AssessmentMode = 'test' | 'practice';

/** Review status of drafted content (decision D-10: developer drafts, teacher approves). */
export type ContentStatus = 'draft' | 'approved';

interface ItemBase {
  id: string;
  prompt: string;
  /** Concept-note objective(s) the item checks, e.g. "SRC-O2". */
  objective: string;
  /** Misconception the item is designed to detect. */
  misconceptionId: MisconceptionId;
  /** Shown after answering: why the correct answer is correct. */
  explanation: string;
  status: ContentStatus;
}

export interface ChoiceOption {
  id: string;
  label: string;
  /** A wrong option can reveal which misconception the learner holds. */
  misconceptionId?: MisconceptionId;
}

export interface McqItem extends ItemBase {
  kind: 'mcq';
  options: ChoiceOption[];
  correctId: string;
}

export interface TrueFalseItem extends ItemBase {
  kind: 'truefalse';
  answer: boolean;
}

export interface MatchingItem extends ItemBase {
  kind: 'matching';
  /** Left-hand prompts; each must be matched to one right-hand choice. */
  pairs: Array<{ id: string; left: string; rightId: string }>;
  choices: Array<{ id: string; label: string }>;
}

export interface NumericItem extends ItemBase {
  kind: 'numeric';
  answer: number;
  /** Accepted absolute difference from the answer, in `unit`. */
  tolerance: number;
  unit: string;
}

export interface ReflectionItem extends Omit<ItemBase, 'explanation'> {
  kind: 'reflection';
  /** Minimum characters for the reflection to count as complete (not scored). */
  minChars: number;
  explanation?: string;
}

export type AssessmentItem = McqItem | TrueFalseItem | MatchingItem | NumericItem | ReflectionItem;

export interface Assessment {
  id: string;
  kind: AssessmentKind;
  mode: AssessmentMode;
  title: string;
  /** Bump when items change, so stored attempts stay interpretable. */
  version: string;
  /**
   * Show the correct answers and explanations in the results. Off for the baseline: the post
   * diagnostic repeats the same items, so revealing them would invalidate the comparison.
   */
  revealAnswers: boolean;
  items: AssessmentItem[];
}

/** A learner's answer to one item. Matching answers map pair id → choice id. */
export type ItemResponse = string | boolean | Record<string, string>;

export interface AttemptResponse {
  id: string;
  attemptId: string;
  itemId: string;
  /** JSON-encoded ItemResponse (final answer). */
  response: string;
  /** Correct on the first try (practice) or at submission (test). */
  isCorrect: boolean;
  /** Earned / max points for this item (partial credit for matching). */
  points: number;
  maxPoints: number;
  /** Number of checks used (practice); 1 for tests. */
  tries: number;
  /** The idea (SRC-G) the item targets: scores are reported per idea. */
  misconceptionId: MisconceptionId;
  /** The idea revealed by a chosen wrong option, if that option is tagged. */
  revealed?: MisconceptionId;
  answeredAt: string;
}

export interface Attempt {
  id: string;
  ownerId: string;
  assessmentId: string;
  assessmentVersion: string;
  kind: AssessmentKind;
  mode: AssessmentMode;
  startedAt: string;
  submittedAt: string;
  score: number;
  maxScore: number;
}

/**
 * Unsubmitted answers, saved while the learner works so a refresh or a closed tab loses nothing.
 * Working state, not a learner record: it is replaced on every change and deleted on submission.
 */
export interface AssessmentDraft {
  /** `${ownerId}:${assessmentId}` */
  key: string;
  ownerId: string;
  assessmentId: string;
  assessmentVersion: string;
  startedAt: string;
  updatedAt: string;
  /** Item on screen (equal to items.length for the review screen). */
  index: number;
  responses: Record<string, ItemResponse>;
  /** Practice: checks used per item. */
  tries: Record<string, number>;
  /** Practice: the answer (JSON) that was last checked, so its feedback can be shown again. */
  checked: Record<string, string>;
}
