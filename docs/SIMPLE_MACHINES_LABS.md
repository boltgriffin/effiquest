# SIMPLE_MACHINES_LABS.md

Milestone 08: simple-machine laboratories on one shared template.

## 1. Scope check

| Machine | In the concept note (SRC-O3) | Owner decision D-05 | Milestone 08 |
|---|---|---|---|
| Lever | ✔ | first release | **New lab** `/lab/lever` |
| Pulley | ✔ | first release | Moved onto the template (`/lab/pulley`) |
| Inclined plane | ✔ | first release | Moved onto the template (`/lab/incline`) |
| Wheel and axle | ✔ | first release | **New lab** `/lab/wheel-and-axle` |
| Screw | ✔ | approved 2026-11-23 (D-22) | **Built in Milestone 14**: screw jack at `/lab/screw` (§9) |
| Wedge | ✔ | approved 2026-11-23 (D-22) | **Built in Milestone 14**: lifting wedge at `/lab/wedge` (§9) |
| Hydraulic press | (SRC-O4, not a simple machine) | first release | Added in Milestone 09 on the same template: see `HYDRAULICS_LAB.md` |

Screw and wedge were deferred by D-05 and approved by the owner on 2026-11-23 (D-22); they were built in Milestone 14 (§9). The compound machines (bicycle, hydraulic brake) were built in Milestone 16 (§10, D-24).

## 2. Shared laboratory template (`src/features/lab/shared`)

Every lab is a `MachineDefinition<P>` (`types.ts`) rendered by one component, `MachineLab`. The definition connects a machine's own physics module to the template. It does **not** force the machines into one generic physics model.

| Part | File | Behaviour, the same in every lab |
|---|---|---|
| Layout | `MachineLab.tsx` | Breadcrumbs, header, *Model assumptions* dialog; simulation (Diagram and 3D tabs) with controls, then measurements; variables and guide in a side column. On phones the simulation comes first, capped at 60 % of the screen height |
| Playback | `playback.ts`, `useMachineRun.ts` | Pure, tested state machine: Start, Pause, Resume, Replay, Reset; reduced motion jumps to the end. Per-frame motion goes into a ref; live readings update about 10 times a second |
| Controls | `SimControls.tsx` | Toolbar plus a spoken status line with the elapsed time |
| Variables | `VariablesPanel.tsx` | Sliders or segmented controls from the definition. Locked during a run; every change is announced; *Restore default settings* |
| Measurements | `MeasurementsPanel.tsx` + `measurement.ts` | Load weight, input force (live scale, then the steady reading), output force, d_in, d_out, W_in, W_out, AMA, IMA, η, energy bar, and the engine's substitution line and explanation. **AMA, IMA and η appear only after the run**, because they compare the whole movement. A stale set-up is flagged and *Record trial* is disabled |
| Guide | `ExperimentGuide.tsx` | 7 steps: Overview (objective, how it works, parts, **relevant equations**) · Instructions (with the variables) · Predict (prediction + observation notes) · Calculate (the learner's own η check through the engine) · Results (recorded trials + a "what your data show" sentence) · **Check** (knowledge check) · Reflect (saves to the journal and completes the lab activity) |
| Knowledge check | `KnowledgeCheck.tsx`, `knowledge.ts` | 3 items per machine with **immediate feedback and an explanation**, and *Try again*. Formative only; nothing is saved |
| Data summary | `analysis.ts` | Compares the latest trials at the lowest and highest value of the lab's independent variable. Flags "not a fair test" if other settings changed, and notes when AMA and η moved in opposite directions |
| 3D camera | `LabCanvas.tsx` | Preset **View** buttons (3 per machine), drag to orbit, pinch or scroll to zoom, touch-friendly. Renders on demand |
| 3D labels | `src/scene/SceneLabel.tsx` | Part labels pinned to the model (Fulcrum, Load arm, Wheel, Axle, Movable pulley, …), drawn as DOM overlays: readable at any zoom and no font download |

**Measurement honesty rules (template-wide).**
- **IMA** is computed from exact geometric distances. Rounding a 7 cm lever arc to the ruler would otherwise distort an ideal value.
- **Readings** are rounded to the instrument's resolution: the scale reads to 0.1 N; rulers read to 0.01 m, or 1 mm for the lever.
- **Efficiency** always comes from the energy ledger through the calculation engine (basis "simulated"). An efficiency the energy can't support is reported as a measurement error, never clamped.

## 3. The machines (each with its own tested physics module)

### 3.1 Lever (`physics-core/lever.ts`): new time simulation
- **Model.** A first-class lever (fulcrum between load and effort) is turned 20° at a steady 0.12 rad/s, from rest to rest. Forces act at 90° to a light, rigid beam.
  - Pivot friction torque τ_f = μ_p · r_p · N, with r_p = 10 mm and N = F + W + m a.
  - Moment balance: F·L_e = (W + m a)·L_l + τ_f, which gives **F = (W + m a)(L_l + μ_p r_p) ÷ (L_e − μ_p r_p)**.
- **Inputs:** effort arm 0.2-1.0 m, load arm 0.1-1.0 m, load mass, pivot friction 0-0.5. Distances are the arcs moved by each end.
- **Teaching point:** moving the fulcrum changes AMA a lot, from 0.33 to 4.94 in the table below, while η barely changes (about 98.5-98.8 %). Mechanical advantage is not efficiency (SRC-O2). It also links to torque, τ = rF (SRC-O1).

### 3.2 Wheel and axle (`physics-core/wheelAxle.ts`): new module
- **Model.** A winch: effort rope on the wheel (radius R), load rope on the axle (radius r), one rigid body, so IMA = R ÷ r.
  - The bearing (journal radius 10 mm, coefficient μ_b) carries the effort, the load **and the wheel's own weight** (a 2 kg uniform disk, I = ½MR²).
  - **F = [(W + m a)(r + μ_b r_b) + μ_b r_b M g + I α] ÷ (R − μ_b r_b)**.
  - The load is lifted 0.5 m at 0.12 m/s.
- **Teaching points:**
  - a bigger wheel lowers the effort;
  - the scale reads higher while the wheel spins up (τ_net = Iα, SRC-O1);
  - a heavier wheel adds bearing friction even with the same load.

### 3.3 Inclined plane and pulley: unchanged physics
The models are the same as Milestones 05 and 07. Adapters (`inclineMachineRun`, `pulleyMachineRun`) give them the shared run shape. The incline lab gains pause, resume and replay, a knowledge check and the Results comparison. The pulley lab keeps every Milestone 07 behaviour, now in the shared template.

### 3.4 Validation (independent hand formula vs engine; load 10 kg)

| Machine | Set-up | F hand (N) | F engine (N) | IMA | AMA | η hand (%) | η engine (%) | Ledger imbalance |
|---|---|---|---|---|---|---|---|---|
| lever | L_e 0.8, L_l 0.2, μp 0.2 | 24.832 | 24.832 | 4.000 | 3.950 | 98.76 | 98.76 | 3 × 10⁻¹⁵ |
| lever | L_e 0.4, L_l 0.2, μp 0.2 | 49.789 | 49.789 | 2.000 | 1.970 | 98.51 | 98.51 | 3 × 10⁻¹⁵ |
| lever | L_e 1.0, L_l 0.2, μp 0.2 | 19.856 | 19.856 | 5.000 | 4.941 | 98.81 | 98.81 | 1 × 10⁻¹⁴ |
| lever | L_e 0.2, L_l 0.6, μp 0.2 | 298.264 | 298.264 | 0.333 | 0.329 | 98.67 | 98.67 | 2 × 10⁻¹⁵ |
| lever | L_e 0.8, L_l 0.2, μp 0 | 24.525 | 24.525 | 4.000 | 4.000 | 100.00 | 100.00 | 3 × 10⁻¹⁶ |
| wheel & axle | R 0.30, r 0.05, μb 0.15, wheel 2 kg | 17.024 | 17.024 | 6.000 | 5.763 | 96.04 | 96.04 | 2 × 10⁻¹⁴ |
| wheel & axle | R 0.15, r 0.05, μb 0.15 | 34.219 | 34.219 | 3.000 | 2.867 | 95.56 | 95.56 | 1 × 10⁻¹⁴ |
| wheel & axle | R 0.45, r 0.05, μb 0.15 | 11.330 | 11.330 | 9.000 | 8.658 | 96.20 | 96.20 | 3 × 10⁻¹⁴ |
| wheel & axle | R 0.30, r 0.05, μb 0 | 16.350 | 16.350 | 6.000 | 6.000 | 100.00 | 100.00 | 7 × 10⁻¹⁶ |
| wheel & axle | R 0.30, r 0.05, μb 0.15, wheel 8 kg | 17.319 | 17.319 | 6.000 | 5.664 | 94.40 | 94.40 | 8 × 10⁻¹⁵ |

The incline (66.04 N, 74.27 %) and pulley (n = 1-4) reference cases from Milestones 05 and 07 still pass through the adapters.

## 4. Comparison activities
- **Within a machine:** Results → "What your data show", e.g. *"When the effort arm went from 0.40 m to 0.80 m, the effort fell …"*. Supports SRC-O2 and the fair-test idea.
- **Across machines:** `/lab/compare` shows the learner's latest valid trial for each machine (F_in, F_out, IMA, AMA, η). A sentence says which machine had the largest mechanical advantage and which was the most efficient, and whether they differ. A note explains that this is not a fair test of the machines, and that compound machines (SRC-O3) multiply their parts' efficiencies. Logic: `compare.ts` (tested).
- **Quests:** the lever lab became the lab stage of "Pushing straight, turning round" (torque, G1).

## 5. Educational content
Each definition includes an objective with concept-note links, a plain-language "How this machine works", the parts list, equations with units, instructions, the variables (independent, kept the same, measured, calculated), a prediction, an observation prompt, 3 reflection questions and 3 knowledge-check items with explanations. **All of it is drafted for teacher review (D-10).**

## 6. Assumptions and limitations (also in each lab's *Model assumptions*)
- Light rigid beams, ropes and pulleys (except the 2 kg wheel); ropes do not stretch or slip.
- Each friction is modelled with a single Coulomb coefficient at a bearing or pin, or on the ramp surface. Static friction is not modelled.
- Forces are at 90° to the lever beam. Lever distances are arcs over 20°.
- Runs are always rest → steady speed → rest. The learner does not set the effort (as in D-18).
- The wheel-and-axle effort rope moves R ÷ r times the load's rise, so its end leaves the drawing. The diagram shows the true distance pulled as a number, and the 3D handle stops at the floor while its label shows the true distance.
- Parameter ranges are teaching-realistic, not from specific products. A subject teacher should confirm them.

## 7. Tests
- **Physics:** `machines.test.ts`, 15 tests. Lever and wheel-and-axle reference values, closed form vs simulation, energy conservation, the effect of inertia during starts, wheel-weight friction, IMA ratios, invalid set-ups, adapters.
- **Template:** `shared.test.ts`, 13 tests. Every machine definition runs with its defaults, its knowledge keys are valid, η agrees with AMA ÷ IMA; exact IMA for short lever arcs; live readings; one-variable and cross-machine comparison; knowledge scoring.
- **Pulley:** the state machine, reeving and drawing-scale tests moved with the shared playback.
- **End-to-end** (desktop + Pixel 7):
  - incline: readings, calculation, recording, persistence, stale set-up, pause and resume, 100 % frictionless;
  - pulley: the full control cycle, n = 2 readings, the 1 vs 4 trade-off, reflection, 3D camera presets;
  - lever: default readings incl. 1 mm arcs, AMA below 1;
  - wheel and axle: default readings, axle ≥ wheel rejected;
  - knowledge-check feedback, the comparison page, and an unknown machine giving not-found.

## 8. Open items for the owner
1. ~~Screw and wedge~~: built in Milestone 14 (D-22).
2. All lab text and knowledge-check items need the teacher's review (D-10).

## 9. Milestone 14: screw jack and lifting wedge

Both labs use the shared template: a physics module, settings, a definition, a 2D diagram and a 3D view.

| | Screw jack (`physics-core/screw.ts`) | Lifting wedge (`physics-core/wedge.ts`) |
|---|---|---|
| Machine | a handle of radius R turns a square-thread screw (pitch p, thread radius r_m = 12 mm) that raises the load | a wedge of angle α is pushed along the floor under a load held by vertical guides |
| IMA | 2πR ÷ p (e.g. 314 for R = 0.25 m, p = 5 mm) | 1 ÷ tan α = length ÷ thickness |
| Losses (named, each integrated separately) | thread friction μ: the thread is an inclined plane wrapped round the screw (lead angle λ, tan λ = p ÷ 2π r_m); N = Q cos λ + P sin λ, sliding r_m dθ ÷ cos λ | friction μ on both faces: wedge–load (normal N₁ = Q ÷ (cos α − μ sin α), sliding x ÷ cos α) and wedge–floor (N₂ = Q, sliding x) |
| Effort | F = Q r_m tan(λ + φ) ÷ R, with Q = W + m a | F = Q [tan(α + φ) + tan φ] |
| Efficiency (closed form, check) | tan λ ÷ tan(λ + φ) | W tan α ÷ F |
| Teaching point | **self-locking** when φ ≥ λ: the jack holds the load by itself, and is then always under 50 % efficient | **self-locking** when α ≤ 2φ: the wedge stays put (door wedge); a thin wedge gives a bigger advantage but a lower efficiency |
| Default check by hand | 500 kg, R 0.25 m, p 5 mm, μ 0.15: λ 3.79°, φ 8.53°, τ 12.86 N·m, **F 51.4 N**, IMA 314.16, **η 30.4 %**, self-locking | 100 kg, α 10°, μ 0.15: **F 476.0 N**, IMA 5.67, **η 36.3 %**, self-locking |

**Validation (`physics-core/screwWedge.test.ts`, 10 tests):**
- the hand values above;
- the energy ledger closes to below 10⁻⁹ of the input;
- with no friction, η = 100 % exactly (AMA = IMA);
- trends: a finer pitch means less effort but lower efficiency; a thinner wedge means less push but lower efficiency;
- self-locking flags;
- invalid set-ups are rejected.

**Template addition:**
- an optional `resultNote` sentence after a run, used for self-locking ("you can let go of the handle and the load stays up").

**Display:**
- the screw's 20 mm rise is drawn larger than true and labelled so, and true values are shown as numbers;
- the 3D screw has a real helical thread that turns with the handle;
- the wedge is drawn to scale, and the flat-bottomed load rests on the slope by its uphill edge.

**Other changes:**
- new icons `screw` and `wedge`;
- the Lab page lists all six simple machines plus the hydraulic press, with "coming next" now the compound machines (bicycle, hydraulic brake);
- the "simple to compound" lesson links to both new labs.

## 10. Milestone 16: compound machines (bicycle and hydraulic brake)

Both are chains of the simple machines already in the lab (SRC-G3, SRC-O3), and both are named as practical scenarios in the concept note (SRC-O6). D-05 listed them as "come next"; the owner asked for them on 2026-11-23 (D-24).

| | Bicycle climbing a hill (`physics-core/bicycle.ts`, `/lab/bicycle`) | Hydraulic disc brake (`physics-core/brake.ts`, `/lab/hydraulic-brake`) |
|---|---|---|
| The chain | crank and chainring (wheel and axle) → chain → sprocket and rear wheel (wheel and axle) → the hill (inclined plane) | pedal (lever) → master cylinder → brake fluid (Pascal) → caliper piston → pads on the disc (friction) → tyre (wheel and axle in reverse) |
| IMA | (R_c r₂ ÷ R_w r₁) ÷ sin α: gears × hill (6.88 by default) | pedal ratio × A₂ ÷ A₁ (25.53 by default) |
| Settings | chainring 34/50, rear sprocket 11–34, hill 2–15 %, mass 50–110 kg, tyre rolling resistance, chain friction | pedal ratio, master and caliper piston diameters, clamp force needed, seal friction, pad friction |
| Losses (each from its own parameter) | tyres flexing (C_rr), air (½ρC_dA v²), chain links bending under tension (μ_c, pin radius, teeth), pedal and wheel bearings | piston seals (both), pedal pivot pin |
| Extra results | **drivetrain efficiency** (work reaching the road ÷ pedal work: D-13's "how much of the effort reaches the wheels"), gear ratio, pedalling rate, power | fluid pressure, master-piston force, friction force on the disc, braking force at the tyre |
| Teaching points | a lower gear lowers the pedal force but not the work to climb; a steeper hill needs more work and power, and a larger *share* of it lifts the rider; efficiencies in a chain multiply | the lever and the hydraulics multiply the force and their IMAs multiply; the pedal moves about 25 times further than the pads; air in the line would make the pedal spongy (not modelled) |
| Default hand check | resisting force 52.9 N at 2 m/s; drivetrain efficiency above 97 %; overall lower | **P 2.22 MPa, F 164.3 N, IMA 25.53, η 95.4 %, tyre force 1280 N** |

**Validation (`physics-core/compound.test.ts`, 13 tests):**
- the energy ledger closes (below 10⁻⁹ of the input);
- IMA from the geometry equals the measured distance ratio;
- the brake hand values above;
- with no losses, η = 100 %;
- drivetrain efficiency is 100 % without chain and bearing friction, and above the overall efficiency otherwise;
- trends: gears, hill, piston sizes, pedal ratio;
- invalid set-ups are rejected.

**Template additions:**
- an optional `outputForce` label, so the brake shows "Clamp force on the pads" instead of "Load weight";
- distances are shown with as many decimals as the ruler resolves (the brake's 0.5 mm pad travel shows as 0.0005 m).

**Display:**
- **2D:** the bicycle is drawn to scale on its true slope, with the crank turning in the true gear ratio; the brake schematic magnifies its tiny movements 5× and says so.
- **3D (realism kit):** a true-size bicycle on a tilted road that slides underneath; a car wheel with the disc, caliper and pads, the brake line, master cylinder and pedal with the driver's shoe. The wheel slows to a stop as the pads squeeze.

**Assumptions to check:**
- the brake squeezes the pads through 0.5 mm against the full clamp force; real clamp force builds up as the pads compress;
- no air in the brake fluid;
- the bicycle wheels' spinning energy is ignored;
- the D-13 wording for the bicycle awaits the teacher's check.

**Lessons now link to the labs:** simple to compound machines (both), hydraulics (brake), efficiency in practice (bicycle).
