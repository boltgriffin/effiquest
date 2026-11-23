import type { IconName } from '@/components/icons/Icon';
import type { MisconceptionId } from '@/types';

/**
 * Module skeletons. Titles and objectives restate the concept note's specific objectives
 * (SRC-O1..O6). Draft lesson text lives in content/lessons.ts (decision D-10: drafted by the
 * developer, approved by the teacher); videos come from the teacher. Equations come from
 * docs/PHYSICS_MODEL_PLAN.md.
 */
export interface Equation {
  id: string;
  name: string;
  /** Rendered with sub/sup markup in components/EquationCard. */
  expression: string;
  where: string;
}

export interface ModuleOutline {
  id: string;
  title: string;
  objective: string;
  source: string;
  icon: IconName;
  misconceptionIds: MisconceptionId[];
  equations: Equation[];
}

export const modules: readonly ModuleOutline[] = [
  {
    id: 'torque',
    title: 'Torque and rotational motion',
    objective:
      'Apply translational motion formulas to rotational contexts such as torque and angular acceleration.',
    source: 'SRC-O1',
    icon: 'reset',
    misconceptionIds: ['G1'],
    equations: [
      {
        id: 'torque',
        name: 'Torque',
        expression: 'τ = r F sin θ',
        where: 'r in m, F in N, τ in N·m',
      },
      {
        id: 'newton-rot',
        name: "Newton's second law, rotational",
        expression: 'τ_net = I α',
        where: 'I in kg·m², α in rad/s²',
      },
    ],
  },
  {
    id: 'advantage-efficiency',
    title: 'Mechanical advantage and efficiency',
    objective:
      'Differentiate mechanical advantage from efficiency, and recognize friction, energy loss and real-world limits.',
    source: 'SRC-O2',
    icon: 'gauge',
    misconceptionIds: ['G2', 'G4'],
    equations: [
      { id: 'work', name: 'Work', expression: 'W = F d cos θ', where: 'F in N, d in m, W in J' },
      {
        id: 'ama',
        name: 'Actual mechanical advantage',
        expression: 'AMA = F_out / F_in',
        where: 'dimensionless',
      },
      {
        id: 'ima',
        name: 'Ideal mechanical advantage (velocity ratio)',
        expression: 'IMA = d_in / d_out',
        where: 'dimensionless',
      },
      { id: 'eff', name: 'Efficiency', expression: 'η = W_out / W_in × 100%', where: 'η in %' },
    ],
  },
  {
    id: 'simple-compound',
    title: 'From simple to compound machines',
    objective:
      'Explain how the lever, pulley, wheel and axle, inclined plane, screw and wedge combine to form complex machines.',
    source: 'SRC-O3',
    icon: 'lever',
    misconceptionIds: ['G3'],
    equations: [
      {
        id: 'eff-chain',
        name: 'Overall efficiency of machines in series',
        expression: 'η_total = η_1 × η_2 × …',
        where: 'each η as a fraction',
      },
    ],
  },
  {
    id: 'hydraulics',
    title: "Hydraulics and Pascal's principle",
    objective:
      "Apply basic hydraulic principles such as Pascal's law to real systems, including brakes, lifts and excavators.",
    source: 'SRC-O4',
    icon: 'hydraulic',
    misconceptionIds: ['G6'],
    equations: [
      {
        id: 'pressure',
        name: 'Pressure',
        expression: 'P = F / A',
        where: 'F in N, A in m², P in Pa',
      },
      {
        id: 'pascal',
        name: "Pascal's principle",
        expression: 'F_2 / F_1 = A_2 / A_1',
        where: 'ideal, incompressible fluid',
      },
    ],
  },
  {
    id: 'efficiency-practice',
    title: 'Measuring efficiency in real machines',
    objective:
      'Measure input and output forces, calculate efficiency, and analyze energy losses; apply this to practical scenarios.',
    source: 'SRC-O5, SRC-O6',
    icon: 'lab',
    misconceptionIds: ['G4', 'G5'],
    equations: [
      { id: 'power', name: 'Power', expression: 'P = W / t', where: 'W in J, t in s, P in W' },
      { id: 'eff2', name: 'Efficiency', expression: 'η = W_out / W_in × 100%', where: 'η in %' },
    ],
  },
];

export function findModule(id: string | undefined): ModuleOutline | undefined {
  return modules.find((m) => m.id === id);
}
