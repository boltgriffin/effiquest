import { lazy } from 'react';
import { simulateLeverTurn, validateLever } from '@/physics-core';
import type { MachineDefinition } from '../shared/types';
import { LeverDiagram } from './LeverDiagram';
import {
  DEFAULT_LEVER_PARAMS,
  LEVER_ANGULAR_SPEED,
  LEVER_PIN_RADIUS_M,
  LEVER_ROTATION_DEG,
  toLeverModel,
  type LeverLabParams,
} from './leverParams';

export const leverLab: MachineDefinition<LeverLabParams> = {
  id: 'lever',
  machine: 'lever',
  title: 'Lever',
  icon: 'lever',
  question:
    'Where should the fulcrum go to make lifting easier, and does that change the efficiency?',
  defaults: DEFAULT_LEVER_PARAMS,
  variables: [
    {
      kind: 'slider',
      key: 'effortArmM',
      label: 'Effort arm',
      name: 'Effort arm',
      symbol: 'Le',
      min: 0.2,
      max: 1,
      step: 0.05,
      digits: 2,
      unit: 'm',
    },
    {
      kind: 'slider',
      key: 'loadArmM',
      label: 'Load arm',
      name: 'Load arm',
      symbol: 'Ll',
      min: 0.1,
      max: 1,
      step: 0.05,
      digits: 2,
      unit: 'm',
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
      key: 'pivotFriction',
      label: 'Pivot friction',
      name: 'Pivot friction coefficient',
      symbol: 'μp',
      min: 0,
      max: 0.5,
      step: 0.01,
      digits: 2,
      hint: () => 'Friction in the pin the beam turns on. 0 means a perfectly smooth pivot.',
    },
  ],
  validate: (p) => validateLever(toLeverModel(p)),
  simulate: (p) => simulateLeverTurn(toLeverModel(p), { angularSpeed: LEVER_ANGULAR_SPEED }),
  loadMassKg: (p) => p.loadMassKg,
  // Lever movements are short (a few centimetres), so the rulers read to 1 mm.
  rulerResolutionM: 0.001,
  labels: {
    inputDistance: 'Effort moved (arc)',
    outputDistance: 'Load raised (arc)',
    idealMA: 'effort arm ÷ load arm',
  },
  status: {
    idle: 'Ready. The beam is level.',
    running: 'Pushing the effort end down slowly…',
    finished: `Run complete. The beam has turned ${LEVER_ROTATION_DEG}°.`,
  },
  equations: [
    {
      id: 'torque',
      name: 'Torque (turning effect)',
      expression: 'τ = r F sin θ',
      where: 'here the forces are at 90° to the beam',
    },
    {
      id: 'balance',
      name: 'Ideal lever: balanced torques',
      expression: 'F_in × L_e = F_out × L_l',
      where: 'L in m, F in N',
    },
    {
      id: 'ima',
      name: 'Ideal mechanical advantage',
      expression: 'IMA = L_e / L_l',
      where: 'effort arm ÷ load arm',
    },
    {
      id: 'eff',
      name: 'Efficiency',
      expression: 'η = W_out / W_in × 100%',
      where: 'W = F × arc distance',
    },
  ],
  assumptions: [
    'First-class lever: the fulcrum is between the load and the effort.',
    'The beam is rigid and very light; the effort and the load push at right angles to the beam.',
    `Friction torque in the pivot pin = μp × pin radius (${LEVER_PIN_RADIUS_M * 1000} mm) × the force the pin carries (effort + load).`,
    `The beam starts and ends at rest and is turned ${LEVER_ROTATION_DEG}° at a steady speed; distances are the arcs moved by each end.`,
    'g = 9.81 m/s². The spring scale reads to 0.1 N and the rulers to 1 mm.',
    'Efficiency = useful work on the load ÷ input work × 100%. It is never set directly.',
  ],
  trend: { key: 'effortArmM', label: 'effort arm', unit: 'm' },
  trialColumns: [
    { key: 'effortArmM', label: 'Le (m)', digits: 2 },
    { key: 'loadArmM', label: 'Ll (m)', digits: 2 },
    { key: 'pivotFriction', label: 'μp', digits: 2 },
  ],
  guide: {
    objective:
      'Find out how the lengths of the effort arm and load arm change the effort you need, connect this to torque (turning effect), and see how pivot friction affects efficiency.',
    sourceNote:
      'Linked to the concept note: torque, applying straight-line ideas to turning (SRC-O1); the lever as a simple machine (SRC-O3); mechanical advantage versus efficiency (SRC-O2).',
    purpose:
      'A lever is a rigid bar that turns about a pivot called the fulcrum. Pushing far from the fulcrum gives a large turning effect (torque) with a small force, but your end of the bar moves further than the load. In a perfect lever the torques balance: F_in × effort arm = F_out × load arm. Friction in the pivot wastes a little of your work.',
    parts: [
      'Beam (rigid and very light)',
      'Fulcrum: the pivot, with a pin the beam turns on',
      'Load at the end of the load arm',
      'Effort pushing down at the end of the effort arm (spring scale, 0.1 N)',
      'Arc rulers for how far each end moves (1 mm)',
    ],
    instructions: [
      'Set the effort arm and load arm in Variables.',
      `Press Start. The effort end is pushed down slowly and the beam turns ${LEVER_ROTATION_DEG}°.`,
      'Watch the spring scale and how far each end moves.',
      'When the run is complete, press Record trial.',
      'Change only the effort arm (keep the load arm the same), then run and record again. Try 0.4, 0.6, 0.8 and 1.0 m.',
    ],
    variablesNote:
      'Independent: effort arm. Keep the same: load arm, load mass, pivot friction. Measured: effort, arc distances, work. Calculated: AMA, IMA, efficiency.',
    prediction: {
      question:
        'If you make the effort arm longer and keep the load arm the same, what happens to the effort you need?',
      options: ['The effort increases', 'The effort decreases', 'The effort stays the same'],
    },
    observePrompt: 'For example: how far did your end of the beam move compared with the load?',
    reflection: [
      'How did the effort change when the effort arm got longer? Explain it using torque (turning effect).',
      'Did a longer effort arm change the efficiency very much? Why or why not?',
      'Name an everyday tool that is a lever, and say where its fulcrum, effort and load are.',
    ],
    knowledge: [
      {
        id: 'k1',
        question:
          'A lever has an effort arm of 0.9 m and a load arm of 0.3 m. Ignoring friction, what effort lifts a 300 N load?',
        options: [
          { id: 'a', label: '30 N' },
          { id: 'b', label: '100 N' },
          { id: 'c', label: '300 N' },
          { id: 'd', label: '900 N' },
        ],
        correctId: 'b',
        explanation:
          'Balanced torques: F_in × 0.9 m = 300 N × 0.3 m, so F_in = 90 N·m ÷ 0.9 m = 100 N.',
      },
      {
        id: 'k2',
        question: 'Why does a longer effort arm reduce the effort needed?',
        options: [
          { id: 'a', label: 'It makes the load lighter.' },
          {
            id: 'b',
            label:
              'The same torque needs less force at a larger distance from the fulcrum (τ = rF).',
          },
          { id: 'c', label: 'It removes the friction in the pivot.' },
          { id: 'd', label: 'It makes the lever 100% efficient.' },
        ],
        correctId: 'b',
        explanation:
          'Torque is force × distance from the fulcrum. Doubling the distance halves the force needed for the same turning effect.',
      },
      {
        id: 'k3',
        question: 'If the load arm is longer than the effort arm, the lever…',
        options: [
          { id: 'a', label: 'cannot work at all.' },
          {
            id: 'b',
            label: 'needs more effort than the load, but moves the load further and faster.',
          },
          { id: 'c', label: 'is 100% efficient.' },
          { id: 'd', label: 'has an IMA greater than 1.' },
        ],
        correctId: 'b',
        explanation:
          'Its IMA is less than 1. Such levers trade force for distance and speed, which is useful when speed matters more than force.',
      },
    ],
  },
  Diagram: LeverDiagram,
  View3D: lazy(() => import('./Lever3DView')),
};
