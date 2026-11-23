import type { IconName } from '@/components/icons/Icon';
import type { MisconceptionId } from '@/types';

/**
 * Quest skeletons: each quest challenges one misconception from the concept note.
 * Decision D-11: progress only (stages marked complete); no points, unlocking or leaderboards.
 *
 * Stage completion is derived from the learner's own records:
 *  - lesson (concept review): the module is marked complete
 *  - lab (simulation activity + experiment task): the lab activity is completed (journal saved)
 *  - check (knowledge check, SRC-N2 formative quiz): a practice attempt is submitted
 *  - reflect: the learner answers the quest question on the quest page
 * See docs/QUESTS_AND_ASSESSMENTS.md for how this maps to the milestone's quest structure.
 */
export type QuestStage =
  | { id: string; kind: 'lesson'; title: string; moduleId: string }
  | { id: string; kind: 'lab'; title: string; labId: LabId }
  | { id: string; kind: 'check'; title: string; assessmentId: string }
  | { id: string; kind: 'reflect'; title: string };

export type LabId = 'incline' | 'pulley' | 'lever' | 'wheel_axle' | 'hydraulic';

export interface Quest {
  id: string;
  title: string;
  /** The mission: the question the learner investigates. */
  question: string;
  misconceptionId: MisconceptionId;
  /** Concept-note objective the quest works towards (paraphrased from SRC-O1..O6). */
  objective: { source: string; text: string };
  stages: QuestStage[];
}

const reflect: QuestStage = { id: 'reflect', kind: 'reflect', title: 'Answer the quest question' };
const check = (assessmentId: string): QuestStage => ({
  id: 'check',
  kind: 'check',
  title: 'Knowledge check',
  assessmentId,
});

export const quests: readonly Quest[] = [
  {
    id: 'effort-vs-efficiency',
    title: 'Less effort, more efficient?',
    question: 'Does a machine that makes lifting easier also waste less energy?',
    misconceptionId: 'G2',
    objective: {
      source: 'SRC-O2',
      text: 'Tell mechanical advantage apart from efficiency, and recognise friction, energy loss and real-world limits.',
    },
    stages: [
      {
        id: 'lesson',
        kind: 'lesson',
        title: 'Mechanical advantage and efficiency',
        moduleId: 'advantage-efficiency',
      },
      { id: 'lab', kind: 'lab', title: 'Compare ramps in the lab', labId: 'incline' },
      check('check-effort-vs-efficiency'),
      reflect,
    ],
  },
  {
    id: 'perfect-machine',
    title: 'Where does the energy go?',
    question: 'If a machine is well made, does all the input work become useful work?',
    misconceptionId: 'G4',
    objective: {
      source: 'SRC-O5',
      text: 'Measure input and output forces in an experiment, calculate efficiency and analyse where energy is lost.',
    },
    stages: [
      {
        id: 'lesson',
        kind: 'lesson',
        title: 'Measuring efficiency in real machines',
        moduleId: 'efficiency-practice',
      },
      { id: 'lab', kind: 'lab', title: 'Find the losses in a pulley system', labId: 'pulley' },
      check('check-perfect-machine'),
      reflect,
    ],
  },
  {
    id: 'turning-forces',
    title: 'Pushing straight, turning round',
    question: 'How do force and distance ideas carry over to things that rotate?',
    misconceptionId: 'G1',
    objective: {
      source: 'SRC-O1',
      text: 'Apply straight-line motion formulas to turning motion (torque, angular acceleration) using analogies and problem solving.',
    },
    stages: [
      { id: 'lesson', kind: 'lesson', title: 'Torque and rotational motion', moduleId: 'torque' },
      { id: 'lab', kind: 'lab', title: 'Feel torque with a lever', labId: 'lever' },
      check('check-turning-forces'),
      reflect,
    ],
  },
  {
    id: 'pressure-at-work',
    title: 'Pressure at work',
    question: 'How does a small push on a brake pedal stop a heavy vehicle?',
    misconceptionId: 'G6',
    objective: {
      source: 'SRC-O4',
      text: "Apply Pascal's law to real systems such as brakes, lifts and excavators.",
    },
    stages: [
      {
        id: 'lesson',
        kind: 'lesson',
        title: "Hydraulics and Pascal's principle",
        moduleId: 'hydraulics',
      },
      { id: 'lab', kind: 'lab', title: 'Lift a load with a hydraulic press', labId: 'hydraulic' },
      check('check-pressure-at-work'),
      reflect,
    ],
  },
];

export interface LabInfo {
  id: LabId;
  title: string;
  to: string;
  icon: IconName;
  question: string;
}

export const labs: readonly LabInfo[] = [
  {
    id: 'lever',
    title: 'Lever',
    to: '/lab/lever',
    icon: 'lever',
    question:
      'Where should the fulcrum go to make lifting easier, and does that change the efficiency?',
  },
  {
    id: 'incline',
    title: 'Inclined plane',
    to: '/lab/incline',
    icon: 'incline',
    question: 'Does a gentler ramp make lifting easier, more efficient, or both?',
  },
  {
    id: 'pulley',
    title: 'Pulley system',
    to: '/lab/pulley',
    icon: 'pulley',
    question: 'Do more rope segments make lifting easier, more efficient, or both?',
  },
  {
    id: 'wheel_axle',
    title: 'Wheel and axle',
    to: '/lab/wheel-and-axle',
    icon: 'reset',
    question:
      'How does the size of the wheel change the effort, and where does the lost energy go?',
  },
];

/**
 * Machines not built yet, shown as plain text, never as links. Screw and wedge are named in the
 * concept note (SRC-O3) and come next (D-05).
 */
export const plannedLabs: readonly string[] = ['Screw', 'Wedge'];

export function findQuest(id: string | undefined): Quest | undefined {
  return quests.find((q) => q.id === id);
}
