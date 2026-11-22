import type { ItemOption, MisconceptionId } from '@/types';

/**
 * SAMPLE items for reviewing the assessment layout only. They are NOT the EffiQuest diagnostic:
 * the real baseline/post items are to be written and validated by the teacher (decision D-10).
 * Physics in them follows docs/PHYSICS_MODEL_PLAN.md.
 */
export type SampleItem =
  | {
      id: string;
      type: 'mcq';
      stem: string;
      options: ItemOption[];
      correctOptionId: string;
      misconceptionId: MisconceptionId;
    }
  | {
      id: string;
      type: 'numeric';
      stem: string;
      unit: string;
      answer: number;
      tolerance: number;
      misconceptionId: MisconceptionId;
    };

export const sampleItems: readonly SampleItem[] = [
  {
    id: 'sample-1',
    type: 'mcq',
    stem: 'Machine A has an ideal mechanical advantage of 4. Machine B has an ideal mechanical advantage of 2. Which statement must be true?',
    options: [
      { id: 'a', label: 'Machine A is more efficient than machine B.', misconceptionId: 'G2' },
      { id: 'b', label: 'Machine B is more efficient than machine A.' },
      { id: 'c', label: 'Their efficiencies cannot be determined from these values alone.' },
      { id: 'd', label: 'Both machines are 100% efficient.', misconceptionId: 'G4' },
    ],
    correctOptionId: 'c',
    misconceptionId: 'G2',
  },
  {
    id: 'sample-2',
    type: 'numeric',
    stem: 'Pulling a block up a ramp takes 132.08 J of input work. The block gains 98.10 J of potential energy. What is the efficiency of the ramp?',
    unit: '%',
    answer: 74.27,
    tolerance: 0.5,
    misconceptionId: 'G4',
  },
  {
    id: 'sample-3',
    type: 'mcq',
    stem: 'The same 100 N force is applied 0.5 m from a door hinge, first perpendicular to the door and then at 30° to the door. Compared with the perpendicular push, the torque at 30° is:',
    options: [
      {
        id: 'a',
        label: 'the same, because the force and distance are the same',
        misconceptionId: 'G1',
      },
      { id: 'b', label: 'half as large' },
      { id: 'c', label: 'twice as large' },
      { id: 'd', label: 'zero' },
    ],
    correctOptionId: 'b',
    misconceptionId: 'G1',
  },
];
