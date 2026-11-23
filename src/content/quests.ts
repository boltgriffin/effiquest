import type { IconName } from '@/components/icons/Icon';
import type { MisconceptionId } from '@/types';

/**
 * Quest skeletons: each quest challenges one misconception from the concept note.
 * Decision D-11: progress only (stages marked complete); no points, unlocking or leaderboards.
 *
 * Stage completion is derived from the learner's own records:
 *  - lesson: the module is marked complete
 *  - lab: the lab activity is completed (its journal entry saved)
 *  - reflect: the learner answers the quest question on the quest page
 */
export type QuestStage =
  | { id: string; kind: 'lesson'; title: string; moduleId: string }
  | { id: string; kind: 'lab'; title: string; labId: LabId }
  | { id: string; kind: 'reflect'; title: string };

export type LabId = 'incline' | 'pulley' | 'lever' | 'wheel_axle' | 'hydraulic';

export interface Quest {
  id: string;
  title: string;
  question: string;
  misconceptionId: MisconceptionId;
  stages: QuestStage[];
}

const reflect: QuestStage = { id: 'reflect', kind: 'reflect', title: 'Answer the quest question' };

export const quests: readonly Quest[] = [
  {
    id: 'effort-vs-efficiency',
    title: 'Less effort, more efficient?',
    question: 'Does a machine that makes lifting easier also waste less energy?',
    misconceptionId: 'G2',
    stages: [
      {
        id: 'lesson',
        kind: 'lesson',
        title: 'Mechanical advantage and efficiency',
        moduleId: 'advantage-efficiency',
      },
      { id: 'lab', kind: 'lab', title: 'Compare ramps in the lab', labId: 'incline' },
      reflect,
    ],
  },
  {
    id: 'perfect-machine',
    title: 'Where does the energy go?',
    question: 'If a machine is well made, does all the input work become useful work?',
    misconceptionId: 'G4',
    stages: [
      {
        id: 'lesson',
        kind: 'lesson',
        title: 'Measuring efficiency in real machines',
        moduleId: 'efficiency-practice',
      },
      { id: 'lab', kind: 'lab', title: 'Find the losses in a pulley system', labId: 'pulley' },
      reflect,
    ],
  },
  {
    id: 'turning-forces',
    title: 'Pushing straight, turning round',
    question: 'How do force and distance ideas carry over to things that rotate?',
    misconceptionId: 'G1',
    stages: [
      { id: 'lesson', kind: 'lesson', title: 'Torque and rotational motion', moduleId: 'torque' },
      { id: 'lab', kind: 'lab', title: 'Feel torque with a lever', labId: 'lever' },
      reflect,
    ],
  },
  {
    id: 'pressure-at-work',
    title: 'Pressure at work',
    question: 'How does a small push on a brake pedal stop a heavy vehicle?',
    misconceptionId: 'G6',
    stages: [
      {
        id: 'lesson',
        kind: 'lesson',
        title: "Hydraulics and Pascal's principle",
        moduleId: 'hydraulics',
      },
      { id: 'lab', kind: 'lab', title: 'Lift a load with a hydraulic press', labId: 'hydraulic' },
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
