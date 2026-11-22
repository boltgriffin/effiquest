# PULLEY_LAB.md

Milestone 07: the complete pulley efficiency laboratory at **`/lab/pulley`**.

Owner decisions (2026-11-23):
- **Arrangement:** selectable 1-4 supporting rope segments.
- **Effort:** *measured* at a steady pull, not set by the learner.

## 1. What changed from the old prototype

The Next.js prototype's pulley (`Desktop\JAVA JDBC CRUD\EffiQuest`) computed `effort = load ÷ (IMA × efficiency)` from a **user-typed efficiency (85 %)**, and its SVG had no motion. That is circular, and it is the pattern the brief forbids. Nothing from it was reused except the correct ideal relation *rope travel = n × lift*. This lab is a new, physics-driven model.

## 2. The model: a non-ideal pulley system

| Aspect | Model |
|---|---|
| Arrangement | n = 1 single fixed · 2 single movable · 3 and 4 block and tackle. n pulleys in total: ⌈n/2⌉ fixed, ⌊n/2⌋ movable. The rope is tied to the ceiling (n even) or the movable block (n odd) |
| Loss 1: bearing friction | Each pulley multiplies rope tension by **K = (R + μ_b r) ÷ (R − μ_b r)**. This follows from the friction torque μ_b r (T_slack + T_tight) = (T_tight − T_slack) R for parallel rope runs (R = 40 mm pulley, r = 5 mm axle) |
| Loss 2: movable block | The movable pulleys (mass m_b) rise with the load; lifting them is work, but not useful work |
| Forces | T_i = T₁Kⁱ⁻¹ (i = 1…n), Σ T_i − (W + W_b) = (m + m_b) a, effort F = T₁Kⁿ |
| Motion | The load rises 1 m: rest → steady 0.2 m/s → rest (0.4 s speed-up and slow-down), fixed step 1/240 s |
| Energy ledger | W_in = Σ F·n·Δy; useful = W·h; block = W_b·h; friction = Σ (nF − (m + m_b)(g + a))·Δy, **computed independently**, so the ledger check is a real test |
| Efficiency | η = useful work ÷ input work × 100 %, from the ledger, through the calculation engine (`efficiency()`, basis "simulated") |
| Ideal case | μ_b = 0 and n = 1 gives exactly 100 % (tested). With μ_b = 0 and a movable block, η = W ÷ (W + W_b) |

**Why there is no Rapier rope.** Rapier has no rope-over-pulley constraint. Approximating a rope with jointed links would add solver energy errors to the very number being taught. The lab therefore uses a validated analytic model with a deterministic integrator (decision D-12). The 2D diagram and 3D scene only *display* it.

**Not a friction slider.** The learner changes **μ_b**, a physical property of the bearings, and **m_b**, the block mass. The efficiency that results is computed, never set.

## 3. Physics validation (default load 10 kg, block 1 kg, μ_b = 0.15)

"Hand" is an independent hand formula (F = (W + W_b)·Kⁿ ÷ Σ Kⁱ, η = W·h ÷ (F·n·h)). "Model" is the time simulation. The last column is the closed-form solver.

| n | F hand (N) | F model (N) | AMA | VR | W_in (J) | W_out (J) | Losses: block / friction (J) | η hand (%) | η model (%) | Ledger imbalance | F closed form (N) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 101.849 | 101.849 | 0.963 | 1 | 101.849 | 98.100 | 0.00 / 3.75 | 96.32 | 96.32 | 4 × 10⁻¹⁶ | 101.849 |
| 2 | 57.067 | 57.067 | 1.719 | 2 | 114.135 | 98.100 | 9.81 / 6.22 | 85.95 | 85.95 | 8 × 10⁻¹⁵ | 57.067 |
| 3 | 38.754 | 38.754 | 2.531 | 3 | 116.261 | 98.100 | 9.81 / 8.35 | 84.38 | 84.38 | 2 × 10⁻¹⁴ | 38.754 |
| 4 | 29.603 | 29.603 | 3.314 | 4 | 118.413 | 98.100 | 9.81 / 10.50 | 82.85 | 82.85 | 6 × 10⁻¹⁵ | 29.603 |

What the table shows (misconception G2): more segments give more mechanical advantage (0.96 → 3.31) and less effort (101.8 → 29.6 N), while efficiency falls (96.3 → 82.9 %). Each extra pulley adds bearing friction, and the movable block adds dead weight.

Other checks (automated):
- Plan test vector: n = 4, W = 200 N, W_b = 10 N, μ_b = 0 gives F = 52.5 N and η = 95.24 %.
- Rope pulled = n × load rise at every sample.
- AMA ÷ VR × 100 matches η within the spring-scale resolution (0.1 N).
- The ledger's losses are never negative, and cumulative work never decreases.

## 4. Measurements (live and final)

| Quantity | During the run | After the run |
|---|---|---|
| Load weight W = m g | ✔ | ✔ |
| Input force (spring scale, 0.1 N) | live reading: higher while speeding up, steady in the middle, lower while slowing | the **steady** reading (used for AMA) |
| Output force (on the load at steady speed = W) | ✔ | ✔ |
| Input distance (rope pulled, 0.01 m) | live | 1.00 × n m |
| Output distance (load raised, 0.01 m) | live | 1.00 m |
| W_in, W_out | live, cumulative | final |
| AMA = F_out ÷ F_in, VR = d_in ÷ d_out (ideal), η | — | ✔ with the engine's substitution line and explanation |
| Energy bar | — | useful work, block lifting (dotted), bearing friction (hatched) |

Live values update about 10 times a second; the diagram and 3D view update every frame from a shared motion ref, with no React re-renders.

## 5. Controls and their state machine (`playback.ts`, pure and unit-tested)

`idle → START → running ⇄ PAUSE/RESUME ⇄ paused → (time) → finished → REPLAY → running …`, and `RESET` returns to the initial state from anywhere.
- **Start / Start new run** simulates the current settings and plays from t = 0.
- **Pause / Resume** freeze and continue the same run. Ticks are ignored while paused.
- **Replay** plays the last run again from the start, with identical results.
- **Reset** restores the initial conditions: load on the floor, no run, readings cleared, settings unlocked. *Settings are kept*; **Restore default settings** in Variables resets them.
- With *reduced motion*, a run jumps straight to the end (`SKIP_TO_END`).
- Settings are locked while running or paused. Changing one after a run flags the results as **stale** and disables Record trial until the next run.

## 6. Guided activity (`PulleyGuide.tsx`)

The six steps are Objective · Equipment · Instructions (with independent, controlled, measured and calculated variables) · Observe (prediction + notes) · Results · Reflect.
- **Results** shows the learner's own recorded trials and a sentence generated from *their* data, e.g. "From 1 to 4 supporting segments, the effort fell from 101.8 N to 29.6 N (mechanical advantage 0.96 → 3.31), while the efficiency fell from 96.3% to 82.9%". It says "not a fair test" if other settings also changed.
- **Reflect** has three questions. Saving writes a journal entry and marks the lab activity complete. It counts for the quest "Where does the energy go?", whose lab stage is now the pulley.
- The activity text was drafted for teacher review (D-10).

Feedback: a spoken message when any variable changes ("Block and tackle (4 segments): velocity ratio 4. Press Start to measure this set-up."); a status line for every control state; "Run complete. Record this trial…" when a run finishes; and "Pulley lab complete" after the reflection.

## 7. Layout
- **Desktop:** simulation, controls and measurements on the left; variables and guide on the right.
- **Phone:** the simulation comes first, capped at 60 % of the screen height, with the controls directly under it, then measurements, variables and guide. No panel covers the simulation.
- **Views:** Diagram and 3D tabs share one geometry (`layout.ts`: reeving and drawing scale). The drawing scale keeps the effort end above the floor for the longest pull (tested).

## 8. Limitations (shown in Model assumptions)
- Massless, inextensible rope with no slip. Massless pulleys (no spin energy). Rope runs vertical and parallel.
- The bearing-friction law is a simple Coulomb model; real bearings and rope bending add other losses.
- The lift is always 1 m at 0.2 m/s; the learner cannot vary the speed.
- Effort is measured, not set, so the lab cannot show "too little effort, nothing moves" (by owner decision).
- Static friction (the extra force needed to start) is not modelled.
- Parameter ranges are teaching-realistic, not taken from a specific product. A subject teacher should confirm them before release.

## 9. Tests
- **Unit:** 7 physics tests for the time-stepped lift, 17 lab tests (state machine, reeving for n = 1-4, measurements, drawing scale) and 3 data-summary tests.
- **End-to-end** (desktop and Pixel 7):
  - picker → lab;
  - start → pause (settings locked, partial readings) → resume → finish → replay → reset;
  - measurements for n = 2 (98.1 N load, 57.1 N steady effort, 2.00 m / 1.00 m, η line, both losses);
  - recording n = 1 and n = 4 trials → stale-set-up handling → trade-off sentence;
  - reflection → lab marked Done.
