import { lazy } from 'react';
import { pascalOutputForce, pressure } from '@/edu-calc';
import { areaFromDiameter, simulateHydraulicLift, validateHydraulic } from '@/physics-core';
import type { MachineDefinition } from '../shared/types';
import { HydraulicDiagram } from './HydraulicDiagram';
import {
  DEFAULT_HYDRAULIC_PARAMS,
  HYDRAULIC_LIFT_M,
  HYDRAULIC_SPEED_MPS,
  toHydraulicModel,
  type HydraulicLabParams,
} from './hydraulicParams';

export const hydraulicLab: MachineDefinition<HydraulicLabParams> = {
  id: 'hydraulic',
  machine: 'hydraulic',
  title: 'Hydraulic press',
  icon: 'hydraulic',
  question:
    'How does a small push on a small piston lift a heavy load, and what do real presses lose?',
  defaults: DEFAULT_HYDRAULIC_PARAMS,
  variables: [
    {
      kind: 'slider',
      key: 'inputDiameterM',
      label: 'Small piston diameter',
      name: 'Small piston diameter',
      symbol: 'd1',
      min: 0.02,
      max: 0.04,
      step: 0.002,
      digits: 3,
      unit: 'm',
    },
    {
      kind: 'slider',
      key: 'outputDiameterM',
      label: 'Large piston diameter',
      name: 'Large piston diameter',
      symbol: 'd2',
      min: 0.04,
      max: 0.12,
      step: 0.005,
      digits: 3,
      unit: 'm',
    },
    {
      kind: 'slider',
      key: 'loadMassKg',
      label: 'Load mass',
      name: 'Load mass',
      symbol: 'm',
      min: 20,
      max: 400,
      step: 10,
      unit: 'kg',
    },
    {
      kind: 'slider',
      key: 'sealFrictionN',
      label: 'Seal friction (each piston)',
      name: 'Seal friction',
      symbol: 'fs',
      min: 0,
      max: 20,
      step: 1,
      unit: 'N',
      hint: () => 'Rubber seals rub on the cylinder walls. 0 means perfectly smooth seals.',
    },
    {
      kind: 'slider',
      key: 'leakMlPerS',
      label: 'Leakage (at 1 MPa)',
      name: 'Leakage',
      symbol: 'q',
      min: 0,
      max: 20,
      step: 1,
      unit: 'mL/s',
      hint: () =>
        'Fluid that slips past the seals. Higher pressure pushes more fluid out. 0 means no leaks.',
    },
  ],
  validate: (p) => validateHydraulic(toHydraulicModel(p)),
  simulate: (p) =>
    simulateHydraulicLift(toHydraulicModel(p), { loadSpeedMps: HYDRAULIC_SPEED_MPS }),
  loadMassKg: (p) => p.loadMassKg,
  rulerResolutionM: 0.001,
  labels: {
    inputDistance: 'Small piston pushed',
    outputDistance: 'Load raised',
    idealMA: 'large piston area ÷ small piston area',
  },
  status: {
    idle: 'Ready. The load rests on the large piston.',
    running: 'Pushing the small piston down at a steady speed…',
    finished: `Run complete. The load has risen ${HYDRAULIC_LIFT_M} m.`,
  },
  equations: [
    {
      id: 'pressure',
      name: 'Pressure',
      expression: 'P = F / A',
      where: 'F in N, A in m², P in Pa',
    },
    {
      id: 'pascal',
      name: "Pascal's principle (ideal)",
      expression: 'F_1 / A_1 = F_2 / A_2',
      where: 'same pressure throughout the fluid',
    },
    {
      id: 'ima',
      name: 'Ideal mechanical advantage',
      expression: 'IMA = A_2 / A_1 = d_in / d_out',
      where: 'no leakage',
    },
    {
      id: 'eff',
      name: 'Efficiency',
      expression: 'η = W_out / W_in × 100%',
      where: 'W_out = W h, W_in = F_in × d_in',
    },
  ],
  extraReadouts: (p, run) => {
    const A1 = areaFromDiameter(p.inputDiameterM);
    const A2 = areaFromDiameter(p.outputDiameterM);
    const P = pressure(
      { forceN: run.steadyInputForceN - p.sealFrictionN, areaM2: A1 },
      { basis: 'simulated' },
    );
    const ideal = pascalOutputForce({
      inputForceN: run.steadyInputForceN,
      inputAreaM2: A1,
      outputAreaM2: A2,
    });
    return [
      {
        id: 'p',
        symbol: 'P',
        label: 'Fluid pressure',
        value: P.ok ? P.value / 1000 : Number.NaN,
        unit: 'kPa',
        digits: 1,
        definition:
          'Pressure while lifting at steady speed: the same everywhere in the fluid (Pascal).',
      },
      {
        id: 'ratio',
        symbol: (
          <>
            A<sub>2</sub>/A<sub>1</sub>
          </>
        ),
        label: 'Area ratio',
        value: A2 / A1,
        unit: '',
        digits: 2,
        definition: 'Large piston area ÷ small piston area.',
      },
      {
        id: 'f2',
        symbol: (
          <>
            F<sub>2</sub>
          </>
        ),
        label: 'Output force from your effort',
        value: ideal.ok ? ideal.value : Number.NaN,
        unit: 'N',
        digits: 1,
        ideal: true,
        definition:
          "F_in × A₂ ÷ A₁ by Pascal's principle. Compare it with the load weight: the difference is lost to seal friction.",
      },
      {
        id: 'leak',
        symbol: 'V',
        label: 'Fluid leaked',
        value: (run.extras?.leakedVolumeM3 ?? 0) * 1e6,
        unit: 'mL',
        digits: 1,
        definition:
          'Fluid that escaped past the seals during the lift. The small piston had to push this extra fluid too.',
      },
    ];
  },
  assumptions: [
    'The fluid cannot be compressed; both pistons are at the same height, so the pressure is the same everywhere (Pascal).',
    'Losses: a constant friction force at each piston seal, and leakage past the seals that grows with pressure (flow = leakage setting × pressure ÷ 1 MPa). There is no efficiency setting.',
    'Because of leakage the small piston must travel further than A₂ ÷ A₁ times the load’s rise. The ideal mechanical advantage still uses A₂ ÷ A₁.',
    `The load starts and ends at rest and is raised ${HYDRAULIC_LIFT_M} m at a steady ${HYDRAULIC_SPEED_MPS} m/s in one long stroke (a real jack pumps many short strokes).`,
    'Pistons are light. g = 9.81 m/s². The scale reads to 0.1 N and the rulers to 1 mm.',
    'In the pictures, piston diameters are to scale but movements are not; true distances are shown as numbers.',
  ],
  trend: { key: 'outputDiameterM', label: 'large piston diameter', unit: 'm' },
  trialColumns: [
    { key: 'outputDiameterM', label: 'd₂ (m)', digits: 3 },
    { key: 'inputDiameterM', label: 'd₁ (m)', digits: 3 },
    { key: 'leakMlPerS', label: 'leak (mL/s)', digits: 0 },
  ],
  guide: {
    objective:
      "Apply Pascal's principle to a hydraulic press, find out how the piston sizes change the effort and the distance you push, and see what real presses lose to seal friction and leakage.",
    sourceNote:
      "Linked to the concept note: apply Pascal's law to real systems such as brakes, lifts and excavators (SRC-O4), and recognise real-world limits such as leakage (SRC-G6, SRC-O2).",
    purpose:
      'In a hydraulic press, pushing a small piston raises the pressure in the fluid, and that pressure is the same everywhere in the fluid. The large piston has a bigger area, so the same pressure gives it a bigger force: F₂ = F₁ × A₂ ÷ A₁. There is no free energy: the small piston must move A₂ ÷ A₁ times as far as the load rises. Real presses lose energy to friction at the seals, and fluid leaking past the seals means you have to push even further.',
    parts: [
      'Small (input) piston with a rod you push on (spring scale, 0.1 N)',
      'Large (output) piston carrying the load',
      'Pipe and cylinders full of oil (cannot be compressed)',
      'Rubber seals around each piston (friction and leakage)',
      'Rulers for how far each piston moves (1 mm)',
    ],
    instructions: [
      'Choose the piston diameters in Variables.',
      `Press Start. The small piston is pushed down until the load has risen ${HYDRAULIC_LIFT_M} m.`,
      'Watch the spring scale and how far each piston moves. Note the fluid pressure in the results.',
      'Press Record trial.',
      'Change only the large piston diameter, then run and record again. Try 0.06, 0.08, 0.10 and 0.12 m.',
      'Then set leakage to 0 and run once more: what changes?',
    ],
    variablesNote:
      'Independent: large piston diameter. Keep the same: small piston, load, seal friction, leakage. Measured: effort, piston distances, work, pressure. Calculated: AMA, IMA, efficiency.',
    prediction: {
      question:
        'If you make the large piston wider, what happens to the distance you must push the small piston to lift the load the same height?',
      options: ['It gets longer', 'It gets shorter', 'It stays the same'],
    },
    observePrompt:
      'For example: compare the output force from your effort (ideal) with the load weight.',
    reflection: [
      'How did the effort and the distance you pushed change when the large piston got wider? Explain with Pascal’s principle.',
      'With leakage, you pushed further than A₂ ÷ A₁ times the load’s rise. Where did the extra fluid and energy go?',
      'A car’s brake pedal pushes a small piston; the brake pads are pushed by larger pistons. Use your results to explain how a light push can stop a heavy car, and why a leaking brake line is dangerous.',
    ],
    knowledge: [
      {
        id: 'k1',
        question:
          'A 50 N force pushes a 0.001 m² piston. The large piston has an area of 0.1 m². Ignoring losses, what force does it exert?',
        options: [
          { id: 'a', label: '0.5 N' },
          { id: 'b', label: '50 N' },
          { id: 'c', label: '500 N' },
          { id: 'd', label: '5000 N' },
        ],
        correctId: 'd',
        explanation:
          'P = 50 N ÷ 0.001 m² = 50 000 Pa; F₂ = 50 000 Pa × 0.1 m² = 5000 N (A₂ ÷ A₁ = 100).',
      },
      {
        id: 'k2',
        question: 'Why can a hydraulic press not create energy, even though it multiplies force?',
        options: [
          { id: 'a', label: 'Because the fluid gets hot.' },
          { id: 'b', label: 'Because the small piston must move much further than the large one.' },
          { id: 'c', label: 'Because the pressure is lower at the large piston.' },
          { id: 'd', label: 'It can create energy.' },
        ],
        correctId: 'b',
        explanation:
          'Force × distance stays the same in an ideal press: a force 100 times larger moves 100 times less far.',
      },
      {
        id: 'k3',
        question: 'A hydraulic jack has a small leak. What happens?',
        options: [
          { id: 'a', label: 'It lifts the load faster.' },
          { id: 'b', label: 'You must pump further for the same lift, so it is less efficient.' },
          { id: 'c', label: 'Its ideal mechanical advantage increases.' },
          { id: 'd', label: 'Nothing changes.' },
        ],
        correctId: 'b',
        explanation:
          'Leaked fluid does not push the large piston, so extra input travel (and work) is needed. The ideal ratio A₂ ÷ A₁ does not change.',
      },
    ],
  },
  Diagram: HydraulicDiagram,
  View3D: lazy(() => import('./Hydraulic3DView')),
};
