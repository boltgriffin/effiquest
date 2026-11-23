# HYDRAULICS_LAB.md

Milestone 09: the hydraulic press laboratory at **`/lab/hydraulic-press`**.

- **Source:** concept note SRC-O4: apply Pascal's law to real systems such as brakes, lifts and excavators. Also SRC-G6 (hydraulics understood only in isolation) and SRC-O2 (real-world limits).
- **Scope:** owner decision D-05 lists the hydraulic press in the first release, and the owner chose it for this milestone (2026-11-23).
- **Template:** built on the shared lab template (`SIMPLE_MACHINES_LABS.md`).

## 1. The model (`src/physics-core/hydraulic.ts`): a non-ideal press

| Aspect | Model |
|---|---|
| Ideal (Pascal) | The same pressure everywhere in an incompressible fluid: P = F₁ ÷ A₁, F₂ = P·A₂ = F₁·A₂ ÷ A₁. The small piston moves A₂ ÷ A₁ times as far as the large one |
| Loss 1: seal friction | A constant force at each piston seal (the learner sets it, 0-20 N, the same for both seals), opposing the motion |
| Loss 2: leakage | Fluid escapes past the seals at q = k·P (laminar leak). The learner sets the leak in mL/s at 1 MPa, 0-20. The small piston must push this extra fluid, so **its stroke is longer than A₂ ÷ A₁ × the lift**, and the escaping fluid carries energy P·q |
| Forces | P·A₂ = W + m a + f₂, A₁·v₁ = A₂·v₂ + k·P, F₁ = P·A₁ + f₁ |
| Energy ledger | F₁v₁ = (W + m a + f₂)v₂ + k P² + f₁v₁: useful + kinetic (zero over the run) + seal friction + leakage, each integrated separately |
| Motion | The load is lifted 0.1 m: rest → steady 0.02 m/s → rest. One long stroke (a real jack pumps many short strokes) |
| Ideal MA | Stays the **geometric** A₂ ÷ A₁ (`MachineRun.idealInputDistanceM`), so leakage shows up as lower efficiency, not as a higher "ideal" value |

**Not a friction or efficiency slider.** The settings are physical: seal friction force and leak flow. Efficiency is computed from work.

## 2. Validation

| Check | Result |
|---|---|
| Plan test vector (A₁ 0.001 m², A₂ 0.1 m², f₁ 5 N, f₂ 200 N, 5000 N load, no leak) | F₁ = **57 N**, η = **87.72 %** ✔ |
| Ideal press (no friction, no leak) | F₁ × A₂/A₁ = W exactly; stroke ratio = A₂ ÷ A₁ exactly; η = 100 % ✔ |
| Energy ledger (defaults) | closes to below 10⁻⁹ of the input ✔ |
| Leakage | extra stroke = leaked volume ÷ A₁ (exact); IMA stays 16 for 0.02 / 0.08 m pistons ✔ |
| Trends | η falls with seal friction and with leakage; a wider large piston needs less effort but a longer stroke ✔ |
| Defaults, hand check (100 kg, d₁ 0.02 m, d₂ 0.08 m, 5 N seals, 8 mL/s) | P = 986 N ÷ 0.005027 m² = **196.2 kPa**; F_in = 196.2 kPa × 3.142 × 10⁻⁴ m² + 5 N = **66.6 N**; IMA **16.00**; AMA **14.73**; stroke **1.627 m** (ideal 1.600 m + 8.5 mL ÷ A₁); η **90.5 %** (seal friction 8.63 J, leakage 1.66 J) ✔ |

Teaching point visible in the results: **AMA ÷ IMA = 92.1 % but η = 90.5 %**. With leakage, the effort also travels further than the ideal ratio, so efficiency is lower than the force comparison alone suggests.

## 3. What the learner sees
- **Measurements:** all the shared readouts, plus **fluid pressure (kPa)**, **area ratio A₂/A₁**, **output force from your effort (ideal, by Pascal)** to compare with the load weight, and **fluid leaked (mL)**. The energy bar splits useful work, seal friction (hatched) and leakage (dotted).
- **Diagram:**
  - Piston diameters are to scale. Movements are **not** (the stroke can be up to 36 × the lift), so both pistons move over fixed drawn distances with a caption saying so, and the true distances are shown as numbers.
  - The pressure is shown as "the same everywhere in the fluid". Leak drops appear when leakage is above 0.
- **3D:** see-through cylinders, fluid columns, pistons, load and labels, with camera presets Front, Angled and Pistons. Movements are also marked not to scale.
- **Guide:**
  - Pascal's principle in plain language, the parts, and the equations P = F/A, F₁/A₁ = F₂/A₂, IMA = A₂/A₁ and η.
  - Instructions vary the large piston, then set leakage to 0.
  - Prediction about the stroke length, and reflection questions including the **car brake** example (SRC-O4).
  - Knowledge check: 5000 N from 50 N; why no energy is created; what a leak does.
  - All text drafted for teacher review (D-10).
- **Quests:** "Pressure at work" (G6) now has the lab stage *Lift a load with a hydraulic press*.

## 4. Assumptions and limitations (also in *Model assumptions*)
- Incompressible fluid; both pistons at the same height (no extra pressure from depth); light pistons.
- Constant seal friction; leakage proportional to pressure; leaked fluid returns to the reservoir.
- One long stroke instead of pumping; the lift (0.1 m) and speed (0.02 m/s) are fixed.
- No fluid flow losses in the pipe, no air in the oil (compressibility), no relief valve.
- Parameter ranges are teaching-realistic; a subject teacher should confirm them.

## 5. Tests
- **Physics:** `hydraulic.test.ts`, 8 tests (above).
- **Template:** the press joins the shared machine-definition test. η equals AMA × (real d_out ÷ d_in) within the scale's resolution, and **IMA = geometric 16 although the stroke ratio is above 16**.
- **End-to-end** (desktop + Pixel 7): default readouts (196.2 kPa, 66.6 N, IMA 16.00, ideal F₂, both losses); no friction and no leak gives 100.0 %; the pressure quest includes the lab.
