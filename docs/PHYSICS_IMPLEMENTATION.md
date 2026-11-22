# PHYSICS_IMPLEMENTATION.md

Milestone 05: physics core and the first real lab (inclined plane).
It implements `PHYSICS_MODEL_PLAN.md`; this file records what was built, how it was verified, and where it differs from the plan.

## 1. Rule kept: efficiency is an output

Every efficiency in the app comes from an **energy ledger** produced by a machine model:

```
η = useful work ÷ input work × 100 %     (src/physics-core/ledger.ts)
```

- Losses come only from named physical mechanisms with physical parameters: friction coefficient, pivot friction and pin radius, bearing friction and radii, the weight of the movable pulley block.
- There is no efficiency or "friction %" slider anywhere.
- `checkLedger` validates every ledger and returns the efficiency, or one of: `no-input-work`, `energy-not-conserved` (imbalance above 0.1 % of input), `exceeds-100`, or `negative-loss`. The UI shows these as a **measurement error** and never clamps them into a number.

## 2. Modules (`src/physics-core`, pure TypeScript)

| File | Model | Status |
|---|---|---|
| `ledger.ts` | Energy ledger, imbalance, validation | Used by every model |
| `constants.ts` | g = 9.81 m/s², degree conversion, instrument quantization, validation helpers | — |
| `incline.ts` | Block pulled up a ramp, parallel to the slope, kinetic friction. Closed form **and** a fixed-step time simulation | **Wired to the lab** |
| `lever.ts` | First-class lever turned through a small angle, with pivot-pin friction | Model + tests (lab screen next) |
| `pulley.ts` | 1-6 supporting segments, movable-block weight, sheave bearing friction | Model + tests (lab screen next) |
| `index.ts` | Public API + `ENGINE_VERSION` (stored with every recorded trial) | — |

ESLint blocks this folder from importing React, Three, the router, stores, services or components.

### 2.1 Inclined plane
- Closed form: F_in = mg(sin θ + μ cos θ); IMA = 1/sin θ; AMA = mg/F_in; η = sin θ / (sin θ + μ cos θ).
- **Simulation**: the block starts and ends at rest with a trapezoidal velocity profile (speed up 0.4 s, cruise at 0.5 m/s, slow down), using a fixed step of 1/240 s that is independent of frame rate.
  - Each phase has a whole number of steps and the last step lands exactly at rest.
  - Position and every work term use the step-average velocity, so m·a·v̄·dt equals the exact change in kinetic energy. **The ledger closes to rounding error** (tested at < 10⁻⁹ of input).
  - Input work therefore includes the small extra force used to speed up and slow down, which cancels over the run.
- Instruments: the spring scale reads the steady pulling force to **0.1 N**, and the ruler reads distance and height to **0.01 m**.
- The displayed η comes from the ledger. A learner who calculates from the rounded readings lands within 0.5 percentage points, which is the calculation checker's tolerance (tested).

### 2.2 Lever (plan 3.2)
Pivot friction torque τ_f = μ_p r_p (F_e + W), which gives F_e = W(L_l + μ_p r_p)/(L_e − μ_p r_p). Input and output distances are the arc lengths for the turning angle. The ledger closes exactly.

### 2.3 Pulley (plan 3.3)
Bearing friction in each sheave gives T_tight = K·T_slack with K = (R + μ_b r)/(R − μ_b r). This follows from μ_b r (T_slack + T_tight) = (T_tight − T_slack) R for parallel rope runs. From the dead end, T_i = T₁Kⁱ⁻¹, effort F = T₁Kⁿ, and Σ T_i = W_load + W_block.
- Losses are split into "lifting the movable pulley block" and "friction in the pulley bearings".
- n = 1 is a single fixed pulley with no movable block.

## 3. Verification (`physics.test.ts`, `measurement.test.ts`)

| Check | Result |
|---|---|
| Plan test vector, incline (m = 10 kg, θ = 30°, μ = 0.20) | F_in 66.04 N, IMA 2, AMA 1.485, η 74.27 % ✔ |
| Plan test vector, pulley (n = 4, W = 200 N, W_block = 10 N, no friction) | F = 52.5 N, η 95.24 % ✔ |
| Ideal lever (100 N, 0.8 m / 0.2 m, no friction) | F = 25 N, IMA 4, η 100 % ✔ |
| Limits | μ = 0 → η = 100 % (incline, lever, single pulley) ✔ |
| Conservation | Incline simulation imbalance < 10⁻⁹ of input; lever and pulley exact ✔ |
| Monotonicity | η falls as μ rises; AMA ≤ IMA always ✔ |
| Misconception G2 in the models | Gentler ramp: more IMA, **lower** η. More pulley segments: more AMA, **lower** η ✔ |
| Invalid set-ups | Rejected with messages (angle ≥ 90°, zero mass, negative μ, non-integer segments, a pivot or bearing that cannot turn) ✔ |
| Ledger validation | More than 100 % and unbalanced ledgers are reported invalid ✔ |

## 4. The inclined-plane lab (`/lab`)

- **Run** (step 3) simulates the pull, then plays it back in real time (about 4.4 s).
  - The block moves in both the **diagram** and the **3D view**.
  - Per-frame motion lives in a ref read by `requestAnimationFrame` and R3F `useFrame`, never in React state.
  - With *reduced motion*, the result appears at once.
- **Measurements** shows:
  - spring scale, load, distance pulled, height gained, W_in, W_out, AMA, IMA and η;
  - an energy bar: useful work, plus friction loss drawn hatched.
- **Record trial** saves the run to IndexedDB (`sim_trials`: parameters, readouts, engine version, validity) under the learner's code. Recorded trials are listed in a table so ramps can be compared, and they persist across reloads.
- Changing a setting after a run marks the results **stale** ("You changed the set-up after this run") and disables recording until the next run.
- The 3D view renders **on demand**: frames are drawn only while something moves, which helps low-end devices (D-08). Colors come from the design tokens, so the view follows light and dark themes.
- The model assumptions dialog now lists the 2 m ramp, the steady 0.5 m/s pull, no static friction, and the instrument resolutions.

## 5. Differences from the plan, and why

| Plan | Implemented | Reason |
|---|---|---|
| Rapier for rigid-body visuals with cross-checks against the analytic model (D-12) | **Rapier is not used yet.** The 3D block is positioned from the physics-core run | The incline needs no contact simulation: the analytic model plus a deterministic integrator is exact and cheaper on low-end devices. Rapier stays installed for scenes that need contact (e.g. a released block sliding back). It adds nothing to the bundle until imported |
| Lever with self-weight | Massless beam, first class only | Self-weight needs its own PE term in the ledger. Planned with the lever lab |
| Optional seeded measurement noise | Not added; readings are quantized only (seed stored as 0) | Keeps results reproducible for the teacher; noise can be added later behind a setting |
| Branded unit types | Unit-suffixed names (`massKg`, `inputForceN`) | Same safety in review with less type noise. Can be revisited |
| Static friction threshold | Not modelled (stated in the assumptions dialog) | Kinetic friction is what the efficiency measurement needs |

## 6. Still to do (next milestones)
Lever and pulley lab screens (models are done), wheel and axle, hydraulic press (plan 3.4 and 3.6), the diagnostic (due 24 Feb 2027, see `DECISIONS.md`), and subject-matter-expert sign-off on the equations and parameter ranges (plan §6.6). That sign-off is a release blocker.
