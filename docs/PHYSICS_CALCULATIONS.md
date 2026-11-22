# PHYSICS_CALCULATIONS.md

Milestone 06: the educational physics calculation engine, `src/edu-calc`.
Pure TypeScript with no React, Three.js, DOM or storage; ESLint enforces this. Every function returns a structured result the UI can show directly.

> **Relation to `src/physics-core` (Milestone 05).** `physics-core` *simulates machines* and produces energy ledgers. `edu-calc` *performs the calculations learners do*, explains them, and checks their inputs. The two are kept separate so the formula a learner sees is never hidden inside a simulation.

## 1. Scope: what the source supports

| Calculation | Function | Formula | Source | Status |
|---|---|---|---|---|
| Work | `work` | W = F d cos θ (W = F d when parallel) | **SRC-O5** (input/output work for efficiency) | Approved scope |
| Weight | `weight` | W = m g | **SRC-O5** (load force; keeps mass ≠ weight) | Approved scope |
| Torque | `torque` | τ = r F sin θ | **SRC-O1** | Approved scope |
| Angular acceleration | `angularAcceleration` | α = τ_net ÷ I | **SRC-O1** ("torque, angular acceleration") | Approved scope |
| Actual mechanical advantage | `actualMechanicalAdvantage` | AMA = F_out ÷ F_in | **SRC-O2** | Approved scope |
| Efficiency | `efficiency` | η = W_out ÷ W_in × 100 % | **SRC-O2, SRC-O5** | Approved scope |
| Efficiency from MA | `efficiencyFromMA` | η = AMA ÷ IMA × 100 % | **SRC-O2** (relates MA and efficiency) | Approved scope |
| Pressure | `pressure` | P = F ÷ A | **SRC-O4** | Approved scope |
| Pascal's principle | `pascalOutputForce`, `pascalOutputDistance` | F₁/A₁ = F₂/A₂; d₂ = d₁A₁/A₂ | **SRC-O4** | Approved scope |
| Power | `power` | P = W ÷ t | **BRF / REC**: listed in the owner's brief. Not a named concept-note formula; supports SRC-O6 (bicycle climbing a hill) | *Recommended addition* |
| Velocity ratio (IMA) | `velocityRatio`, `idealMA.*` | VR = IMA = d_in ÷ d_out; L/h; arm ratio; R/r; n segments | **BRF / REC**: the ideal value needed to separate MA from efficiency (SRC-O2) | *Recommended addition* |

**Not added (would expand the curriculum; for the owner to decide):** kinetic energy, screw and wedge IMA, overall efficiency of machines in series (relevant to SRC-O3 compound machines), and power as F × v.

## 2. Result shape (`types.ts`)

```ts
type CalcResult =
  | { ok: true; quantity; symbol; value; unit; basis; formula; substitution;
      explanation; assumptions: string[]; warnings: string[]; source }
  | { ok: false; quantity; errors: { field; message }[] };
```

- **`value`** is unrounded SI. Round only for display (`fixed`, `sig`, `withUnit`).
- **`basis`** separates theory from evidence:
  - `ideal`: theoretical, loss-free (velocity ratio / IMA, Pascal output force and distance). Always ideal; the caller cannot change it.
  - `measured`: from a learner's instrument readings (the default for work, power, torque, AMA, efficiency).
  - `simulated`: from the lab's physics model (pass `{ basis: 'simulated' }`).
  - AMA and efficiency **cannot be labelled ideal**: their type forbids it, because they describe a real machine.
- **`warnings`** are valid but noteworthy cases, e.g. zero work at 90°, negative work, zero torque through the pivot, 100 % efficiency ("ideal only"), or a smaller output piston.
- **`errors`** list *every* invalid input at once, each with the field name and a learner-readable message.

## 3. Units (`units.ts`) and formatting (`format.ts`)

- SI throughout: m, kg, s, N, J, W, m², Pa. Angles are given in degrees and converted for trigonometry.
- `toSI`, `fromSI` and `convert` cover length (mm, cm, m, km), mass (g, kg), time (ms, s, min, h), force (N, kN), energy (J, kJ), power (W, kW), area (mm², cm², m²) and pressure (Pa, kPa, MPa). They are typed: you cannot convert cm to kN.
- `weightN(m)` uses g = 9.81 m/s² (`G_STANDARD`, the same value as the physics core). `circleAreaM2(d)` gives piston areas.
- `cosDeg` and `sinDeg` return **exact** values at textbook angles, so cos 90° is 0 and not 6 × 10⁻¹⁷.
- `roundTo` rounds half away from zero without float artefacts (1.005 → 1.01). `sig` gives up to 4 significant figures in en-US style (5,000). `fixed` gives fixed decimals for readouts.

## 4. Validation rules (`validation.ts`)

| Rule | Applied to |
|---|---|
| Must be a real number (rejects NaN and ±∞) | every input |
| > 0 (no division by zero) | time, areas, input force in AMA, output distance in VR, input work in η, moment of inertia, mass, g |
| ≥ 0 (magnitudes) | forces, distances, lever arm, output work, AMA |
| Angle 0-180° | work, torque |
| W_out ≤ W_in | efficiency: otherwise "check your measurements", **never** reported as more than 100 % |
| AMA ≤ IMA | efficiency from MA |

Nothing is clamped or silently corrected.

## 5. Assumptions by formula

| Formula | Assumptions recorded in the result |
|---|---|
| W = F d cos θ | Constant force; θ between force and motion; W = F d only when parallel |
| P = W ÷ t | Average power over the interval |
| τ = r F sin θ | r from the pivot to the point of action; magnitude only (no clockwise/counter-clockwise sign) |
| α = τ_net ÷ I | Rigid body, fixed axis; τ_net includes friction torques |
| AMA | Forces read at steady speed |
| VR / IMA | Same movement; geometry only, independent of friction |
| η (work) | Same movement for W_in and W_out; starts and ends at rest |
| η (AMA ÷ IMA) | Equal to the work form only for the same steady movement |
| P = F ÷ A | Force even and perpendicular to the area |
| Pascal | Incompressible fluid, no leakage, no seal friction, pistons at the same height (ideal) |
| W = m g | g = 9.81 m/s² |

## 6. Sample calculations (actual engine output)

```
Work | measured | W = 66.04 N × 2 m = 132.1 J
Work | measured | W = 100 N × 3 m × cos 60° = 150 J
Power | measured | P = 132.1 J ÷ 4.4 s = 30.02 W
Torque | measured | τ = 0.5 m × 100 N × sin 30° = 25 N·m
Actual mechanical advantage | measured | AMA = 98.1 N ÷ 66.04 N = 1.485
Velocity ratio (ideal mechanical advantage) | ideal | VR = 2 m ÷ 1 m = 2
Efficiency | measured | η = 98.1 J ÷ 132.1 J × 100% = 74.3%
Output force (ideal) | ideal | F₂ = 50 N × 0.1 m² ÷ 0.001 m² = 5,000 N
Efficiency | ERROR | usefulWorkJ: Output work is larger than input work. A real machine cannot do that - check your measurements.
Power | ERROR | timeS: Time must be greater than 0 s.
```

Example explanation (efficiency): *"74.3% of the input work became useful work. The other 25.7% (33.98 J) was lost, for example as heat from friction or in lifting parts of the machine itself. Efficiency measures wasted energy; it is not the same as how much easier the machine makes the job. This value comes from your measurements."*

## 7. Use in the app
- The lab's **Calculate** step now uses `efficiency()`. Its feedback shows the engine's substitution line and explanation, and input errors come from the engine's messages. The old ad-hoc efficiency helper was removed.
- Lab readouts still come from the physics-core ledger (basis "simulated"). The lever, pulley and hydraulics screens will use the same functions.

## 8. Tests (`units.test.ts`, `calculations.test.ts`: 46 tests)
- **Reference values:** 300 J, 150 J at 60°, 60 W, 50 and 25 N·m, 4 rad/s², AMA 1.485, VR 2, η 74.27 %, 50 kPa, 5,000 N, 1 mm piston travel, 98.1 N.
- **Consistency:** the work and AMA ÷ IMA forms of η agree; hydraulic work in equals work out.
- **Zero values:** zero force or distance gives zero work; zero work gives zero power; 0 % efficiency is valid.
- **Boundaries:** 90° → exactly 0 J with a warning; 180° → negative work; torque along the arm → 0 with a warning; 100 % only with an "ideal" warning.
- **Invalid input:** negatives, NaN, ±∞, out-of-range angles, zero divisors, W_out > W_in, AMA > IMA. All errors are reported together.
- **Units, rounding and display:** conversions and round trips, exact trigonometry, half-away-from-zero rounding, significant figures, unit formatting.
- **Completeness:** every successful result has a formula, a substitution, an explanation of at least 40 characters, assumptions, a source and a basis.
