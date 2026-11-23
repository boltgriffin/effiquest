import { lazy } from 'react';
import { pulleyMachineRun, validatePulley } from '@/physics-core';
import {
  DEFAULT_PULLEY_PARAMS,
  LOAD_SPEED_MPS,
  PULLEY_GEOMETRY,
  SEGMENT_NAMES,
  toModel,
  type PulleyLabParams,
} from '../pulley/params';
import type { MachineDefinition } from '../shared/types';
import { PulleyLabDiagram } from './diagrams';

export const pulleyLab: MachineDefinition<PulleyLabParams> = {
  id: 'pulley',
  machine: 'pulley',
  title: 'Pulley system',
  icon: 'pulley',
  question: 'Do more rope segments make lifting easier, more efficient, or both?',
  defaults: DEFAULT_PULLEY_PARAMS,
  variables: [
    {
      kind: 'segmented',
      key: 'segments',
      legend: 'Supporting rope segments',
      options: [1, 2, 3, 4].map((n) => ({ value: n, label: String(n) })),
      describe: (p) => `${SEGMENT_NAMES[p.segments] ?? ''}: velocity ratio ${p.segments}`,
    },
    {
      kind: 'slider',
      key: 'loadMassKg',
      label: 'Load mass',
      name: 'Load mass',
      symbol: 'm',
      min: 1,
      max: 40,
      step: 1,
      unit: 'kg',
    },
    {
      kind: 'slider',
      key: 'blockMassKg',
      label: 'Movable block mass',
      name: 'Movable block mass',
      symbol: 'mb',
      min: 0,
      max: 3,
      step: 0.1,
      digits: 1,
      unit: 'kg',
      hint: (p) =>
        p.segments === 1
          ? 'A single fixed pulley has no movable block, so this has no effect.'
          : 'The movable pulleys rise with the load, so lifting them is extra work.',
    },
    {
      kind: 'slider',
      key: 'bearingFriction',
      label: 'Bearing friction',
      name: 'Bearing friction coefficient',
      symbol: 'μb',
      min: 0,
      max: 0.3,
      step: 0.01,
      digits: 2,
      hint: () => "Friction in each pulley's axle. 0 means perfectly smooth bearings.",
    },
  ],
  validate: (p) => validatePulley(toModel(p)),
  simulate: (p) => pulleyMachineRun(toModel(p), { loadSpeedMps: LOAD_SPEED_MPS }),
  loadMassKg: (p) => p.loadMassKg,
  rulerResolutionM: 0.01,
  labels: {
    inputDistance: 'Rope pulled',
    outputDistance: 'Load raised',
    idealMA: 'number of supporting segments',
  },
  status: {
    idle: 'Ready. The load is on the floor.',
    running: 'Pulling the rope at a steady speed…',
    finished: 'Run complete. The load has risen 1 m.',
  },
  equations: [
    {
      id: 'vr',
      name: 'Velocity ratio (IMA)',
      expression: 'VR = d_in / d_out = n',
      where: 'n supporting segments',
    },
    {
      id: 'ama',
      name: 'Actual mechanical advantage',
      expression: 'AMA = F_out / F_in',
      where: 'F_out = W of the load',
    },
    {
      id: 'eff',
      name: 'Efficiency',
      expression: 'η = W_out / W_in × 100%',
      where: 'W_out = W h, W_in = F_in × n h',
    },
  ],
  assumptions: [
    'Non-ideal pulley system: losses come from friction in each pulley’s axle bearing and from lifting the movable pulley block. There is no efficiency setting.',
    `Bearing friction: each pulley multiplies the rope tension by K = (R + μb·r) ÷ (R − μb·r), with pulley radius R = ${PULLEY_GEOMETRY.sheaveRadiusM * 1000} mm and axle radius r = ${PULLEY_GEOMETRY.axleRadiusM * 1000} mm.`,
    'The rope is light, does not stretch and does not slip; rope runs are vertical and parallel.',
    'Pulleys are light (no spin energy); the number of pulleys equals the number of supporting segments.',
    `The load starts and ends at rest and is raised ${PULLEY_GEOMETRY.liftM} m at a steady ${LOAD_SPEED_MPS} m/s.`,
    'g = 9.81 m/s². The spring scale reads to 0.1 N and the rulers to 0.01 m.',
  ],
  trend: { key: 'segments', label: 'number of supporting segments', unit: '' },
  trialColumns: [
    { key: 'segments', label: 'n', digits: 0 },
    { key: 'loadMassKg', label: 'm (kg)', digits: 0 },
    { key: 'bearingFriction', label: 'μb', digits: 2 },
  ],
  guide: {
    objective:
      'Find out how the number of supporting rope segments changes the effort you need and the efficiency of a pulley system, and tell mechanical advantage apart from efficiency.',
    sourceNote:
      'Linked to the concept note: the pulley as a simple machine (SRC-O3), mechanical advantage versus efficiency (SRC-O2), and measuring input and output work (SRC-O5).',
    purpose:
      'A pulley system shares the load between several rope segments. With n segments holding up the load, you pull with roughly 1/n of the force, but you must pull n times as much rope. Every pulley adds a little friction, and the movable pulleys must be lifted too, so some of your work is never used to lift the load.',
    parts: [
      'Fixed pulleys hanging from a ceiling beam',
      'Movable pulley block (for 2-4 segments), which rises with the load',
      'Rope (does not stretch, does not slip)',
      'Load of adjustable mass',
      'Spring scale on the free end of the rope (reads to 0.1 N)',
      'Rulers for rope pulled and height raised (0.01 m)',
    ],
    instructions: [
      'Choose the number of supporting rope segments in Variables.',
      'Press Start. The rope is pulled at a slow, steady speed until the load has risen 1 m.',
      'Watch the spring scale and the two rulers while it runs. Use Pause to look closely.',
      'When the run is complete, read the results and press Record trial.',
      'Change only the number of segments, then run and record again. Repeat for 1, 2, 3 and 4.',
    ],
    variablesNote:
      'Independent: supporting segments. Keep the same: load mass, block mass, bearing friction. Measured: effort, distances, work. Calculated: AMA, IMA (velocity ratio), efficiency.',
    prediction: {
      question: 'If you use more supporting segments, what happens to the efficiency?',
      options: ['Efficiency increases', 'Efficiency decreases', 'Efficiency stays the same'],
    },
    observePrompt: 'For example: how far did the rope move compared with the load?',
    reflection: [
      'When you added more supporting rope segments, what happened to the effort you needed? What happened to the efficiency?',
      'Your data show that some input work was not useful. Where did that energy go?',
      'A worker says: “The 4-segment pulley is the best because it needs the least effort.” Use your data to agree or disagree.',
    ],
    knowledge: [
      {
        id: 'k1',
        question:
          'A block and tackle has 4 rope segments holding up the load. What is its ideal mechanical advantage (velocity ratio)?',
        options: [
          { id: 'a', label: '1' },
          { id: 'b', label: '2' },
          { id: 'c', label: '4' },
          { id: 'd', label: '8' },
        ],
        correctId: 'c',
        explanation:
          'Count the segments supporting the load: the rope must move 4 times as far as the load, so VR = 4.',
      },
      {
        id: 'k2',
        question: 'Adding more supporting segments to a pulley system usually…',
        options: [
          { id: 'a', label: 'lowers the effort and raises the efficiency.' },
          { id: 'b', label: 'lowers the effort but lowers the efficiency.' },
          { id: 'c', label: 'raises the effort and the efficiency.' },
          { id: 'd', label: 'changes nothing.' },
        ],
        correctId: 'b',
        explanation:
          'Each extra pulley adds bearing friction, and the movable block must be lifted too, so more of the input work is lost.',
      },
      {
        id: 'k3',
        question: 'What does a single fixed pulley with perfect bearings do?',
        options: [
          { id: 'a', label: 'Halves the effort needed.' },
          { id: 'b', label: 'Only changes the direction of the force.' },
          { id: 'c', label: 'Doubles the distance the load moves.' },
          { id: 'd', label: 'Makes the load lighter.' },
        ],
        correctId: 'b',
        explanation:
          'Its IMA is 1: you pull down with the same force to lift the load up. It is useful because pulling down is easier.',
      },
    ],
  },
  Diagram: PulleyLabDiagram,
  View3D: lazy(() => import('../pulley/Pulley3DView')),
};
