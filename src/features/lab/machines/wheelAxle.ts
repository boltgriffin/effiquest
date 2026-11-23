import { lazy } from 'react';
import { simulateWheelAxleLift, validateWheelAxle } from '@/physics-core';
import type { MachineDefinition } from '../shared/types';
import { WheelAxleDiagram } from './WheelAxleDiagram';
import {
  DEFAULT_WHEEL_AXLE_PARAMS,
  toWheelAxleModel,
  WHEEL_AXLE_FIXED,
  WHEEL_LOAD_SPEED_MPS,
  type WheelAxleLabParams,
} from './wheelAxleParams';

export const wheelAxleLab: MachineDefinition<WheelAxleLabParams> = {
  id: 'wheel_axle',
  machine: 'wheel_axle',
  title: 'Wheel and axle',
  icon: 'reset',
  question: 'How does the size of the wheel change the effort, and where does the lost energy go?',
  defaults: DEFAULT_WHEEL_AXLE_PARAMS,
  variables: [
    {
      kind: 'slider',
      key: 'wheelRadiusM',
      label: 'Wheel radius',
      name: 'Wheel radius',
      symbol: 'R',
      min: 0.1,
      max: 0.5,
      step: 0.01,
      digits: 2,
      unit: 'm',
    },
    {
      kind: 'slider',
      key: 'axleRadiusM',
      label: 'Axle radius',
      name: 'Axle radius',
      symbol: 'r',
      min: 0.02,
      max: 0.1,
      step: 0.005,
      digits: 3,
      unit: 'm',
      hint: (p) =>
        p.axleRadiusM >= p.wheelRadiusM ? 'The axle must be smaller than the wheel.' : undefined,
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
      key: 'bearingFriction',
      label: 'Bearing friction',
      name: 'Bearing friction coefficient',
      symbol: 'μb',
      min: 0,
      max: 0.3,
      step: 0.01,
      digits: 2,
      hint: () => 'Friction in the bearing that holds the axle. 0 means perfectly smooth.',
    },
  ],
  validate: (p) => validateWheelAxle(toWheelAxleModel(p)),
  simulate: (p) =>
    simulateWheelAxleLift(toWheelAxleModel(p), { loadSpeedMps: WHEEL_LOAD_SPEED_MPS }),
  loadMassKg: (p) => p.loadMassKg,
  rulerResolutionM: 0.01,
  labels: {
    inputDistance: 'Rope pulled off the wheel',
    outputDistance: 'Load raised',
    idealMA: 'wheel radius ÷ axle radius',
  },
  status: {
    idle: 'Ready. The load is on the floor.',
    running: 'Turning the wheel at a steady speed…',
    finished: `Run complete. The load has risen ${WHEEL_AXLE_FIXED.liftM} m.`,
  },
  equations: [
    {
      id: 'ima',
      name: 'Ideal mechanical advantage',
      expression: 'IMA = R / r',
      where: 'wheel radius ÷ axle radius',
    },
    {
      id: 'torque',
      name: 'Torque from the effort',
      expression: 'τ = R F_in',
      where: 'effort at 90° to the radius',
    },
    {
      id: 'newton',
      name: "Newton's second law for turning",
      expression: 'τ_net = I α',
      where: 'I = ½ M R² for the wheel',
    },
    {
      id: 'eff',
      name: 'Efficiency',
      expression: 'η = W_out / W_in × 100%',
      where: 'W_out = W h, W_in = F_in × rope pulled',
    },
  ],
  assumptions: [
    'The wheel and axle are one rigid body: they turn through the same angle, so the effort rope moves R ÷ r times as far as the load.',
    `Losses: friction in the axle bearing (journal radius ${WHEEL_AXLE_FIXED.bearingRadiusM * 1000} mm). The bearing carries the effort, the load and the wheel’s own weight (${WHEEL_AXLE_FIXED.wheelMassKg} kg), so a heavy wheel adds friction.`,
    `The wheel is a uniform ${WHEEL_AXLE_FIXED.wheelMassKg} kg disk (I = ½ M R²). Extra torque is needed to start it spinning and is given back when it slows; over a whole run this nets to zero.`,
    'Ropes are light, do not stretch or slip, and hang vertically.',
    `The load starts and ends at rest and is raised ${WHEEL_AXLE_FIXED.liftM} m at a steady ${WHEEL_LOAD_SPEED_MPS} m/s.`,
    'g = 9.81 m/s². The spring scale reads to 0.1 N and the rulers to 0.01 m.',
  ],
  trend: { key: 'wheelRadiusM', label: 'wheel radius', unit: 'm' },
  trialColumns: [
    { key: 'wheelRadiusM', label: 'R (m)', digits: 2 },
    { key: 'axleRadiusM', label: 'r (m)', digits: 3 },
    { key: 'loadMassKg', label: 'm (kg)', digits: 0 },
  ],
  guide: {
    objective:
      'Find out how the sizes of the wheel and axle change the effort, connect this to torque, and see why a bigger push is needed while the wheel speeds up.',
    sourceNote:
      'Linked to the concept note: torque and angular acceleration (SRC-O1); the wheel and axle as a simple machine (SRC-O3); mechanical advantage versus efficiency (SRC-O2).',
    purpose:
      'A wheel and axle is a large wheel fixed to a smaller axle so they turn together. A small force on the rim of the wheel makes a large turning effect (torque), which the axle passes to the load. The effort rope moves R ÷ r times as far as the load rises. Friction in the bearing wastes some work, and while the wheel speeds up, part of the torque goes into making it spin faster (τ_net = I α).',
    parts: [
      'Wheel (a 2 kg disk) with the effort rope wound on its rim',
      'Axle fixed to the wheel, with the load rope wound on it',
      'Bearing in the stand that holds the axle',
      'Load of adjustable mass',
      'Spring scale on the effort rope (0.1 N) and rulers (0.01 m)',
    ],
    instructions: [
      'Set the wheel radius and axle radius in Variables.',
      `Press Start. The effort rope is pulled until the load has risen ${WHEEL_AXLE_FIXED.liftM} m.`,
      'Watch the spring scale: it reads higher at the start (spinning the wheel up), steady in the middle, and lower as it stops.',
      'When the run is complete, press Record trial.',
      'Change only the wheel radius (keep the axle the same), then run and record again. Try 0.15, 0.25, 0.35 and 0.45 m.',
    ],
    variablesNote:
      'Independent: wheel radius. Keep the same: axle radius, load mass, bearing friction. Measured: effort, distances, work. Calculated: AMA, IMA, efficiency.',
    prediction: {
      question:
        'If you use a bigger wheel with the same axle, what happens to the effort you need?',
      options: ['The effort increases', 'The effort decreases', 'The effort stays the same'],
    },
    observePrompt: 'For example: what did the spring scale do in the first second of each run?',
    reflection: [
      'How did the effort change when the wheel radius increased? Use torque to explain.',
      'The scale read higher at the very start of each run. Why? (Hint: τ_net = I α.)',
      'Name an everyday wheel and axle (for example a doorknob or a screwdriver) and say which part is the wheel and which is the axle.',
    ],
    knowledge: [
      {
        id: 'k1',
        question:
          'A wheel of radius 0.40 m is fixed to an axle of radius 0.05 m. What is its ideal mechanical advantage?',
        options: [
          { id: 'a', label: '0.125' },
          { id: 'b', label: '2' },
          { id: 'c', label: '8' },
          { id: 'd', label: '20' },
        ],
        correctId: 'c',
        explanation: 'IMA = R ÷ r = 0.40 m ÷ 0.05 m = 8.',
      },
      {
        id: 'k2',
        question: 'Why is a bigger pull needed while the wheel is speeding up?',
        options: [
          { id: 'a', label: 'Friction is larger at low speeds.' },
          {
            id: 'b',
            label: 'Part of the torque gives the wheel angular acceleration (τ_net = I α).',
          },
          { id: 'c', label: 'The load gets heavier.' },
          { id: 'd', label: 'The IMA changes.' },
        ],
        correctId: 'b',
        explanation:
          'An unbalanced torque is needed to change how fast the wheel spins, just as an unbalanced force is needed to change a speed (F = m a).',
      },
      {
        id: 'k3',
        question: 'A screwdriver with a fatter handle is easier to turn because…',
        options: [
          { id: 'a', label: 'the handle has more friction.' },
          { id: 'b', label: 'a larger radius gives more torque for the same force.' },
          { id: 'c', label: 'the screw becomes shorter.' },
          { id: 'd', label: 'the handle is lighter.' },
        ],
        correctId: 'b',
        explanation:
          'The handle is the wheel and the shaft is the axle: a larger wheel radius gives a larger turning effect for the same push.',
      },
    ],
  },
  Diagram: WheelAxleDiagram,
  View3D: lazy(() => import('./WheelAxle3DView')),
};
