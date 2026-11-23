import { lazy } from 'react';
import { simulateScrewLift, validateScrew } from '@/physics-core';
import type { MachineDefinition } from '../shared/types';
import { ScrewDiagram } from './ScrewDiagram';
import {
  DEFAULT_SCREW_PARAMS,
  SCREW_FIXED,
  SCREW_SPEED_MPS,
  toScrewModel,
  type ScrewLabParams,
} from './screwParams';

export const screwLab: MachineDefinition<ScrewLabParams> = {
  id: 'screw',
  machine: 'screw',
  title: 'Screw jack',
  icon: 'screw',
  question:
    'How can a small push on a handle lift half a tonne, and why does a good jack waste more than half the work?',
  defaults: DEFAULT_SCREW_PARAMS,
  variables: [
    {
      kind: 'slider',
      key: 'handleRadiusM',
      label: 'Handle length (radius)',
      name: 'Handle radius',
      symbol: 'R',
      min: 0.1,
      max: 0.4,
      step: 0.01,
      digits: 2,
      unit: 'm',
    },
    {
      kind: 'slider',
      key: 'pitchMm',
      label: 'Thread pitch',
      name: 'Pitch',
      symbol: 'p',
      min: 2,
      max: 10,
      step: 1,
      unit: 'mm',
      hint: () => 'How far the load rises in one full turn of the handle.',
    },
    {
      kind: 'slider',
      key: 'loadMassKg',
      label: 'Load mass',
      name: 'Load mass',
      symbol: 'm',
      min: 100,
      max: 1000,
      step: 50,
      unit: 'kg',
    },
    {
      kind: 'slider',
      key: 'threadFriction',
      label: 'Thread friction',
      name: 'Thread friction coefficient',
      symbol: 'μ',
      min: 0,
      max: 0.3,
      step: 0.01,
      digits: 2,
      hint: () =>
        'About 0.1 for a greased thread, 0.2 or more for a dry one. 0 means perfectly smooth.',
    },
  ],
  validate: (p) => validateScrew(toScrewModel(p)),
  simulate: (p) => simulateScrewLift(toScrewModel(p), { loadSpeedMps: SCREW_SPEED_MPS }),
  loadMassKg: (p) => p.loadMassKg,
  rulerResolutionM: 0.001,
  labels: {
    inputDistance: 'Handle end moved (all turns)',
    outputDistance: 'Load raised',
    idealMA: '2πR ÷ pitch',
  },
  status: {
    idle: 'Ready. The load rests on the jack.',
    running: 'Turning the handle at a steady speed…',
    finished: `Run complete. The load has risen ${SCREW_FIXED.liftM * 1000} mm.`,
  },
  equations: [
    {
      id: 'ima',
      name: 'Ideal mechanical advantage',
      expression: 'IMA = 2πR / p',
      where: 'handle circle ÷ rise per turn',
    },
    {
      id: 'lead',
      name: 'Lead angle (the thread is a wrapped ramp)',
      expression: 'tan λ = p / (2π r_m)',
      where: `r_m = ${SCREW_FIXED.threadRadiusM * 1000} mm, the thread radius`,
    },
    {
      id: 'eff-screw',
      name: 'Efficiency of a screw',
      expression: 'η = tan λ / tan(λ + φ)',
      where: 'tan φ = μ; also η = W_out / W_in × 100%',
    },
    {
      id: 'torque',
      name: 'Torque from the effort',
      expression: 'τ = R F_in',
      where: 'effort at right angles to the handle',
    },
  ],
  extraReadouts: (_p, run) => [
    {
      id: 'torque',
      symbol: 'τ',
      label: 'Torque on the handle',
      value: run.extras?.torqueNm ?? Number.NaN,
      unit: 'N·m',
      digits: 2,
      definition: 'Turning effect of your push: τ = R × F_in.',
    },
    {
      id: 'turns',
      symbol: 'n',
      label: 'Turns of the handle',
      value: run.extras?.turns ?? Number.NaN,
      unit: '',
      digits: 1,
      definition: 'Lift ÷ pitch: each turn raises the load by one pitch.',
    },
    {
      id: 'lead',
      symbol: 'λ',
      label: 'Lead angle',
      value: run.extras?.leadAngleDeg ?? Number.NaN,
      unit: '°',
      digits: 2,
      definition: 'Slope of the thread: the screw is an inclined plane wrapped round a cylinder.',
    },
    {
      id: 'phi',
      symbol: 'φ',
      label: 'Friction angle',
      value: run.extras?.frictionAngleDeg ?? Number.NaN,
      unit: '°',
      digits: 2,
      definition: 'tan φ = μ. When φ ≥ λ the screw holds the load by itself.',
    },
  ],
  resultNote: (_p, run) =>
    run.extras?.selfLocking
      ? 'This screw holds the load by itself (friction angle ≥ lead angle): you can let go of the handle and the load stays up. The price: it is less than 50% efficient.'
      : 'This screw does NOT hold the load by itself: if you let go, the load would turn the screw and run back down. Real jacks are designed to be self-locking.',
  assumptions: [
    'The thread is an inclined plane wrapped round the screw (square thread, one start). Its slope is the lead angle λ, with tan λ = p ÷ 2π r_m.',
    `Losses: friction in the thread only (coefficient μ). The thrust bearing under the screw is taken as frictionless and the screw itself as light. Thread radius r_m = ${SCREW_FIXED.threadRadiusM * 1000} mm.`,
    'The effort pushes at right angles to the handle, at its end.',
    `The load starts and ends at rest and is raised ${SCREW_FIXED.liftM * 1000} mm at a steady ${SCREW_SPEED_MPS * 1000} mm/s.`,
    'g = 9.81 m/s². The scale reads to 0.1 N and the rulers to 1 mm.',
    'In the pictures the handle length is to scale; the rise is drawn larger than true. True values are shown as numbers.',
  ],
  trend: { key: 'pitchMm', label: 'thread pitch', unit: 'mm' },
  trialColumns: [
    { key: 'pitchMm', label: 'p (mm)', digits: 0 },
    { key: 'handleRadiusM', label: 'R (m)', digits: 2 },
    { key: 'threadFriction', label: 'μ', digits: 2 },
  ],
  guide: {
    objective:
      'Find out how the handle length and the thread pitch change the effort, see why a screw is an inclined plane wrapped round a cylinder, and explain why a jack that holds its load by itself must waste more than half the work.',
    sourceNote:
      'Linked to the concept note: the screw as one of the six simple machines (SRC-O3), friction and real-world limits (SRC-O2, SRC-G4), and torque (SRC-O1).',
    purpose:
      'A screw jack turns a small push on a long handle into a large lifting force. Each full turn moves your hand around a circle of 2πR but lifts the load by only one pitch p, so the ideal mechanical advantage is 2πR ÷ p, often several hundred. The thread is a ramp wrapped round the screw, and like a ramp it has friction. That friction wastes work, but it is also what stops the load from running back down when you let go.',
    parts: [
      'Handle of adjustable length, turned at its end (spring scale, 0.1 N)',
      'Threaded screw with an adjustable pitch',
      'Nut fixed in the base',
      'Platform carrying the load',
      'Ruler for the rise (1 mm)',
    ],
    instructions: [
      'Set the handle length and pitch in Variables.',
      `Press Start. The handle is turned until the load has risen ${SCREW_FIXED.liftM * 1000} mm.`,
      'Note the effort, the torque and the number of turns.',
      'Press Record trial.',
      'Change only the pitch (keep the handle and friction the same), then run and record again. Try 2, 4, 6, 8 and 10 mm.',
      'Then set the friction to 0 and run once more: does the screw still hold the load by itself?',
    ],
    variablesNote:
      'Independent: thread pitch. Keep the same: handle length, load, friction. Measured: effort, distances, work. Calculated: AMA, IMA, efficiency.',
    prediction: {
      question:
        'If you use a finer thread (smaller pitch), what happens to the effort and to the efficiency?',
      options: [
        'Less effort and more efficient',
        'Less effort but less efficient',
        'More effort and more efficient',
      ],
    },
    observePrompt:
      'For example: compare the efficiency with 50% and read the note under the results.',
    reflection: [
      'How did the effort and the efficiency change as the pitch got smaller? Use the "wrapped ramp" idea to explain.',
      'A car jack must hold the car up while you change a tyre. Use your results to explain why such a jack is always less than 50% efficient.',
      'Name two other screws you use (for example a bottle cap or a vice) and say what the "handle" is in each.',
    ],
    knowledge: [
      {
        id: 'k1',
        question:
          'A jack has a 0.30 m handle and a 6 mm pitch. What is its ideal mechanical advantage?',
        options: [
          { id: 'a', label: 'About 50' },
          { id: 'b', label: 'About 314' },
          { id: 'c', label: 'About 0.05' },
          { id: 'd', label: 'About 1800' },
        ],
        correctId: 'b',
        explanation: 'IMA = 2πR ÷ p = 2π × 0.30 m ÷ 0.006 m ≈ 314.',
      },
      {
        id: 'k2',
        question:
          'Why is a screw jack that holds its load by itself always less than 50% efficient?',
        options: [
          { id: 'a', label: 'Because the load is heavy.' },
          {
            id: 'b',
            label:
              'Friction must be strong enough to stop the load running back, and that same friction wastes at least half of the work.',
          },
          { id: 'c', label: 'Because the handle is short.' },
          { id: 'd', label: 'It is not; good jacks are 100% efficient.' },
        ],
        correctId: 'b',
        explanation:
          'Self-locking needs friction angle φ ≥ lead angle λ, and then η = tan λ ÷ tan(λ + φ) is at most 50%. Wasted work is the price of safety.',
      },
      {
        id: 'k3',
        question: 'A screw is best described as…',
        options: [
          { id: 'a', label: 'a lever with two fulcrums' },
          { id: 'b', label: 'an inclined plane wrapped round a cylinder' },
          { id: 'c', label: 'a pulley without a rope' },
          { id: 'd', label: 'a kind of wedge that cannot turn' },
        ],
        correctId: 'b',
        explanation:
          'Unroll one turn of the thread and you get a ramp with rise p and length 2π r: the same machine as an inclined plane.',
      },
    ],
  },
  Diagram: ScrewDiagram,
  View3D: lazy(() => import('./Screw3DView')),
};
