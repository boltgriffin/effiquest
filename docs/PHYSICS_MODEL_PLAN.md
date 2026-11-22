# PHYSICS_MODEL_PLAN.md

Scope: equations, assumptions, units, limits, and the simulation strategy for the machines needed by SRC-O1…O6. Equations are standard introductory mechanics; they are **[REC] technical content to be reviewed by the teacher/subject-matter expert (D-13)**, not statements from the concept note.

## 1. Governing principle (answers BRF-5)

> **Efficiency is an output, never an input.**
> η = W_out / W_in × 100 %, where both works are *computed* from forces and displacements in the model.
> Losses must come from **named physical mechanisms with physical parameters** (friction coefficient μ, bearing friction torque, mass of moving parts, seal friction force, leakage flow, rolling resistance, air drag). A "friction %" or "efficiency %" slider that scales the result is not permitted in any simulation.

Where a textbook-style exercise gives a stated efficiency ("a machine is 80 % efficient, find the effort"), that is an **assessment calculation** (F3.6), clearly labelled as a given, separate from simulations.

## 2. Equations and relevance

| Quantity | Equation | Units | Relevance | Notes / assumptions |
|---|---|---|---|---|
| Work | W = F·d·cosθ (θ = angle between force and displacement; W = Fd only when parallel) | J = N·m | Core: W_in, W_out (SRC-O5) | Use the *component along displacement*. Work by a force that does not move its point of application is 0. |
| Power | P = W/t (average); P = F·v instantaneous | W = J/s | Bicycle/hill scenario (SRC-O6); time-based comparisons | Constant-speed or averaged over the stated interval. |
| Torque | τ = r·F·sinθ (θ = angle between **r** and **F**) | N·m | SRC-G1, SRC-O1, lever, wheel & axle | Magnitude; sign convention (CCW +) added in the model so net torque is signed. |
| Rotational analogues | τ_net = Iα; W = τ·Δθ; P = τ·ω; KE_rot = ½Iω² | | SRC-G1/O1 analogy table: F↔τ, m↔I, a↔α, x↔θ, v↔ω | Rigid bodies, fixed axis. Moments of inertia from simple shapes (disk, rod, ring). |
| Mechanical advantage (actual) | AMA = F_out / F_in | dimensionless | SRC-O2 | Forces measured along the line of action in steady (constant-velocity) operation. |
| Ideal MA / Velocity ratio | IMA = VR = d_in / d_out (linear) or r_in/r_out (wheel&axle, gears) | dimensionless | SRC-O2 | Purely geometric; independent of friction. |
| Efficiency | η = W_out/W_in × 100 % = (AMA / IMA) × 100 % | % | Core | Equality of the two forms holds only when the displacements are those of the same quasi-static motion. Model asserts it numerically. |
| Pressure / Pascal | P = F/A; P₁ = P₂ ⇒ F₂/F₁ = A₂/A₁; d₁/d₂ = A₂/A₁ | Pa = N/m² | SRC-O4, SRC-G6 | Ideal: incompressible fluid, equal pressure at same level (neglect hydrostatic head differences, or include ρgΔh explicitly when pistons differ in height). |
| Weight | W = mg, g = 9.81 m/s² | N | All | Constant g; document value used. |
| Inclined plane | ideal F = mg sinθ; IMA = L/h = 1/sinθ | N | SRC-O3 | |
| Friction (Coulomb) | f = μN, direction opposes sliding | N | SRC-G4 | Static vs kinetic μ distinguished; experiments run at steady sliding. |

## 3. Per-machine real-efficiency models

Each model gives the *input force needed to move the load at constant slow speed*, from which W_in is computed. Constant speed makes ΔKE ≈ 0 so η is meaningful.

### 3.1 Inclined plane (parallel push, block sliding up, kinetic friction μ)
- N = mg cosθ; F_in = mg (sinθ + μ cosθ); IMA = 1/sinθ; AMA = mg / F_in.
- η = sinθ / (sinθ + μ cosθ). **Misconception it teaches:** a gentle ramp has a big MA yet its efficiency falls as μ matters more (SRC-G2/G4).
- **Test vector:** m = 10 kg, θ = 30°, μ = 0.20, g = 9.81 → F_in ≈ 66.04 N, F_ideal = 49.05 N, AMA ≈ 1.485, IMA = 2, η ≈ 74.3 %.

### 3.2 Lever (class 1/2/3) with pivot friction
- Ideal: F_e·L_e = F_l·L_l ⇒ IMA = L_e/L_l.
- Real: add pivot friction torque τ_f = μ_p·r_p·N_p (N_p ≈ F_e + F_l + lever weight at the pivot; r_p pin radius) opposing motion, plus lever self-weight torque about the pivot. Steady rotation: F_e·L_e = F_l·L_l + τ_f + τ_self.
- W_in = F_e·d_e, W_out = F_l·d_l (d ∝ arm length for small angles; use true arc geometry in the engine).
- Test: τ_f = 0 and massless ⇒ η = 100 % exactly; adding μ_p > 0 ⇒ η < 100 %.

### 3.3 Pulley systems (fixed, movable, block-and-tackle)
- Ideal: n supporting rope segments ⇒ IMA = n, rope travel = n·h. (This part of the prototype is correct.)
- Real contributions: (a) weight of movable block(s) W_b; (b) sheave bearing friction; (c) rope bending/sliding friction (optional).
- Frictionless but with block weight: F_in = (W_load + W_b)/n; η = W_load / (W_load + W_b).
  **Test vector:** n = 4, W_load = 200 N, W_b = 10 N ⇒ F_in = 52.5 N, W_in = 210 h, W_out = 200 h, η ≈ 95.2 %.
- Bearing friction per sheave: tension rises by ΔT ≈ τ_b/R per sheave passage with τ_b = μ_b·r_b·N_b (N_b = resultant tension load on that bearing), R = sheave radius. Computed sheave by sheave in the solver, giving η that falls with n — teaching that *more segments ⇒ more MA but lower efficiency* (SRC-G2).
- Limitation: ropes are modeled as massless, inextensible; no slip over sheaves.

### 3.4 Wheel and axle / gears
- IMA = R_wheel / r_axle (effort on wheel). Real: bearing friction torque + inertia during start-up. τ_in·θ_in = τ_out·θ_out + friction work.
- Link to F3.2: show τ = Iα for acceleration phase vs constant-speed phase.

### 3.5 Screw and wedge
- Screw (lead ℓ, mean radius r, friction μ): ideal IMA = 2πr_handle/ℓ; real raising torque T = F·r·tan(λ + φ) with φ = atan μ; η = tanλ / tan(λ+φ). Wedge: F_in from force balance with friction on both faces. Marked **S (Should)**; formulas to be verified by the SME before implementation.

### 3.6 Hydraulic jack/press (Pascal)
- Ideal: P = F₁/A₁; F₂ = P·A₂; d₂ = d₁·A₁/A₂; IMA = A₂/A₁.
  **Test vector:** F₁ = 50 N, A₁ = 0.001 m², A₂ = 0.1 m² ⇒ P = 50 kPa, F₂ = 5000 N, d₂ = d₁/100.
- Real: seal friction forces f₁, f₂ at each piston (constant magnitude, opposing motion); leakage — fluid volume lost per stroke V_leak = c·P·Δt (laminar leak model with coefficient c, m³/(Pa·s)) so d₂ is smaller than ideal; optional compressibility/air: effective bulk modulus K.
  Steady: F₁_needed = (F₂ + f₂)·(A₁/A₂) + f₁. η = F₂·d₂ / (F₁·d₁).
  **Test vector:** f₁ = 5 N, f₂ = 200 N, F₂ = 5000 N, A₂/A₁ = 100 ⇒ F₁ = 57 N, η ≈ 87.7 % (no leakage).
- Limitations: incompressible ideal case; neglect hydrostatic head, fluid inertia/viscous pipe losses unless stated.

### 3.7 Compound scenarios (SRC-O3/O6)
- **Bicycle on a hill:** required power at the wheel P_wheel = (m g sinθ + C_rr m g cosθ + ½ρC_dA v²)·v; rider power P_rider = P_wheel / η_drive, with η_drive from chain/gear friction (≈ constant, a parameter with a source citation).
  **Content-accuracy flag (D-13):** the concept note says a bicycle is "less efficient" going uphill (SRC-G5). In this model uphill riding mainly demands more *gravitational work/power*; the drivetrain's η does not fall by itself. The lesson should be framed correctly (more power needed, and a higher share of energy goes to gravitational PE vs losses) — the SME must confirm the intended learning point before content is written.
- **Hydraulic brake:** pedal lever (§3.2) in series with master/slave cylinders (§3.6): overall η = product of stage efficiencies. Teaches combination of simple machines (SRC-G3).
- **Excavator/hydraulic lift arm:** lever geometry + cylinder force; planar statics model only.

## 4. Simulation strategy (answers D-12)

### 4.1 Why not "Rapier for everything"
Rapier is a rigid-body engine (bodies, colliders, joints, contact friction). It has **no native pulley/rope-over-sheave constraint, no hydraulic cylinder model, and no energy accounting**. Efficiency requires W_in and W_out to be exact; a general solver's constraint softness and Baumgarte/solver damping *silently create or remove energy*, which would contaminate the very number we are teaching.

### 4.2 Recommended hybrid [REC]
| Layer | Responsibility | Tech |
|---|---|---|
| **Analytic/ODE core (`physics-core`)** | Machine models in §3, closed-form + fixed-step integration (semi-implicit Euler or RK4, dt = 1/240 s internal), energy ledger (W_in, W_out, heat Q_friction, ΔPE, ΔKE, leakage loss). Pure TypeScript, no DOM/Three/React imports. Deterministic. | TypeScript + Vitest |
| **Rapier adapter (`rapier-scene`)** | Rigid-body visuals where contact matters: sliding block on a ramp, falling load, rolling wheel, collisions, user "grab and drag". Used where the engine *is* the physics (ramp sliding with μ; Rapier's Coulomb friction is adequate). For machines Rapier can't model (rope/pulley, hydraulics), Rapier bodies are **driven kinematically** by the core. | `@dimforge/rapier3d-compat` via `@react-three/rapier` |
| **Cross-check** | For each Rapier-driven machine, a test compares Rapier-derived F_in/η to the analytic result within tolerance (e.g., 2 %); mismatches fail CI. | Vitest |

Rule: **the displayed η always comes from the energy ledger**, never from a closed-form shortcut that the learner can't see inputs for, and never from an arbitrary scale factor.

### 4.3 Measurement protocol (what makes η valid)
1. Operate at **constant, slow speed** (a controlled input-force ramp or a velocity-controlled input), so ΔKE ≈ 0 and F_in is the steady-state force.
2. W_in = ∫ F_in·v_in dt, W_out = ΔPE_load (+ ΔKE if nonzero). W_loss = W_in − W_out − ΔKE must be ≥ 0 (within tolerance); if η > 100 % the run is flagged as a numerical/measurement error and **not** clamped silently.
3. Instruments quantize readings (e.g., spring-scale resolution 0.1 N) and optionally add small seeded noise, so learners see measurement uncertainty. Noise is opt-in and seeded for reproducibility.

### 4.4 Numerics
- Double-precision floats; SI units internal; unit conversion only at the UI edge.
- Fixed time step independent of frame rate (accumulator); render interpolates.
- Reject non-finite, negative-length, zero-area inputs at the boundary; clamp-free validation with user-readable errors (as the prototype did well).
- Typed quantities: branded number types (`Newton`, `Metre`, `Joule`) so unit mix-ups fail type-checking [REC].

## 5. Assumptions and limitations (to display in-app on every activity)
- Rigid bodies, constant g = 9.81 m/s², point or planar models, no air drag except in the bicycle model.
- Rope massless/inextensible; no rope slip; no structural failure.
- Coulomb friction with a *single kinetic μ* (static μ used only for start-of-motion threshold).
- Hydraulic fluid incompressible by default; leakage and seal friction are explicit parameters.
- Parameter values (μ, seal friction, bearing friction) are **teaching-realistic, not measured** for any specific product; each preset cites a typical-range source (to be gathered; none is in the concept note).
- The lab is a model: it supplements, and does not claim to reproduce, the classroom apparatus's exact readings (D-04).

## 6. Verification plan
1. Analytic tests for every formula, using the test vectors above.
2. Limit tests: μ → 0 ⇒ η → 100 %; θ → 0 ⇒ torque 0 (sinθ); A₂ = A₁ ⇒ IMA 1; n = 1 pulley ⇒ IMA 1.
3. Conservation tests: |W_in − (W_out + Q + ΔKE + ΔPE_other)| < 1e-6 relative.
4. Monotonicity/property tests: η non-increasing in μ; AMA ≤ IMA always.
5. Rapier-vs-analytic cross-checks (§4.2).
6. SME sign-off on each activity's equations and parameter ranges (blocker for release).
