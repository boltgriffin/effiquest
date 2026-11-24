import type { AssessmentItem, ContentStatus, MisconceptionId } from '@/types';
import type { Equation } from './modules';
import type { LabId } from './quests';

/**
 * DRAFT lesson text for the five modules (Milestone 12). Decision D-10: the developer drafts from
 * the concept note's objectives; the teacher approves or edits. Every section names its source
 * (SRC-O / SRC-G / SRC-M / SRC-T codes, docs/SOURCE_REQUIREMENTS.md). Worked-example answers are
 * recomputed with edu-calc in lessons.test.ts. Videos are teacher-chosen YouTube links (Video tab, D-27).
 */

export type LessonBlock =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; caption: string; headers: string[]; rows: string[][] }
  | { kind: 'equation'; equation: Equation }
  | {
      kind: 'example';
      id: string;
      title: string;
      problem: string;
      steps: string[];
      answer: { value: number; unit: string };
    }
  /** "Common idea" (the misconception, from content/misconceptions) answered with evidence. */
  | { kind: 'idea'; misconceptionId: MisconceptionId; evidence: string }
  | { kind: 'lab'; labId: LabId; prompt: string }
  /** Practice question with feedback; not recorded. */
  | { kind: 'check'; item: AssessmentItem };

export interface LessonSection {
  id: string;
  title: string;
  /** Source codes this section is drafted from. */
  source: string;
  blocks: LessonBlock[];
  /** Shown as a visible note until the teacher confirms (e.g. decision D-13). */
  pendingCheck?: string;
}

export interface Lesson {
  moduleId: string;
  status: ContentStatus;
  version: string;
  intro: string;
  sections: LessonSection[];
}

/** Omit over each member of a union (plain Omit would keep only the shared fields). */
type DraftItem = AssessmentItem extends infer T
  ? T extends unknown
    ? Omit<T, 'status'>
    : never
  : never;

const check = (item: DraftItem): LessonBlock => ({
  kind: 'check',
  item: { ...item, status: 'draft' } as AssessmentItem,
});

// ---------------------------------------------------------------------------------------------
// Module 1: Torque and rotational motion (SRC-O1, SRC-G1)
// ---------------------------------------------------------------------------------------------
const torque: Lesson = {
  moduleId: 'torque',
  status: 'draft',
  version: '1.0.0-draft',
  intro:
    'You already know how forces make things speed up in a straight line. Turning motion follows the same ideas, with a partner for every straight-line quantity. In this lesson you will use those partners to explain why doors, wrenches and levers work the way they do.',
  sections: [
    {
      id: 'partners',
      title: 'Straight-line ideas have turning partners',
      source: 'SRC-O1, SRC-G1, SRC-M5',
      blocks: [
        {
          kind: 'text',
          text: 'In straight-line motion, a net force changes how an object moves. In turning motion, a net torque changes how an object turns. Each straight-line quantity has a turning (rotational) partner, and the equations keep the same shape.',
        },
        {
          kind: 'table',
          caption: 'Straight-line quantities and their turning partners',
          headers: ['Straight line', 'Turning', 'Unit (turning)'],
          rows: [
            ['Displacement d', 'Angle turned θ', 'rad'],
            ['Velocity v', 'Angular velocity ω', 'rad/s'],
            ['Acceleration a', 'Angular acceleration α', 'rad/s²'],
            ['Force F', 'Torque τ', 'N·m'],
            ['Mass m', 'Moment of inertia I', 'kg·m²'],
            ['F = m a', 'τ = I α', ''],
            ['W = F d', 'W = τ θ', 'J'],
          ],
        },
        {
          kind: 'idea',
          misconceptionId: 'G1',
          evidence:
            'Compare the two columns: every turning equation has the same form as a straight-line equation you already use. You are not learning new physics, only new partners.',
        },
      ],
    },
    {
      id: 'torque',
      title: 'Torque: the turning effect of a force',
      source: 'SRC-O1',
      blocks: [
        {
          kind: 'text',
          text: 'How strongly a force turns an object depends on three things: how big the force is, how far from the pivot it acts (the lever arm r), and its direction. A push straight towards the pivot does not turn anything.',
        },
        {
          kind: 'equation',
          equation: {
            id: 'torque',
            name: 'Torque',
            expression: 'τ = r F sin θ',
            where: 'θ is the angle between the lever arm and the force; at right angles sin θ = 1',
          },
        },
        {
          kind: 'example',
          id: 'torque-door',
          title: 'Pushing a door',
          problem:
            'You push a door with 40 N, at right angles to the door, 0.80 m from the hinges. What is the torque? What if you push with the same force only 0.20 m from the hinges?',
          steps: [
            'At right angles, θ = 90°, so sin θ = 1.',
            'τ = r F = 0.80 m × 40 N = 32 N·m.',
            'Near the hinges: τ = 0.20 m × 40 N = 8 N·m, four times smaller. That is why doors are hard to push near the hinges.',
          ],
          answer: { value: 32, unit: 'N·m' },
        },
        {
          kind: 'example',
          id: 'torque-angle',
          title: 'Pushing at an angle',
          problem:
            'The same 40 N push acts 0.80 m from the hinges, but at 30° to the door instead of at right angles. What is the torque?',
          steps: ['τ = r F sin θ = 0.80 m × 40 N × sin 30°.', 'sin 30° = 0.5, so τ = 16 N·m.'],
          answer: { value: 16, unit: 'N·m' },
        },
        check({
          id: 'lt-1',
          kind: 'mcq',
          prompt:
            'You want the biggest turning effect on a wrench with the same push. Where and how should you push?',
          options: [
            { id: 'a', label: 'At the far end of the handle, at right angles to it' },
            { id: 'b', label: 'Near the bolt, at right angles to the handle' },
            { id: 'c', label: 'At the far end, pushing along the handle towards the bolt' },
            { id: 'd', label: 'It makes no difference', misconceptionId: 'G1' },
          ],
          correctId: 'a',
          objective: 'SRC-O1',
          misconceptionId: 'G1',
          explanation:
            'Torque = r F sin θ is largest with the longest lever arm (far end) and θ = 90°. Pushing along the handle gives sin θ = 0: no torque at all.',
        }),
      ],
    },
    {
      id: 'newton-rotation',
      title: "Newton's second law for turning",
      source: 'SRC-O1',
      blocks: [
        {
          kind: 'text',
          text: 'A net force gives a mass an acceleration (F = m a). In the same way, a net torque gives an object an angular acceleration. The moment of inertia I plays the part of mass: it is larger when more mass sits far from the axis, which makes the object harder to start or stop turning.',
        },
        {
          kind: 'equation',
          equation: {
            id: 'newton-rot',
            name: "Newton's second law, rotational",
            expression: 'τ_net = I α',
            where: 'I in kg·m², α in rad/s²',
          },
        },
        {
          kind: 'example',
          id: 'angular-acc',
          title: 'Spinning up a bicycle wheel',
          problem:
            'A bicycle wheel has a moment of inertia of 0.12 kg·m². A net torque of 0.60 N·m acts on it. What is its angular acceleration?',
          steps: ['α = τ_net ÷ I.', 'α = 0.60 N·m ÷ 0.12 kg·m² = 5.0 rad/s².'],
          answer: { value: 5, unit: 'rad/s²' },
        },
        check({
          id: 'lt-2',
          kind: 'numeric',
          prompt: 'A 25 N force acts at right angles, 0.40 m from a pivot. What is the torque?',
          answer: 10,
          tolerance: 0.1,
          unit: 'N·m',
          objective: 'SRC-O1',
          misconceptionId: 'G1',
          explanation: 'τ = r F = 0.40 m × 25 N = 10 N·m.',
        }),
        {
          kind: 'lab',
          labId: 'lever',
          prompt:
            'In the lever lab, a lever balances when the turning effects on both sides are equal. Move the fulcrum and watch how the effort changes.',
        },
        {
          kind: 'lab',
          labId: 'wheel_axle',
          prompt: 'In the wheel and axle lab, a small force on the big wheel makes a big torque.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// Module 2: Mechanical advantage and efficiency (SRC-O2, SRC-G2, SRC-G4)
// ---------------------------------------------------------------------------------------------
const advantageEfficiency: Lesson = {
  moduleId: 'advantage-efficiency',
  status: 'draft',
  version: '1.0.0-draft',
  intro:
    'Machines make work easier, but "easier" and "efficient" are not the same thing. In this lesson you will measure both for one machine and see why a machine that saves effort can still waste energy.',
  sections: [
    {
      id: 'work',
      title: 'Machines trade force for distance',
      source: 'SRC-O2',
      blocks: [
        {
          kind: 'text',
          text: 'Work is force times the distance moved in the direction of the force. A machine can let you use a smaller force, but then you must move that force through a longer distance. A machine never gives out more work than you put in.',
        },
        {
          kind: 'equation',
          equation: {
            id: 'work',
            name: 'Work',
            expression: 'W = F d cos θ',
            where: 'F in N, d in m, W in J',
          },
        },
        {
          kind: 'list',
          items: [
            'Input work W_in: the effort force × the distance the effort moves.',
            'Output (useful) work W_out: the load force × the distance the load moves.',
          ],
        },
      ],
    },
    {
      id: 'advantage',
      title: 'Mechanical advantage: how much easier?',
      source: 'SRC-O2',
      blocks: [
        {
          kind: 'text',
          text: 'Actual mechanical advantage (AMA) compares the forces you measure. Ideal mechanical advantage (IMA) compares the distances: it is what the machine would give with no losses at all.',
        },
        {
          kind: 'equation',
          equation: {
            id: 'ama',
            name: 'Actual mechanical advantage',
            expression: 'AMA = F_out / F_in',
            where: 'measured forces',
          },
        },
        {
          kind: 'equation',
          equation: {
            id: 'ima',
            name: 'Ideal mechanical advantage',
            expression: 'IMA = d_in / d_out',
            where: 'distances moved by the effort and the load',
          },
        },
      ],
    },
    {
      id: 'efficiency',
      title: 'Efficiency: how much work is wasted?',
      source: 'SRC-O2, SRC-G4',
      blocks: [
        {
          kind: 'equation',
          equation: {
            id: 'eff',
            name: 'Efficiency',
            expression: 'η = W_out / W_in × 100%',
            where: 'also η = AMA / IMA × 100%',
          },
        },
        {
          kind: 'example',
          id: 'ramp',
          title: 'One ramp, two questions',
          problem:
            'A 200 N box is pushed up a ramp 2.0 m long to a height of 0.50 m. The measured push along the ramp is 65 N. Find the IMA, the AMA and the efficiency.',
          steps: [
            'IMA = d_in ÷ d_out = 2.0 m ÷ 0.50 m = 4.0.',
            'AMA = F_out ÷ F_in = 200 N ÷ 65 N ≈ 3.08.',
            'W_out = 200 N × 0.50 m = 100 J; W_in = 65 N × 2.0 m = 130 J.',
            'η = 100 J ÷ 130 J × 100% ≈ 76.9%. (Check: AMA ÷ IMA = 3.08 ÷ 4.0 ≈ 0.769.)',
            'The ramp makes the job about 3 times easier, but about 23% of the input work (30 J) is lost, mostly to friction as heat.',
          ],
          answer: { value: 76.9, unit: '%' },
        },
        {
          kind: 'idea',
          misconceptionId: 'G2',
          evidence:
            'The ramp above has a large mechanical advantage but still wastes almost a quarter of the work. A gentler ramp would be even easier to push, yet it usually wastes more, because the box rubs over a longer surface. Mechanical advantage and efficiency answer different questions.',
        },
        {
          kind: 'idea',
          misconceptionId: 'G4',
          evidence:
            'Every real machine has friction, so η is always below 100%. If an experiment gives more than 100%, a measurement is wrong: the machine did not create energy.',
        },
        check({
          id: 'la-1',
          kind: 'truefalse',
          prompt: "If a machine's AMA is smaller than its IMA, some of the input work was lost.",
          answer: true,
          objective: 'SRC-O2',
          misconceptionId: 'G4',
          explanation:
            'η = AMA ÷ IMA. AMA below IMA means η is below 100%: part of the input work became heat or moved parts of the machine.',
        }),
        check({
          id: 'la-2',
          kind: 'numeric',
          prompt:
            'A pulley system lifts a 300 N load by 0.50 m. The effort does 200 J of work. What is its efficiency?',
          answer: 75,
          tolerance: 0.5,
          unit: '%',
          objective: 'SRC-O2',
          misconceptionId: 'G2',
          explanation: 'W_out = 300 N × 0.50 m = 150 J. η = 150 J ÷ 200 J × 100% = 75%.',
        }),
        {
          kind: 'lab',
          labId: 'incline',
          prompt:
            'In the inclined plane lab, compare a steep and a gentle ramp: which is easier, and which is more efficient?',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// Module 3: From simple to compound machines (SRC-O3, SRC-G3)
// ---------------------------------------------------------------------------------------------
const simpleCompound: Lesson = {
  moduleId: 'simple-compound',
  status: 'draft',
  version: '1.0.0-draft',
  intro:
    'Bicycles, car jacks and farm tools look complicated, but they are built from six simple machines. In this lesson you will find the simple machines inside compound machines and see how their advantages and efficiencies combine.',
  sections: [
    {
      id: 'six',
      title: 'The six simple machines',
      source: 'SRC-O3',
      blocks: [
        {
          kind: 'text',
          text: 'Each simple machine lets a small effort move a large load by making the effort move further. Its ideal mechanical advantage comes from its shape.',
        },
        {
          kind: 'table',
          caption: 'Ideal mechanical advantage of the simple machines (no friction)',
          headers: ['Machine', 'Example', 'IMA'],
          rows: [
            ['Lever', 'Seesaw, crowbar', 'effort arm ÷ load arm'],
            ['Wheel and axle', 'Doorknob, steering wheel', 'wheel radius ÷ axle radius'],
            ['Pulley', 'Flagpole, block and tackle', 'number of supporting rope segments'],
            ['Inclined plane', 'Ramp', 'ramp length ÷ height'],
            ['Wedge', 'Axe, knife, plough blade', 'about length ÷ thickness'],
            ['Screw', 'Jack screw, bolt', 'handle circumference ÷ pitch'],
          ],
        },
        {
          kind: 'text',
          text: 'The lab has all six simple machines, the hydraulic press, and two compound machines: a bicycle and a hydraulic brake.',
        },
        {
          kind: 'lab',
          labId: 'screw',
          prompt:
            'The screw is an inclined plane wrapped round a cylinder: compare a fine and a coarse thread in the screw jack lab.',
        },
        {
          kind: 'lab',
          labId: 'wedge',
          prompt:
            'The wedge is a moving inclined plane: try a thin and a thick wedge and compare the efficiency.',
        },
      ],
    },
    {
      id: 'compound',
      title: 'Compound machines: one machine drives the next',
      source: 'SRC-O3, SRC-G3, SRC-T5',
      blocks: [
        {
          kind: 'text',
          text: 'In a compound machine, the output of one simple machine is the input of the next. The ideal mechanical advantages multiply. So do the efficiencies, which means a compound machine is always less efficient than its best part.',
        },
        {
          kind: 'equation',
          equation: {
            id: 'ima-chain',
            name: 'Machines in series',
            expression: 'IMA_total = IMA_1 × IMA_2; η_total = η_1 × η_2',
            where: 'each η as a fraction',
          },
        },
        {
          kind: 'example',
          id: 'jack',
          title: 'A hydraulic car jack',
          problem:
            'A car jack has a lever handle (IMA 8, efficiency 90%) that pushes a hydraulic press (IMA 25, efficiency 80%). Find the overall IMA, the overall efficiency and the overall AMA.',
          steps: [
            'IMA_total = 8 × 25 = 200.',
            'η_total = 0.90 × 0.80 = 0.72, so 72%.',
            'AMA_total = η × IMA = 0.72 × 200 = 144: a 100 N push can hold up about 14 400 N.',
          ],
          answer: { value: 72, unit: '%' },
        },
        {
          kind: 'list',
          items: [
            'Bicycle: the pedal and crank form a wheel and axle; the chain links two sprockets (wheels and axles); the back wheel is another wheel and axle.',
            'Wheelbarrow: a lever (the wheel is the fulcrum) with a wheel and axle.',
            'Hand water pump: a lever moves a piston up and down.',
          ],
        },
        {
          kind: 'idea',
          misconceptionId: 'G3',
          evidence:
            'A compound machine is not a new kind of machine to memorize: it is simple machines in a chain. Name each part, and you can work out its advantage and efficiency from its parts.',
        },
        {
          kind: 'lab',
          labId: 'bicycle',
          prompt:
            'The bicycle lab follows your push through the crank, chain, sprocket, wheel and hill. Change the gear and see which machine changes.',
        },
        {
          kind: 'lab',
          labId: 'brake',
          prompt:
            'The hydraulic brake lab chains a lever, a hydraulic press and friction: see how the pedal force is multiplied on its way to the tyre.',
        },
        check({
          id: 'lc-1',
          kind: 'mcq',
          prompt: 'Which simple machines work together in a wheelbarrow?',
          options: [
            { id: 'a', label: 'A lever and a wheel and axle' },
            { id: 'b', label: 'A pulley and a wedge' },
            { id: 'c', label: 'A screw and an inclined plane' },
            { id: 'd', label: 'None: it is a separate kind of machine', misconceptionId: 'G3' },
          ],
          correctId: 'a',
          objective: 'SRC-O3',
          misconceptionId: 'G3',
          explanation:
            'The wheel is the fulcrum of a lever (load between fulcrum and handles), and it turns on an axle.',
        }),
        check({
          id: 'lc-2',
          kind: 'numeric',
          prompt:
            'Two machines in a row are 90% and 70% efficient. What is the overall efficiency?',
          answer: 63,
          tolerance: 0.5,
          unit: '%',
          objective: 'SRC-O3',
          misconceptionId: 'G3',
          explanation: '0.90 × 0.70 = 0.63, so 63%: lower than either machine alone.',
        }),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// Module 4: Hydraulics and Pascal's principle (SRC-O4, SRC-G6)
// ---------------------------------------------------------------------------------------------
const hydraulics: Lesson = {
  moduleId: 'hydraulics',
  status: 'draft',
  version: '1.0.0-draft',
  intro:
    "A light push on a brake pedal can stop a heavy vehicle, and a hand pump can lift a car. Both use Pascal's principle. In this lesson you will apply it to real systems and see what limits them.",
  sections: [
    {
      id: 'pressure',
      title: 'Pressure in a fluid',
      source: 'SRC-O4',
      blocks: [
        {
          kind: 'text',
          text: 'Pressure is force per unit area. The same force on a smaller area gives a larger pressure.',
        },
        {
          kind: 'equation',
          equation: {
            id: 'pressure',
            name: 'Pressure',
            expression: 'P = F / A',
            where: 'F in N, A in m², P in Pa (1 kPa = 1000 Pa)',
          },
        },
        {
          kind: 'example',
          id: 'pressure-piston',
          title: 'Pressure under a piston',
          problem:
            'A force of 120 N pushes on a piston of area 0.0020 m². What pressure does it make?',
          steps: ['P = F ÷ A = 120 N ÷ 0.0020 m² = 60 000 Pa.', '60 000 Pa = 60 kPa.'],
          answer: { value: 60, unit: 'kPa' },
        },
      ],
    },
    {
      id: 'pascal',
      title: "Pascal's principle",
      source: 'SRC-O4, SRC-G6',
      blocks: [
        {
          kind: 'text',
          text: 'In an enclosed liquid that cannot be compressed, a pressure applied at one point is passed on equally to every part of the liquid. A small piston makes the pressure; a large piston feels the same pressure over a bigger area, so it pushes with a bigger force.',
        },
        {
          kind: 'equation',
          equation: {
            id: 'pascal',
            name: "Pascal's principle",
            expression: 'F_2 = F_1 × A_2 / A_1',
            where: 'ideal: incompressible fluid, no leaks, no friction',
          },
        },
        {
          kind: 'example',
          id: 'car-lift',
          title: 'A car lift',
          problem:
            'The small piston of a lift has an area of 0.0010 m² and the large piston 0.050 m². A force of 300 N pushes the small piston. What force can the large piston exert? How far must the small piston move in total to raise the car by 0.10 m?',
          steps: [
            'A_2 ÷ A_1 = 0.050 ÷ 0.0010 = 50.',
            'F_2 = 300 N × 50 = 15 000 N.',
            'The same volume of fluid moves, so d_1 = d_2 × A_2 ÷ A_1 = 0.10 m × 50 = 5.0 m, usually as many short pump strokes.',
            'Force is multiplied by 50, distance divided by 50: no free energy.',
          ],
          answer: { value: 15000, unit: 'N' },
        },
        check({
          id: 'lh-1',
          kind: 'truefalse',
          prompt:
            'In a hydraulic lift, the large piston moves a shorter distance than the small piston.',
          answer: true,
          objective: 'SRC-O4',
          misconceptionId: 'G6',
          explanation:
            'The same volume of fluid fills a wider cylinder to a smaller height: d_2 = d_1 × A_1 ÷ A_2.',
        }),
      ],
    },
    {
      id: 'real-systems',
      title: 'Brakes, lifts and excavators: real systems, real limits',
      source: 'SRC-O4, SRC-G6, SRC-M4',
      blocks: [
        {
          kind: 'list',
          items: [
            'Car brakes: the pedal is a lever that pushes a small piston (the master cylinder). Brake lines carry the pressure to wider pistons at each wheel, which press the brake pads.',
            'Car lift or jack: a handle (lever) pumps a small piston; a one-way valve keeps the fluid under the large piston.',
            'Excavator: an engine-driven pump makes the pressure; valves send fluid to long cylinders that move the boom, arm and bucket.',
          ],
        },
        {
          kind: 'text',
          text: 'Real hydraulic systems are not perfect. Seals rub on the cylinder walls (friction), some fluid leaks past the seals, and the oil warms up. Air bubbles are a serious problem: air can be compressed, so part of the push squeezes the air instead of moving the pistons.',
        },
        {
          kind: 'idea',
          misconceptionId: 'G6',
          evidence:
            "Pascal's principle is the same in the textbook diagram and in a brake system. What changes in the real system is the losses: leaks and air make you push further for the same force, and friction turns part of the work into heat.",
        },
        check({
          id: 'lh-2',
          kind: 'mcq',
          prompt: 'Why does air in the brake lines make braking weaker?',
          options: [
            {
              id: 'a',
              label:
                'Air can be compressed, so the pedal squeezes the air instead of passing on the pressure',
            },
            { id: 'b', label: 'Air is heavier than brake fluid' },
            { id: 'c', label: 'Air increases the area of the pistons' },
            {
              id: 'd',
              label: 'It does not: pressure is always passed on equally',
              misconceptionId: 'G6',
            },
          ],
          correctId: 'a',
          objective: 'SRC-O4',
          misconceptionId: 'G6',
          explanation:
            "Pascal's principle assumes a fluid that cannot be compressed. Air can, so the pedal travels further and the pressure at the wheels builds up less.",
        }),
        {
          kind: 'lab',
          labId: 'hydraulic',
          prompt:
            'In the hydraulic press lab, set the leakage to 0 and then increase it: watch how far you must push for the same lift.',
        },
        {
          kind: 'lab',
          labId: 'brake',
          prompt:
            'In the hydraulic brake lab, follow the force from the pedal to the pads and on to the tyre.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// Module 5: Measuring efficiency in real machines (SRC-O5, SRC-O6, SRC-G4, SRC-G5)
// ---------------------------------------------------------------------------------------------
const efficiencyPractice: Lesson = {
  moduleId: 'efficiency-practice',
  status: 'draft',
  version: '1.0.0-draft',
  intro:
    'Efficiency is not only a definition: you can measure it, explain where the losses go, and use it to judge real situations. In this lesson you will plan a measurement, account for every joule, and apply efficiency to a bicycle and to brakes.',
  sections: [
    {
      id: 'measure',
      title: 'Measuring efficiency in an experiment',
      source: 'SRC-O5, SRC-M2',
      blocks: [
        {
          kind: 'list',
          items: [
            'Measure the load force (its weight, W = m g) and how high it rises.',
            'Pull at a steady speed and read the effort on a spring scale; measure how far the effort moves.',
            'Calculate W_out = load × rise and W_in = effort × effort distance, then η = W_out ÷ W_in × 100%.',
            'Repeat each trial and compare. Every reading has a limit (a spring scale to 0.1 N, a ruler to 1 mm).',
          ],
        },
        {
          kind: 'example',
          id: 'pulley-exp',
          title: 'A pulley experiment',
          problem:
            'A 2.0 kg load is lifted 0.30 m with a pulley system. The spring scale reads 6.0 N while the effort moves 1.20 m. What is the efficiency? (g = 9.81 m/s²)',
          steps: [
            'Load = 2.0 kg × 9.81 m/s² = 19.62 N.',
            'W_out = 19.62 N × 0.30 m ≈ 5.89 J.',
            'W_in = 6.0 N × 1.20 m = 7.20 J.',
            'η = 5.89 J ÷ 7.20 J × 100% ≈ 81.8%.',
          ],
          answer: { value: 81.8, unit: '%' },
        },
        check({
          id: 'le-1',
          kind: 'mcq',
          prompt:
            'A group measures an efficiency of 108% for their pulley. What is the best conclusion?',
          options: [
            {
              id: 'a',
              label: 'A measurement is wrong; they should check the readings and repeat the trial',
            },
            { id: 'b', label: 'Their pulley creates extra energy', misconceptionId: 'G4' },
            {
              id: 'c',
              label: 'Pulleys are usually more than 100% efficient',
              misconceptionId: 'G4',
            },
            { id: 'd', label: 'They should report 100% instead' },
          ],
          correctId: 'a',
          objective: 'SRC-O5',
          misconceptionId: 'G4',
          explanation:
            'No machine gives out more work than it receives. Above 100% points to a reading error, for example the effort read while the load was speeding up, or a distance measured wrongly.',
        }),
      ],
    },
    {
      id: 'losses',
      title: 'Where does the lost energy go?',
      source: 'SRC-O5, SRC-G4, SRC-M4',
      blocks: [
        {
          kind: 'text',
          text: 'Energy is not destroyed. The input work is shared between useful work and losses: W_in = W_out + losses. In the experiment above, 7.20 J − 5.89 J ≈ 1.31 J was not useful.',
        },
        {
          kind: 'list',
          items: [
            'Friction in bearings, ropes, seals and sliding surfaces becomes heat.',
            'Lifting parts of the machine itself, such as the movable pulley block.',
            'Leaking fluid in hydraulic machines.',
            'A little sound and vibration.',
          ],
        },
        {
          kind: 'idea',
          misconceptionId: 'G4',
          evidence:
            'In every trial the input work is larger than the useful work, and the difference can be traced to friction, the machine’s own moving parts or leaks. A "perfect machine" would show no difference at all; no real experiment does.',
        },
        {
          kind: 'lab',
          labId: 'pulley',
          prompt:
            'The pulley lab shows the energy split: compare the friction loss with the work spent lifting the block.',
        },
      ],
    },
    {
      id: 'power',
      title: 'Power: how fast the work is done',
      source: 'SRC-O5, SRC-O6',
      blocks: [
        {
          kind: 'equation',
          equation: {
            id: 'power',
            name: 'Power',
            expression: 'P = W / t',
            where: 'W in J, t in s, P in W',
          },
        },
        {
          kind: 'example',
          id: 'power-input',
          title: 'Input power of a machine',
          problem:
            'A machine does 120 J of useful work in 4.0 s and is 80% efficient. What power must be put in?',
          steps: [
            'W_in = W_out ÷ η = 120 J ÷ 0.80 = 150 J.',
            'P_in = W_in ÷ t = 150 J ÷ 4.0 s = 37.5 W.',
          ],
          answer: { value: 37.5, unit: 'W' },
        },
      ],
    },
    {
      id: 'scenarios',
      title: 'Applying efficiency: bicycles uphill and hydraulic brakes',
      source: 'SRC-O6, SRC-G5, decision D-13',
      pendingCheck:
        'Decision D-13: the bicycle-uphill example is reframed and must be confirmed by the subject teacher before this lesson is published.',
      blocks: [
        {
          kind: 'text',
          text: 'Going uphill needs more work and more power, because the rider must also lift the rider and the bicycle against gravity. Efficiency tells us how much of the rider’s effort reaches the wheels. A steeper hill means more work is needed; it does not by itself mean the bicycle is less efficient.',
        },
        {
          kind: 'example',
          id: 'bike-hill',
          title: 'Climbing a hill (illustrative numbers)',
          problem:
            'A rider and bicycle together have a mass of 70 kg and climb a hill 15 m high. Suppose the chain drive is 95% efficient. At least how much work must the rider do? (g = 9.81 m/s²)',
          steps: [
            'Work against gravity = m g h = 70 kg × 9.81 m/s² × 15 m ≈ 10 300 J.',
            'Rider’s work ≥ 10 300 J ÷ 0.95 ≈ 10 800 J, about 10.8 kJ.',
            'In reality the rider does even more, because of rolling resistance and air resistance.',
          ],
          answer: { value: 10.8, unit: 'kJ' },
        },
        {
          kind: 'lab',
          labId: 'bicycle',
          prompt:
            'In the bicycle lab, compare a gentle and a steep hill in the same gear: look at the work, the power and the drivetrain efficiency.',
        },
        {
          kind: 'text',
          text: 'Justify a conclusion with evidence: state your claim, give the measured or calculated evidence, and explain the reasoning that links them. For example: "Our brake model loses force when there is air in the line (claim). The pedal moved 40% further for the same braking force (evidence). Air is compressed instead of passing on the pressure (reasoning)."',
        },
        {
          kind: 'idea',
          misconceptionId: 'G5',
          evidence:
            'The definition η = W_out ÷ W_in becomes useful when you apply it: it tells the rider how much effort is lost in the chain, and the mechanic why a leaking brake line is dangerous.',
        },
        check({
          id: 'le-2',
          kind: 'numeric',
          prompt:
            'In a ramp experiment the useful work is 45 J and the input work is 60 J. What is the efficiency?',
          answer: 75,
          tolerance: 0.5,
          unit: '%',
          objective: 'SRC-O5',
          misconceptionId: 'G5',
          explanation: 'η = 45 J ÷ 60 J × 100% = 75%.',
        }),
      ],
    },
  ],
};

export const lessons: readonly Lesson[] = [
  torque,
  advantageEfficiency,
  simpleCompound,
  hydraulics,
  efficiencyPractice,
];

export function findLesson(moduleId: string | undefined): Lesson | undefined {
  return lessons.find((l) => l.moduleId === moduleId);
}
