import { lazy } from 'react';
import { simulateBrakeApply, validateBrake } from '@/physics-core';
import type { MachineDefinition } from '../shared/types';
import { BrakeDiagram } from './BrakeDiagram';
import {
  BRAKE_FIXED,
  brakeLoadMassKg,
  DEFAULT_BRAKE_PARAMS,
  toBrakeModel,
  type BrakeLabParams,
} from './brakeParams';

export const brakeLab: MachineDefinition<BrakeLabParams> = {
  id: 'brake',
  machine: 'brake',
  title: 'Hydraulic brake (compound)',
  icon: 'brake',
  question: 'How does a light push on a brake pedal become the force that stops a heavy car?',
  defaults: DEFAULT_BRAKE_PARAMS,
  variables: [
    {
      kind: 'slider',
      key: 'pedalRatio',
      label: 'Pedal ratio (lever)',
      name: 'Pedal ratio',
      symbol: 'i',
      min: 3,
      max: 6,
      step: 0.5,
      digits: 1,
      hint: () => 'Pedal arm ÷ pushrod arm: the lever part of the brake.',
    },
    {
      kind: 'slider',
      key: 'masterDiameterMm',
      label: 'Master cylinder diameter',
      name: 'Master cylinder diameter',
      symbol: 'd₁',
      min: 15,
      max: 25,
      step: 1,
      unit: 'mm',
    },
    {
      kind: 'slider',
      key: 'caliperDiameterMm',
      label: 'Caliper piston diameter',
      name: 'Caliper piston diameter',
      symbol: 'd₂',
      min: 32,
      max: 60,
      step: 2,
      unit: 'mm',
    },
    {
      kind: 'slider',
      key: 'clampForceN',
      label: 'Clamp force needed',
      name: 'Clamp force needed',
      symbol: 'Q',
      min: 2000,
      max: 8000,
      step: 500,
      unit: 'N',
      hint: () =>
        'How hard the pads must squeeze the disc: harder for a heavier car or a quicker stop.',
    },
    {
      kind: 'slider',
      key: 'sealFrictionN',
      label: 'Seal friction (each piston)',
      name: 'Seal friction',
      symbol: 'f_s',
      min: 0,
      max: 40,
      step: 5,
      unit: 'N',
    },
    {
      kind: 'slider',
      key: 'padFriction',
      label: 'Pad friction coefficient',
      name: 'Pad friction coefficient',
      symbol: 'μ_pad',
      min: 0.25,
      max: 0.5,
      step: 0.05,
      digits: 2,
      hint: () =>
        'How grippy the pads are on the disc. It changes the braking force, not the hydraulics.',
    },
  ],
  validate: (p) => validateBrake(toBrakeModel(p)),
  simulate: (p) => simulateBrakeApply(toBrakeModel(p)),
  loadMassKg: brakeLoadMassKg,
  outputForce: {
    symbol: (
      <>
        F<sub>clamp</sub>
      </>
    ),
    label: 'Clamp force on the pads',
    definition: 'How hard the caliper piston pushes the pads against the disc.',
  },
  rulerResolutionM: 0.0001,
  labels: {
    inputDistance: 'Pedal travel',
    outputDistance: 'Caliper piston travel',
    idealMA: 'pedal ratio × A₂ ÷ A₁',
  },
  status: {
    idle: 'Ready. The pads are just touching the disc.',
    running: 'Pressing the brake pedal…',
    finished: `Run complete. The pads have been squeezed ${BRAKE_FIXED.padTravelM * 1000} mm.`,
  },
  equations: [
    {
      id: 'chain',
      name: 'The machines in the chain',
      expression: 'pedal (lever) → master cylinder → fluid → caliper → pads → disc → tyre',
      where: 'each one passes its output to the next',
    },
    {
      id: 'ima',
      name: 'Ideal mechanical advantage',
      expression: 'IMA = i × A_2 / A_1',
      where: 'lever × Pascal',
    },
    {
      id: 'pascal',
      name: "Pascal's principle",
      expression: 'P = F_1 / A_1 = F_2 / A_2',
      where: 'the same pressure in all of the brake fluid',
    },
    {
      id: 'friction',
      name: 'Braking force at the disc',
      expression: 'F_brake = μ_pad × 2 F_clamp',
      where: 'two pads, one on each side of the disc',
    },
  ],
  extraReadouts: (_p, run) => [
    {
      id: 'p',
      symbol: 'P',
      label: 'Fluid pressure',
      value: (run.extras?.pressurePa ?? Number.NaN) / 1e6,
      unit: 'MPa',
      digits: 2,
      definition: 'The same everywhere in the brake fluid (Pascal).',
    },
    {
      id: 'f1',
      symbol: (
        <>
          F<sub>1</sub>
        </>
      ),
      label: 'Force on the master piston',
      value: run.extras?.masterForceN ?? Number.NaN,
      unit: 'N',
      digits: 0,
      definition: 'The pedal lever multiplies your push before the fluid does.',
    },
    {
      id: 'disc',
      symbol: (
        <>
          F<sub>disc</sub>
        </>
      ),
      label: 'Friction force on the disc',
      value: run.extras?.discFrictionN ?? Number.NaN,
      unit: 'N',
      digits: 0,
      definition: 'μ_pad × 2 × clamp force: two pads rub the disc.',
    },
    {
      id: 'tyre',
      symbol: (
        <>
          F<sub>tyre</sub>
        </>
      ),
      label: 'Braking force at the tyre',
      value: run.extras?.tyreBrakingForceN ?? Number.NaN,
      unit: 'N',
      digits: 0,
      definition: `Disc force × disc radius ÷ wheel radius (${BRAKE_FIXED.discRadiusM} m ÷ ${BRAKE_FIXED.wheelRadiusM} m): the wheel and axle works in reverse here.`,
    },
  ],
  assumptions: [
    'The brake is a chain of machines: the pedal is a lever, the master and caliper cylinders are a hydraulic press, the pads use friction on the disc, and the disc and wheel are a wheel and axle working in reverse.',
    `Losses: a constant friction force at each piston seal, and friction in the pedal pivot pin (μ = ${BRAKE_FIXED.pivotFriction}, pin radius ${BRAKE_FIXED.pivotPinRadiusM * 1000} mm). The friction at the disc is the braking itself, not a loss of the hydraulics.`,
    `The run squeezes the pads through the last ${BRAKE_FIXED.padTravelM * 1000} mm against the full clamp force (real clamp force builds up as the pads compress). Pedal arm ${BRAKE_FIXED.pedalArmM * 100} cm.`,
    'The brake fluid cannot be compressed and has no air in it; the brake line does not swell. Air in the line would make the pedal travel further (a "spongy" pedal) and is not modelled.',
    'Pistons and pedal are light. The scale reads to 0.1 N and the rulers to 0.1 mm.',
  ],
  trend: { key: 'caliperDiameterMm', label: 'caliper piston diameter', unit: 'mm' },
  trialColumns: [
    { key: 'caliperDiameterMm', label: 'd₂ (mm)', digits: 0 },
    { key: 'masterDiameterMm', label: 'd₁ (mm)', digits: 0 },
    { key: 'pedalRatio', label: 'i', digits: 1 },
  ],
  guide: {
    objective:
      'Follow the force from the brake pedal to the tyre through a lever, a hydraulic press and friction, and find out which parts multiply the force.',
    sourceNote:
      "Linked to the concept note: Pascal's law in real systems such as brakes (SRC-O4, SRC-G6), compound machines (SRC-O3, SRC-G3), and hydraulic brakes as a practical scenario (SRC-O6).",
    purpose:
      "A car's brake pedal is a lever that pushes a small piston in the master cylinder. Pascal's principle carries the same pressure through the brake fluid to a much wider piston in the caliper, which squeezes the brake pads against the disc. Friction between the pads and the disc then slows the wheel. The lever and the hydraulics multiply the force; their ideal mechanical advantages multiply too. In exchange the pedal travels much further than the pads.",
    parts: [
      'Brake pedal: a lever with a pivot pin',
      'Master cylinder (small piston) with brake fluid',
      'Brake line to the caliper',
      'Caliper with a wider piston and two pads on the disc',
      'Force sensor on the pedal (0.1 N); travel rulers (0.1 mm)',
    ],
    instructions: [
      'Set the pedal ratio and piston sizes in Variables.',
      'Press Start. The pedal is pressed until the pads have been squeezed 0.5 mm with the clamp force needed.',
      'Note the pedal force, the fluid pressure and the braking force at the tyre.',
      'Press Record trial.',
      'Change only the caliper piston diameter and record again. Try 36, 44, 52 and 60 mm.',
      'Then try a longer pedal (higher pedal ratio). Which change gives more force for the same push?',
    ],
    variablesNote:
      'Independent: caliper piston diameter. Keep the same: pedal ratio, master cylinder, clamp force, seal friction. Measured: pedal force, travel, work. Calculated: AMA, IMA, efficiency, pressure.',
    prediction: {
      question:
        'If the caliper piston is made wider, what happens to the pedal force and the pedal travel?',
      options: [
        'Less force and less travel',
        'Less force but more travel',
        'More force and more travel',
      ],
    },
    observePrompt: 'For example: compare the clamp force with the braking force at the tyre.',
    reflection: [
      'Name each machine in the brake, from the pedal to the tyre, and say whether it multiplies force or distance.',
      'Why does the pedal travel so much further than the pads? Use your data.',
      'Why is a leak or air in the brake line dangerous? Use Pascal’s principle in your answer.',
    ],
    knowledge: [
      {
        id: 'k1',
        question:
          'A brake has a pedal ratio of 4 and pistons whose areas are in the ratio 6 : 1. What is its ideal mechanical advantage?',
        options: [
          { id: 'a', label: '10' },
          { id: 'b', label: '24' },
          { id: 'c', label: '1.5' },
          { id: 'd', label: '2' },
        ],
        correctId: 'b',
        explanation: 'Machines in a chain multiply: 4 × 6 = 24.',
      },
      {
        id: 'k2',
        question: 'Why must brake fluid not contain air?',
        options: [
          { id: 'a', label: 'Air is heavy.' },
          {
            id: 'b',
            label:
              'Air can be compressed, so the pedal squeezes the air instead of passing the pressure to the pads.',
          },
          { id: 'c', label: 'Air makes the pads hotter.' },
          { id: 'd', label: 'Air increases the pressure.' },
        ],
        correctId: 'b',
        explanation:
          "Pascal's principle needs a fluid that cannot be compressed. With air, the pedal moves further and the pressure (and braking force) may not build up.",
      },
      {
        id: 'k3',
        question: 'The brake multiplies the pedal force about 24 times. What is the price?',
        options: [
          { id: 'a', label: 'The pads wear out 24 times faster.' },
          { id: 'b', label: 'The pedal moves about 24 times further than the pads.' },
          { id: 'c', label: 'The brake fluid gets 24 times hotter.' },
          { id: 'd', label: 'There is no price.' },
        ],
        correctId: 'b',
        explanation: 'Work in ≥ work out: a force 24 times larger moves about 24 times less far.',
      },
    ],
  },
  Diagram: BrakeDiagram,
  View3D: lazy(() => import('./Brake3DView')),
};
