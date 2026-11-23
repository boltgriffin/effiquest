import { lazy } from 'react';
import { simulateBicycleClimb, validateBicycle } from '@/physics-core';
import type { MachineDefinition } from '../shared/types';
import { BicycleDiagram } from './BicycleDiagram';
import {
  BICYCLE_FIXED,
  BICYCLE_SPEED_MPS,
  DEFAULT_BICYCLE_PARAMS,
  toBicycleModel,
  type BicycleLabParams,
} from './bicycleParams';

export const bicycleLab: MachineDefinition<BicycleLabParams> = {
  id: 'bicycle',
  machine: 'bicycle',
  title: 'Bicycle (compound)',
  icon: 'bicycle',
  question:
    'A bicycle is simple machines working together. Where does a cyclist’s effort go when climbing a hill?',
  defaults: DEFAULT_BICYCLE_PARAMS,
  variables: [
    {
      kind: 'segmented',
      key: 'chainringTeeth',
      legend: 'Front chainring',
      options: [
        { value: 34, label: '34 teeth (small)' },
        { value: 50, label: '50 teeth (big)' },
      ],
    },
    {
      kind: 'slider',
      key: 'sprocketTeeth',
      label: 'Rear sprocket',
      name: 'Rear sprocket teeth',
      symbol: 'z₂',
      min: 11,
      max: 34,
      step: 1,
      unit: 'teeth',
      hint: () => 'A bigger rear sprocket is a lower gear: easier pedalling, slower.',
    },
    {
      kind: 'slider',
      key: 'slopePercent',
      label: 'Hill steepness',
      name: 'Hill steepness',
      symbol: 'grade',
      min: 2,
      max: 15,
      step: 1,
      unit: '%',
      hint: () => 'Height gained per 100 m along the road.',
    },
    {
      kind: 'slider',
      key: 'massKg',
      label: 'Rider + bicycle mass',
      name: 'Rider and bicycle mass',
      symbol: 'm',
      min: 50,
      max: 110,
      step: 5,
      unit: 'kg',
    },
    {
      kind: 'slider',
      key: 'rollingCoeff',
      label: 'Tyre rolling resistance',
      name: 'Rolling resistance coefficient',
      symbol: 'C_rr',
      min: 0.003,
      max: 0.015,
      step: 0.001,
      digits: 3,
      hint: () => 'About 0.004 for hard, smooth road tyres; 0.012 for soft or knobbly tyres.',
    },
    {
      kind: 'slider',
      key: 'chainFriction',
      label: 'Chain friction',
      name: 'Chain friction coefficient',
      symbol: 'μ_c',
      min: 0.05,
      max: 0.3,
      step: 0.01,
      digits: 2,
      hint: () => 'About 0.1 for an oiled chain, 0.3 for a dry or rusty one.',
    },
  ],
  validate: (p) => validateBicycle(toBicycleModel(p)),
  simulate: (p) => simulateBicycleClimb(toBicycleModel(p), { speedMps: BICYCLE_SPEED_MPS }),
  loadMassKg: (p) => p.massKg,
  rulerResolutionM: 0.01,
  labels: {
    inputDistance: 'Pedal path (all turns)',
    outputDistance: 'Height climbed',
    idealMA: 'gears × hill: (R_c r₂ ÷ R_w r₁) ÷ sin α',
  },
  status: {
    idle: 'Ready at the bottom of the hill.',
    running: 'Riding up the hill at a steady 2 m/s…',
    finished: `Run complete. The bicycle has ridden ${BICYCLE_FIXED.distanceM} m up the hill.`,
  },
  equations: [
    {
      id: 'chain',
      name: 'The machines in the chain',
      expression: 'crank → chainring → chain → sprocket → wheel → hill',
      where: 'each one passes its output to the next',
    },
    {
      id: 'ima',
      name: 'Ideal mechanical advantage',
      expression: 'IMA = (R_c / R_w) × (z_2 / z_1) × (1 / sin α)',
      where: 'crank and wheel × gears × hill',
    },
    {
      id: 'eff-chain',
      name: 'Efficiencies multiply',
      expression: 'η = η_drivetrain × η_road',
      where: 'drivetrain: chain and bearings; road: tyres and air',
    },
    {
      id: 'eff',
      name: 'Efficiency',
      expression: 'η = W_out / W_in × 100%',
      where: 'W_out = m g h, W_in = F_in × pedal path',
    },
  ],
  extraReadouts: (_p, run) => [
    {
      id: 'drive',
      symbol: (
        <>
          η<sub>drive</sub>
        </>
      ),
      label: 'Drivetrain efficiency',
      value: run.extras?.drivetrainEfficiencyPercent ?? Number.NaN,
      unit: '%',
      digits: 1,
      definition:
        'Work reaching the road through the rear wheel ÷ pedal work. Only the chain and bearings are counted here.',
    },
    {
      id: 'gear',
      symbol: (
        <>
          z<sub>1</sub>/z<sub>2</sub>
        </>
      ),
      label: 'Gear ratio',
      value: run.extras?.gearRatio ?? Number.NaN,
      unit: '',
      digits: 2,
      definition: 'Chainring teeth ÷ sprocket teeth: wheel turns per pedal turn.',
    },
    {
      id: 'cadence',
      symbol: 'n',
      label: 'Pedalling rate',
      value: run.extras?.cadenceRpm ?? Number.NaN,
      unit: 'rpm',
      digits: 0,
      definition: 'Pedal turns per minute at 2 m/s in this gear.',
    },
    {
      id: 'power',
      symbol: 'P',
      label: 'Rider’s power',
      value: run.extras?.powerW ?? Number.NaN,
      unit: 'W',
      digits: 0,
      definition: 'P = W ÷ t: how fast the rider does work at the steady speed.',
    },
  ],
  resultNote: (_p, run) => {
    const drive = run.extras?.drivetrainEfficiencyPercent;
    const total = (run.ledger.usefulJ / run.ledger.inputJ) * 100;
    if (drive === undefined || !Number.isFinite(total)) return null;
    return `Of every 100 J put into the pedals, about ${drive.toFixed(0)} J reach the rear wheel (drivetrain efficiency) and about ${total.toFixed(0)} J lift the rider up the hill. The rest warms the chain, the bearings and the tyres, or pushes air aside.`;
  },
  assumptions: [
    'The bicycle is a chain of simple machines: pedal crank and chainring (wheel and axle), chain and sprocket, rear wheel (wheel and axle) and the hill (inclined plane). Their ideal mechanical advantages multiply.',
    `Losses, each from its own setting: tyres flexing (rolling resistance C_rr), air resistance (C_dA = ${BICYCLE_FIXED.dragAreaM2} m², ρ = ${BICYCLE_FIXED.airDensity} kg/m³), chain links bending under tension (μ_c, pin radius ${BICYCLE_FIXED.pinRadiusM * 1000} mm), and the pedal and wheel bearings (μ_b = ${BICYCLE_FIXED.bearingFriction}).`,
    `Fixed bicycle: cranks ${BICYCLE_FIXED.crankM * 100} cm, wheel radius ${BICYCLE_FIXED.wheelRadiusM} m, chain pitch 12.7 mm. The pedal force is the steady force at right angles to the crank.`,
    `The bicycle starts and ends at rest and rides ${BICYCLE_FIXED.distanceM} m up the hill at a steady ${BICYCLE_SPEED_MPS} m/s. The wheels’ spinning energy is ignored.`,
    'Decision D-13 (awaiting the teacher’s check): uphill needs more work and power; efficiency tells us how much of the rider’s effort reaches the wheels.',
    'g = 9.81 m/s². The scale reads to 0.1 N and the rulers to 0.01 m.',
  ],
  trend: { key: 'sprocketTeeth', label: 'rear sprocket teeth', unit: 'teeth' },
  trialColumns: [
    { key: 'sprocketTeeth', label: 'z₂', digits: 0 },
    { key: 'chainringTeeth', label: 'z₁', digits: 0 },
    { key: 'slopePercent', label: 'grade (%)', digits: 0 },
  ],
  guide: {
    objective:
      'See a bicycle as simple machines working together, find out how the gears change the pedal force, and explain where the rider’s effort goes when climbing a hill.',
    sourceNote:
      'Linked to the concept note: simple machines combining into complex machines such as the bicycle (SRC-O3, SRC-G3) and applying efficiency to bicycles climbing hills (SRC-O6, SRC-G5). The uphill wording follows decision D-13 and awaits the teacher’s check.',
    purpose:
      'Pushing a pedal turns a wheel and axle (the crank and chainring). The chain carries the turning to the rear sprocket, another wheel and axle fixed to the rear wheel, which pushes the bicycle along the road. The hill itself is an inclined plane. Each machine passes its output to the next, so their ideal mechanical advantages multiply. Gears change the pedal force; they cannot change the work needed to lift you up the hill. Uphill needs more work and power, and efficiency tells you how much of your effort reaches the wheels.',
    parts: [
      'Pedals on cranks (17 cm) fixed to the front chainring (34 or 50 teeth)',
      'Chain (12.7 mm links) to the rear sprocket (11 to 34 teeth)',
      'Rear wheel (radius 0.34 m) with tyres',
      'A hill with an adjustable grade',
      'Force sensor on the pedal (0.1 N); distance and height counters',
    ],
    instructions: [
      'Choose a chainring and a rear sprocket (the gear) in Variables.',
      `Press Start. The bicycle rides ${BICYCLE_FIXED.distanceM} m up the hill at a steady speed.`,
      'Note the pedal force, the pedalling rate, the drivetrain efficiency and the overall efficiency.',
      'Press Record trial.',
      'Change only the rear sprocket and record again. Try 14, 20, 26 and 32 teeth.',
      'Then keep one gear and try a gentle (3 %) and a steep (12 %) hill.',
    ],
    variablesNote:
      'Independent: rear sprocket (gear). Keep the same: chainring, hill, mass, tyres, chain. Measured: pedal force, distances, work. Calculated: AMA, IMA, efficiencies, power.',
    prediction: {
      question:
        'If you change to a lower gear (bigger rear sprocket) on the same hill, what happens?',
      options: [
        'Less pedal force, and less work to reach the top',
        'Less pedal force, but about the same work to reach the top',
        'More pedal force and more work',
      ],
    },
    observePrompt: 'For example: compare the drivetrain efficiency with the overall efficiency.',
    reflection: [
      'Name the simple machines in the bicycle, from the pedal to the road, and say what each one does.',
      'Did a lower gear change the work needed to climb the hill? What did it change? Use your data.',
      'The drivetrain efficiency was high, but the overall efficiency was lower. Where did the rest of the rider’s work go? Was the bicycle "less efficient" on the steeper hill?',
    ],
    knowledge: [
      {
        id: 'k1',
        question: 'Why do cyclists change to a bigger rear sprocket for a steep hill?',
        options: [
          { id: 'a', label: 'It reduces the work needed to climb.' },
          {
            id: 'b',
            label: 'It lowers the pedal force; they pedal more turns for the same climb.',
          },
          { id: 'c', label: 'It makes the bicycle lighter.' },
          { id: 'd', label: 'It removes friction from the chain.' },
        ],
        correctId: 'b',
        explanation:
          'A lower gear multiplies the force (bigger mechanical advantage) by trading it for more pedal turns. The work to lift you, m g h, stays the same.',
      },
      {
        id: 'k2',
        question:
          'A bicycle’s drivetrain is 97 % efficient and its road losses leave 90 % for lifting. What share of the rider’s work lifts the rider?',
        options: [
          { id: 'a', label: 'About 87 %' },
          { id: 'b', label: 'About 93.5 %' },
          { id: 'c', label: '97 %' },
          { id: 'd', label: '187 %' },
        ],
        correctId: 'a',
        explanation:
          'Efficiencies of machines in a chain multiply: 0.97 × 0.90 ≈ 0.87, so about 87 %.',
      },
      {
        id: 'k3',
        question: 'Which statement fits decision D-13 about riding uphill?',
        options: [
          { id: 'a', label: 'The bicycle becomes less efficient because the hill is steep.' },
          {
            id: 'b',
            label:
              'Uphill needs more work and power; efficiency tells how much of the effort reaches the wheels.',
          },
          { id: 'c', label: 'Uphill needs less work in a low gear.' },
          { id: 'd', label: 'Efficiency is above 100 % when going downhill.' },
        ],
        correctId: 'b',
        explanation:
          'Climbing adds the work of lifting you (m g h). Efficiency is a separate question: how much of the pedal work is not lost on the way to the wheels and the road.',
      },
    ],
  },
  Diagram: BicycleDiagram,
  View3D: lazy(() => import('./Bicycle3DView')),
};
