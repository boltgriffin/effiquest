import { lazy } from 'react';
import { inclineMachineRun, validateIncline } from '@/physics-core';
import { DEFAULT_PARAMS, PULL_SPEED_MPS, RAMP_LENGTH_M, type InclineParams } from '../params';
import type { MachineDefinition } from '../shared/types';
import { InclineLabDiagram } from './diagrams';

export const inclineLab: MachineDefinition<InclineParams> = {
  id: 'incline',
  machine: 'incline',
  title: 'Inclined plane',
  icon: 'incline',
  question: 'Does a gentler ramp make lifting easier, more efficient, or both?',
  defaults: DEFAULT_PARAMS,
  variables: [
    {
      kind: 'slider',
      key: 'angleDeg',
      label: 'Ramp angle',
      name: 'Ramp angle',
      symbol: 'θ',
      min: 5,
      max: 60,
      step: 1,
      unit: '°',
    },
    {
      kind: 'slider',
      key: 'friction',
      label: 'Friction coefficient',
      name: 'Friction coefficient',
      symbol: 'μ',
      min: 0,
      max: 0.8,
      step: 0.01,
      digits: 2,
      hint: () => '0 means no friction. Larger values mean a rougher surface.',
    },
    {
      kind: 'slider',
      key: 'massKg',
      label: 'Block mass',
      name: 'Block mass',
      symbol: 'm',
      min: 1,
      max: 50,
      step: 1,
      unit: 'kg',
    },
  ],
  validate: (p) => validateIncline({ ...p, lengthM: RAMP_LENGTH_M }),
  simulate: (p) =>
    inclineMachineRun({ ...p, lengthM: RAMP_LENGTH_M }, { speedMps: PULL_SPEED_MPS }),
  loadMassKg: (p) => p.massKg,
  rulerResolutionM: 0.01,
  labels: {
    inputDistance: 'Distance pulled (along the ramp)',
    outputDistance: 'Height gained',
    idealMA: 'slope length ÷ height',
  },
  status: {
    idle: 'Ready. The block is at the bottom of the ramp.',
    running: 'Pulling the block up the ramp at a steady speed…',
    finished: 'Run complete. The block is at the top of the ramp.',
  },
  equations: [
    {
      id: 'ima',
      name: 'Ideal mechanical advantage',
      expression: 'IMA = L / h',
      where: 'L slope length, h height (m)',
    },
    {
      id: 'steady',
      name: 'Effort at steady speed',
      expression: 'F_in = W (sin θ + μ cos θ)',
      where: 'W = m g in N',
    },
    {
      id: 'ama',
      name: 'Actual mechanical advantage',
      expression: 'AMA = F_out / F_in',
      where: 'F_out = W',
    },
    {
      id: 'eff',
      name: 'Efficiency',
      expression: 'η = W_out / W_in × 100%',
      where: 'W_out = W h, W_in = F_in L',
    },
  ],
  assumptions: [
    `The ramp surface is ${RAMP_LENGTH_M} m long; changing the angle changes its height.`,
    'Rigid block and ramp; g = 9.81 m/s².',
    'One kinetic friction coefficient μ for the whole surface. Static friction (the extra push to start) is not modelled.',
    `The block starts and ends at rest and is pulled parallel to the slope at a steady ${PULL_SPEED_MPS} m/s.`,
    'The spring scale reads to 0.1 N and the rulers to 0.01 m.',
    'Efficiency = useful work (the block’s potential energy) ÷ input work × 100%. It is never set directly.',
  ],
  trend: { key: 'angleDeg', label: 'ramp angle', unit: '°' },
  trialColumns: [
    { key: 'angleDeg', label: 'θ (°)', digits: 0 },
    { key: 'friction', label: 'μ', digits: 2 },
    { key: 'massKg', label: 'm (kg)', digits: 0 },
  ],
  guide: {
    objective:
      'Find out how the steepness of a ramp changes the effort you need and the efficiency, and tell mechanical advantage apart from efficiency.',
    sourceNote:
      'Linked to the concept note: the inclined plane as a simple machine (SRC-O3), mechanical advantage versus efficiency (SRC-O2), and measuring input and output work (SRC-O5).',
    purpose:
      'An inclined plane lets you raise a load by pulling it a longer distance with a smaller force. A gentler ramp needs less force but a longer pull. Friction between the block and the ramp turns some of your work into heat, so the work you put in is always more than the energy the block gains.',
    parts: [
      'Ramp: 2 m long; you choose its angle',
      'Block (the load)',
      'Spring scale pulling the block parallel to the ramp (reads to 0.1 N)',
      'Rulers for the distance pulled and the height gained (0.01 m)',
    ],
    instructions: [
      'Set the ramp angle in Variables.',
      'Press Start. The block is pulled up the whole ramp at a slow, steady speed.',
      'Watch the spring scale and the rulers. Use Pause to look closely.',
      'When the run is complete, read the results and press Record trial.',
      'Change only the angle, then run and record again. Try 10°, 20°, 30° and 45°.',
    ],
    variablesNote:
      'Independent: ramp angle. Keep the same: friction and block mass. Measured: effort, distances, work. Calculated: AMA, IMA, efficiency.',
    prediction: {
      question:
        'If you make the ramp gentler (smaller angle) and keep the same friction, what happens to the efficiency?',
      options: ['Efficiency increases', 'Efficiency decreases', 'Efficiency stays the same'],
    },
    observePrompt: 'For example: how did the scale reading change when the ramp got steeper?',
    reflection: [
      'Which ramp needed the least effort? Which ramp was the most efficient? Were they the same ramp?',
      'Where did the lost energy go on the ramp?',
      'A worker wants to load a heavy box onto a truck while wasting as little energy as possible. Should they use the longest, gentlest ramp? Use your data.',
    ],
    knowledge: [
      {
        id: 'k1',
        question: 'A ramp is 4 m long and 1 m high. What is its ideal mechanical advantage?',
        options: [
          { id: 'a', label: '0.25' },
          { id: 'b', label: '1' },
          { id: 'c', label: '4' },
          { id: 'd', label: '5' },
        ],
        correctId: 'c',
        explanation: 'IMA = slope length ÷ height = 4 m ÷ 1 m = 4.',
      },
      {
        id: 'k2',
        question:
          'Two ramps with the same surface raise the same box to the same height. Ramp A is gentler than ramp B. Which is true?',
        options: [
          { id: 'a', label: 'A needs less effort and wastes less energy.' },
          { id: 'b', label: 'A needs less effort but wastes more energy.' },
          { id: 'c', label: 'Both waste the same energy.' },
          { id: 'd', label: 'B needs less effort.' },
        ],
        correctId: 'b',
        explanation:
          'The gentler ramp needs a smaller force, but the box slides further against friction, so more work is turned into heat.',
      },
      {
        id: 'k3',
        question: 'In this model, what is the efficiency of a ramp with no friction (μ = 0)?',
        options: [
          { id: 'a', label: '100%' },
          { id: 'b', label: 'It depends on the angle.' },
          { id: 'c', label: '50%' },
          { id: 'd', label: 'Equal to its IMA' },
        ],
        correctId: 'a',
        explanation:
          'With no friction all the input work becomes the block’s potential energy. Real ramps always have some friction.',
      },
    ],
  },
  Diagram: InclineLabDiagram,
  View3D: lazy(() => import('../Incline3DView')),
};
