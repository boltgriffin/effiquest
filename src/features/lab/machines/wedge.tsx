import { lazy } from 'react';
import { simulateWedgePush, validateWedge } from '@/physics-core';
import type { MachineDefinition } from '../shared/types';
import { WedgeDiagram } from './WedgeDiagram';
import {
  DEFAULT_WEDGE_PARAMS,
  toWedgeModel,
  WEDGE_PUSH_M,
  WEDGE_SPEED_MPS,
  type WedgeLabParams,
} from './wedgeParams';

export const wedgeLab: MachineDefinition<WedgeLabParams> = {
  id: 'wedge',
  machine: 'wedge',
  title: 'Wedge',
  icon: 'wedge',
  question: 'Does a thinner wedge make lifting easier, more efficient, or both?',
  defaults: DEFAULT_WEDGE_PARAMS,
  variables: [
    {
      kind: 'slider',
      key: 'wedgeAngleDeg',
      label: 'Wedge angle',
      name: 'Wedge angle',
      symbol: 'α',
      min: 4,
      max: 30,
      step: 1,
      unit: '°',
    },
    {
      kind: 'slider',
      key: 'loadMassKg',
      label: 'Load mass',
      name: 'Load mass',
      symbol: 'm',
      min: 20,
      max: 300,
      step: 10,
      unit: 'kg',
    },
    {
      kind: 'slider',
      key: 'friction',
      label: 'Friction (both faces)',
      name: 'Friction coefficient',
      symbol: 'μ',
      min: 0,
      max: 0.4,
      step: 0.01,
      digits: 2,
      hint: () =>
        'The same rubbing on the top face (wedge–load) and the bottom face (wedge–floor). 0 means perfectly smooth.',
    },
  ],
  validate: (p) => validateWedge(toWedgeModel(p)),
  simulate: (p) => simulateWedgePush(toWedgeModel(p), { pushSpeedMps: WEDGE_SPEED_MPS }),
  loadMassKg: (p) => p.loadMassKg,
  rulerResolutionM: 0.001,
  labels: {
    inputDistance: 'Wedge pushed',
    outputDistance: 'Load raised',
    idealMA: '1 ÷ tan α (wedge length ÷ thickness)',
  },
  status: {
    idle: 'Ready. The tip of the wedge is just under the load.',
    running: 'Pushing the wedge in at a steady speed…',
    finished: `Run complete. The wedge has moved ${WEDGE_PUSH_M} m.`,
  },
  equations: [
    {
      id: 'ima',
      name: 'Ideal mechanical advantage',
      expression: 'IMA = 1 / tan α',
      where: 'wedge length ÷ thickness',
    },
    {
      id: 'push',
      name: 'Push needed (friction μ on both faces)',
      expression: 'F_in = W [tan(α + φ) + tan φ]',
      where: 'tan φ = μ',
    },
    {
      id: 'eff',
      name: 'Efficiency',
      expression: 'η = W_out / W_in × 100%',
      where: 'W_out = W h, W_in = F_in × push',
    },
  ],
  resultNote: (_p, run) =>
    run.extras?.selfLocking
      ? 'This wedge stays in place when you stop pushing (α ≤ 2φ), like a door wedge. Friction holds it, and the same friction is why so much work is lost.'
      : 'This wedge would slide back out when you stop pushing (α > 2φ): the load squeezes it out. A wedge that must stay put needs a smaller angle or more friction.',
  assumptions: [
    'The load can only move up and down: smooth guides at its sides stop it moving sideways.',
    'Losses: friction on both faces of the wedge, the same coefficient μ on the top (wedge–load) and bottom (wedge–floor) faces. Each face is calculated on its own.',
    'The wedge is light and rigid, and the push is horizontal.',
    `The wedge is pushed ${WEDGE_PUSH_M} m at a steady ${WEDGE_SPEED_MPS} m/s, starting and ending at rest.`,
    'g = 9.81 m/s². The scale reads to 0.1 N and the rulers to 1 mm. The pictures are to scale.',
  ],
  trend: { key: 'wedgeAngleDeg', label: 'wedge angle', unit: '°' },
  trialColumns: [
    { key: 'wedgeAngleDeg', label: 'α (°)', digits: 0 },
    { key: 'friction', label: 'μ', digits: 2 },
    { key: 'loadMassKg', label: 'm (kg)', digits: 0 },
  ],
  guide: {
    objective:
      'Find out how the wedge angle changes the push and the efficiency, and why a wedge that stays in place must lose a lot of work to friction.',
    sourceNote:
      'Linked to the concept note: the wedge as one of the six simple machines (SRC-O3), mechanical advantage versus efficiency (SRC-O2, SRC-G2), and friction losses (SRC-G4).',
    purpose:
      'A wedge is a moving inclined plane. Pushing it under a load raises the load a little while the wedge moves a lot: the ideal mechanical advantage is 1 ÷ tan α, so a thin wedge gives a big advantage. But a wedge rubs on two faces at once, so friction wastes much of the work. That same friction keeps a door wedge, a shim or a splitting wedge from sliding back out.',
    parts: [
      'Wedge with an adjustable angle, pushed along the floor (spring scale, 0.1 N)',
      'Load held between two guides so it can only move up',
      'Ruler for the push and the rise (1 mm)',
    ],
    instructions: [
      'Set the wedge angle in Variables.',
      `Press Start. The wedge is pushed ${WEDGE_PUSH_M} m under the load.`,
      'Note the push, the rise and the efficiency.',
      'Press Record trial.',
      'Change only the wedge angle, then run and record again. Try 5°, 10°, 15°, 20° and 30°.',
      'Read the note under the results each time: does the wedge stay in place?',
    ],
    variablesNote:
      'Independent: wedge angle. Keep the same: load, friction. Measured: push, distances, work. Calculated: AMA, IMA, efficiency.',
    prediction: {
      question:
        'If you use a thinner wedge (smaller angle), what happens to the push needed and to the efficiency?',
      options: [
        'Less push and more efficient',
        'Less push but less efficient',
        'More push but more efficient',
      ],
    },
    observePrompt: 'For example: compare the AMA with the IMA for a thin and a thick wedge.',
    reflection: [
      'How did the push and the efficiency change as the wedge got thinner? Explain using the two rubbing faces.',
      'A door wedge must not slide out. Use your results to explain what angle it should have and why it wastes work.',
      'An axe splitting wood is a wedge. Which part is the thin edge, and why is a thin blade easier to drive in?',
    ],
    knowledge: [
      {
        id: 'k1',
        question:
          'A wedge is 0.30 m long and 0.05 m thick at the back. What is its ideal mechanical advantage?',
        options: [
          { id: 'a', label: '0.17' },
          { id: 'b', label: '6' },
          { id: 'c', label: '15' },
          { id: 'd', label: '0.35' },
        ],
        correctId: 'b',
        explanation: 'IMA = length ÷ thickness = 0.30 m ÷ 0.05 m = 6.',
      },
      {
        id: 'k2',
        question:
          'Why does a wedge usually waste more of the work than a ramp with the same slope?',
        options: [
          { id: 'a', label: 'It rubs on two faces at once: the load and the floor.' },
          { id: 'b', label: 'It is made of metal.' },
          { id: 'c', label: 'Its IMA is smaller.' },
          { id: 'd', label: 'It does not; they waste the same.' },
        ],
        correctId: 'a',
        explanation:
          'A ramp has one rubbing surface; a wedge slides against the load on top and the floor below, so friction acts twice.',
      },
      {
        id: 'k3',
        question: 'A thin wedge needs a smaller push. Does that make it more efficient?',
        options: [
          { id: 'a', label: 'Yes, less effort always means more efficient.' },
          {
            id: 'b',
            label:
              'No: it gives a bigger advantage, but a larger share of the work is lost to friction.',
          },
          { id: 'c', label: 'Yes, because it moves further.' },
          { id: 'd', label: 'There is no way to tell.' },
        ],
        correctId: 'b',
        explanation:
          'Mechanical advantage and efficiency are different. A thin wedge slides further against friction for the same rise, so its efficiency is lower.',
      },
    ],
  },
  Diagram: WedgeDiagram,
  View3D: lazy(() => import('./Wedge3DView')),
};
