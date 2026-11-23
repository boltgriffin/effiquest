import type { Assessment, AssessmentItem } from '@/types';

/**
 * DRAFT item bank (decision D-10: developer drafts, teacher approves). Every item is traced to a
 * concept-note objective (SRC-O1..O6) and the misconception it targets (SRC-G1..G6). No item claims
 * alignment with official competency codes (D-07: codes not yet supplied).
 */

// ---------------------------------------------------------------------------------------------
// Diagnostic (baseline and post use the same items: SRC-N1 "baseline", SRC-T7 "post-diagnostic")
// ---------------------------------------------------------------------------------------------

const diagnosticItems: AssessmentItem[] = [
  {
    id: 'd-g1-1',
    kind: 'mcq',
    prompt:
      'In straight-line motion, a net force makes an object speed up (F = m a). What makes a wheel speed up its turning?',
    options: [
      { id: 'a', label: 'A net torque (turning effect)' },
      {
        id: 'b',
        label: 'Nothing: turning follows completely different rules',
        misconceptionId: 'G1',
      },
      { id: 'c', label: 'Only its mass' },
      { id: 'd', label: 'Only friction' },
    ],
    correctId: 'a',
    objective: 'SRC-O1',
    misconceptionId: 'G1',
    explanation:
      'Turning mirrors straight-line motion: τ_net = I α, just as F_net = m a. Torque plays the role of force.',
    status: 'draft',
  },
  {
    id: 'd-g1-2',
    kind: 'numeric',
    prompt:
      'A 40 N force pushes at right angles on a wrench, 0.25 m from the bolt. What is the torque on the bolt?',
    answer: 10,
    tolerance: 0.1,
    unit: 'N·m',
    objective: 'SRC-O1',
    misconceptionId: 'G1',
    explanation: 'τ = r F = 0.25 m × 40 N = 10 N·m.',
    status: 'draft',
  },
  {
    id: 'd-g2-1',
    kind: 'truefalse',
    prompt: 'A machine that makes a load easier to lift is always more efficient.',
    answer: false,
    objective: 'SRC-O2',
    misconceptionId: 'G2',
    explanation:
      'Making a job easier is mechanical advantage. Efficiency is about how much input work is wasted. A machine can do one well and the other badly.',
    status: 'draft',
  },
  {
    id: 'd-g2-2',
    kind: 'mcq',
    prompt:
      'Machine A has an ideal mechanical advantage of 4. Machine B has an ideal mechanical advantage of 2. Which statement must be true?',
    options: [
      { id: 'a', label: 'Machine A is more efficient than machine B.', misconceptionId: 'G2' },
      { id: 'b', label: 'Machine B is more efficient than machine A.' },
      { id: 'c', label: 'Their efficiencies cannot be found from these values alone.' },
      { id: 'd', label: 'Both machines are 100% efficient.', misconceptionId: 'G4' },
    ],
    correctId: 'c',
    objective: 'SRC-O2',
    misconceptionId: 'G2',
    explanation:
      'Ideal mechanical advantage depends only on geometry. Efficiency needs measured input and output work.',
    status: 'draft',
  },
  {
    id: 'd-g3-1',
    kind: 'matching',
    prompt: 'Match each everyday object with the simple machine it mainly uses.',
    pairs: [
      { id: 'p1', left: 'Doorknob', rightId: 'wheel' },
      { id: 'p2', left: 'Seesaw', rightId: 'lever' },
      { id: 'p3', left: 'Wheelchair ramp', rightId: 'incline' },
      { id: 'p4', left: 'Rope over the top of a flagpole', rightId: 'pulley' },
    ],
    choices: [
      { id: 'wheel', label: 'Wheel and axle' },
      { id: 'lever', label: 'Lever' },
      { id: 'incline', label: 'Inclined plane' },
      { id: 'pulley', label: 'Pulley' },
    ],
    objective: 'SRC-O3',
    misconceptionId: 'G3',
    explanation:
      'Doorknob: a wheel (knob) turns an axle (spindle). Seesaw: a lever on a fulcrum. Ramp: an inclined plane. Flagpole: a fixed pulley.',
    status: 'draft',
  },
  {
    id: 'd-g3-2',
    kind: 'numeric',
    prompt:
      'A compound machine joins two simple machines. The first is 80% efficient and the second is 50% efficient. What is the overall efficiency?',
    answer: 40,
    tolerance: 0.5,
    unit: '%',
    objective: 'SRC-O3',
    misconceptionId: 'G3',
    explanation:
      'Each machine passes on only part of what it receives: 0.80 × 0.50 = 0.40, so 40%. Combining machines multiplies their efficiencies.',
    status: 'draft',
  },
  {
    id: 'd-g4-1',
    kind: 'truefalse',
    prompt: 'A real machine can be 100% efficient if it is well made.',
    answer: false,
    objective: 'SRC-O2',
    misconceptionId: 'G4',
    explanation:
      'Every real machine loses some energy, for example to friction, so its efficiency is always below 100%. Good design only reduces the losses.',
    status: 'draft',
  },
  {
    id: 'd-g4-2',
    kind: 'mcq',
    prompt:
      'A machine gives out less useful work than the work put into it. Where does the rest of the energy go?',
    options: [
      { id: 'a', label: 'It is destroyed.' },
      { id: 'b', label: 'Mostly into heat from friction, and other losses.' },
      { id: 'c', label: 'It is stored inside the machine for later.' },
      {
        id: 'd',
        label: 'Nowhere: a well-made machine has no missing energy.',
        misconceptionId: 'G4',
      },
    ],
    correctId: 'b',
    objective: 'SRC-O5',
    misconceptionId: 'G4',
    explanation:
      'Energy is not destroyed. The missing part becomes mainly heat (friction), or goes into things like moving parts of the machine or leaking fluid.',
    status: 'draft',
  },
  {
    id: 'd-g5-1',
    kind: 'numeric',
    prompt:
      'A pulley system needs 250 J of input work to give 200 J of useful work. What is its efficiency?',
    answer: 80,
    tolerance: 0.5,
    unit: '%',
    objective: 'SRC-O5',
    misconceptionId: 'G5',
    explanation: 'η = W_out ÷ W_in × 100% = 200 J ÷ 250 J × 100% = 80%.',
    status: 'draft',
  },
  {
    id: 'd-g5-2',
    kind: 'numeric',
    prompt: 'A ramp is 75% efficient. How much input work is needed to raise a 300 N box by 1.0 m?',
    answer: 400,
    tolerance: 2,
    unit: 'J',
    objective: 'SRC-O6',
    misconceptionId: 'G5',
    explanation:
      'Useful work = 300 N × 1.0 m = 300 J. Input work = 300 J ÷ 0.75 = 400 J. The extra 100 J is lost, mostly to friction.',
    status: 'draft',
  },
  {
    id: 'd-g6-1',
    kind: 'numeric',
    prompt:
      'A brake pedal pushes a 2 cm² piston with 200 N. The fluid pushes on a 10 cm² brake piston. Ignoring losses, what force does the brake piston exert?',
    answer: 1000,
    tolerance: 5,
    unit: 'N',
    objective: 'SRC-O4',
    misconceptionId: 'G6',
    explanation:
      "Pascal's principle: the pressure is the same in the fluid, so F₂ = F₁ × A₂ ÷ A₁ = 200 N × 10 ÷ 2 = 1000 N.",
    status: 'draft',
  },
  {
    id: 'd-g6-2',
    kind: 'mcq',
    prompt: 'Why is a leak in a car’s hydraulic brake line dangerous?',
    options: [
      {
        id: 'a',
        label:
          'Fluid escapes, so the pedal pushes further and the brakes may not get enough force.',
      },
      { id: 'b', label: 'The fluid becomes heavier.' },
      { id: 'c', label: 'It increases the ideal mechanical advantage.' },
      {
        id: 'd',
        label: 'It makes no difference, because the pressure is the same everywhere.',
        misconceptionId: 'G6',
      },
    ],
    correctId: 'a',
    objective: 'SRC-O4, SRC-O6',
    misconceptionId: 'G6',
    explanation:
      'Leaking fluid does not push the brake pistons. The pedal must travel further, and pressure (and braking force) may not build up.',
    status: 'draft',
  },
  {
    id: 'd-reflect',
    kind: 'reflection',
    prompt:
      'In your own words, what is the difference between mechanical advantage and efficiency? (Not scored.)',
    minChars: 20,
    objective: 'SRC-O2',
    misconceptionId: 'G2',
    status: 'draft',
  },
];

export const baselineDiagnostic: Assessment = {
  id: 'diagnostic-baseline',
  kind: 'baseline',
  mode: 'test',
  title: 'Baseline diagnostic',
  version: '1.0.0-draft',
  revealAnswers: false,
  items: diagnosticItems,
};

export const postDiagnostic: Assessment = {
  id: 'diagnostic-post',
  kind: 'post',
  mode: 'test',
  title: 'Post diagnostic',
  version: '1.0.0-draft',
  revealAnswers: true,
  items: diagnosticItems,
};

// ---------------------------------------------------------------------------------------------
// Quest knowledge checks (practice: immediate feedback, retries)
// ---------------------------------------------------------------------------------------------

const check = (id: string, title: string, items: AssessmentItem[]): Assessment => ({
  id,
  kind: 'quest_check',
  mode: 'practice',
  title,
  version: '1.0.0-draft',
  revealAnswers: true,
  items,
});

export const questChecks: readonly Assessment[] = [
  check('check-effort-vs-efficiency', 'Knowledge check: less effort, more efficient?', [
    {
      id: 'q1-1',
      kind: 'truefalse',
      prompt:
        'A ramp with an ideal mechanical advantage of 5 wastes five times less energy than a ramp with an ideal mechanical advantage of 1.',
      answer: false,
      objective: 'SRC-O2',
      misconceptionId: 'G2',
      explanation:
        'IMA tells you how much the force is reduced, not how much energy is wasted. A longer, gentler ramp often wastes more energy to friction.',
      status: 'draft',
    },
    {
      id: 'q1-2',
      kind: 'numeric',
      prompt:
        'A lever lifts a 120 N load with a measured effort of 50 N. What is its actual mechanical advantage?',
      answer: 2.4,
      tolerance: 0.05,
      unit: '',
      objective: 'SRC-O2',
      misconceptionId: 'G2',
      explanation: 'AMA = F_out ÷ F_in = 120 N ÷ 50 N = 2.4.',
      status: 'draft',
    },
    {
      id: 'q1-3',
      kind: 'mcq',
      prompt:
        'Two ramps have the same surface. Ramp A: AMA 3.0, efficiency 71%. Ramp B: AMA 1.7, efficiency 85%. Which statement do these data support?',
      options: [
        { id: 'a', label: 'Ramp A makes lifting easier, but ramp B wastes less energy.' },
        { id: 'b', label: 'Ramp A is better in every way.', misconceptionId: 'G2' },
        { id: 'c', label: 'Ramp B makes lifting easier.' },
        { id: 'd', label: 'Both ramps waste the same energy.' },
      ],
      correctId: 'a',
      objective: 'SRC-O2',
      misconceptionId: 'G2',
      explanation:
        'A higher AMA means less effort; a higher efficiency means less waste. Here they belong to different ramps: the gentler ramp A needs less effort but loses more work to friction.',
      status: 'draft',
    },
  ]),
  check('check-perfect-machine', 'Knowledge check: where does the energy go?', [
    {
      id: 'q2-1',
      kind: 'numeric',
      prompt:
        'A pulley system needs 600 J of input work to give 480 J of useful work. How much energy is lost?',
      answer: 120,
      tolerance: 0.5,
      unit: 'J',
      objective: 'SRC-O5',
      misconceptionId: 'G4',
      explanation: 'Lost energy = input work − useful work = 600 J − 480 J = 120 J.',
      status: 'draft',
    },
    {
      id: 'q2-2',
      kind: 'matching',
      prompt: 'Match each energy loss with the lab machine where you saw it.',
      pairs: [
        { id: 'p1', left: 'Fluid leaking past the seals', rightId: 'hydraulic' },
        { id: 'p2', left: 'Lifting the movable block', rightId: 'pulley' },
        { id: 'p3', left: 'The block rubbing on the surface', rightId: 'incline' },
        { id: 'p4', left: 'Friction in the axle bearing', rightId: 'wheel' },
      ],
      choices: [
        { id: 'hydraulic', label: 'Hydraulic press' },
        { id: 'pulley', label: 'Pulley system' },
        { id: 'incline', label: 'Inclined plane' },
        { id: 'wheel', label: 'Wheel and axle' },
      ],
      objective: 'SRC-O5',
      misconceptionId: 'G4',
      explanation:
        'Each real machine has its own losses: leakage (press), the block’s weight (pulley), sliding friction (ramp), bearing friction (wheel and axle).',
      status: 'draft',
    },
    {
      id: 'q2-3',
      kind: 'truefalse',
      prompt:
        'In an ideal machine with no friction or other losses, the useful work out equals the work put in.',
      answer: true,
      objective: 'SRC-O2',
      misconceptionId: 'G4',
      explanation: 'With no losses, efficiency would be 100%. Real machines are never ideal.',
      status: 'draft',
    },
  ]),
  check('check-turning-forces', 'Knowledge check: pushing straight, turning round', [
    {
      id: 'q3-1',
      kind: 'numeric',
      prompt:
        'A 30 N force pushes at right angles on a door, 0.50 m from the hinge. What is the torque?',
      answer: 15,
      tolerance: 0.1,
      unit: 'N·m',
      objective: 'SRC-O1',
      misconceptionId: 'G1',
      explanation: 'τ = r F = 0.50 m × 30 N = 15 N·m.',
      status: 'draft',
    },
    {
      id: 'q3-2',
      kind: 'matching',
      prompt: 'Match each straight-line quantity with its turning (rotational) partner.',
      pairs: [
        { id: 'p1', left: 'Force', rightId: 'torque' },
        { id: 'p2', left: 'Mass', rightId: 'inertia' },
        { id: 'p3', left: 'Acceleration', rightId: 'alpha' },
        { id: 'p4', left: 'Distance moved', rightId: 'angle' },
      ],
      choices: [
        { id: 'torque', label: 'Torque' },
        { id: 'inertia', label: 'Moment of inertia' },
        { id: 'alpha', label: 'Angular acceleration' },
        { id: 'angle', label: 'Angle turned' },
      ],
      objective: 'SRC-O1',
      misconceptionId: 'G1',
      explanation:
        'F = m a becomes τ = I α: torque ↔ force, moment of inertia ↔ mass, angular acceleration ↔ acceleration, angle ↔ distance.',
      status: 'draft',
    },
    {
      id: 'q3-3',
      kind: 'mcq',
      prompt: 'Why is it hard to open a door by pushing near the hinge?',
      options: [
        { id: 'a', label: 'The lever arm is short, so the same force gives less torque.' },
        { id: 'b', label: 'The door is heavier near the hinge.' },
        { id: 'c', label: 'Friction is larger near the hinge.' },
        { id: 'd', label: 'Torque does not depend on where you push.', misconceptionId: 'G1' },
      ],
      correctId: 'a',
      objective: 'SRC-O1',
      misconceptionId: 'G1',
      explanation:
        'Torque = force × distance from the hinge. Close to the hinge, you need a much bigger force for the same turning effect.',
      status: 'draft',
    },
  ]),
  check('check-pressure-at-work', 'Knowledge check: pressure at work', [
    {
      id: 'q4-1',
      kind: 'numeric',
      prompt:
        'A force of 150 N pushes on a piston of area 0.003 m². What pressure does it create, in kPa?',
      answer: 50,
      tolerance: 0.5,
      unit: 'kPa',
      objective: 'SRC-O4',
      misconceptionId: 'G6',
      explanation: 'P = F ÷ A = 150 N ÷ 0.003 m² = 50 000 Pa = 50 kPa.',
      status: 'draft',
    },
    {
      id: 'q4-2',
      kind: 'truefalse',
      prompt: 'In a hydraulic press, the large piston moves the same distance as the small piston.',
      answer: false,
      objective: 'SRC-O4',
      misconceptionId: 'G6',
      explanation:
        'The same volume of fluid moves, so the large piston moves A₁ ÷ A₂ as far. Force goes up, distance goes down.',
      status: 'draft',
    },
    {
      id: 'q4-3',
      kind: 'numeric',
      prompt:
        'A car lift has pistons of 0.002 m² and 0.2 m². Ignoring losses, what force on the small piston holds up a 9800 N car?',
      answer: 98,
      tolerance: 1,
      unit: 'N',
      objective: 'SRC-O4',
      misconceptionId: 'G6',
      explanation: 'F₁ = F₂ × A₁ ÷ A₂ = 9800 N × 0.002 ÷ 0.2 = 98 N.',
      status: 'draft',
    },
  ]),
];

export const allAssessments: readonly Assessment[] = [
  baselineDiagnostic,
  postDiagnostic,
  ...questChecks,
];

export function findAssessment(id: string | undefined): Assessment | undefined {
  return allAssessments.find((a) => a.id === id);
}
