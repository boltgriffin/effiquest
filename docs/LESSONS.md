# LESSONS.md

Milestone 12: draft lesson content for the five modules (`src/content/lessons.ts`).

**Status: DRAFT for teacher review (decision D-10).**
- The concept note names the module topics and objectives (SRC-O1..O6, SRC-M1, SRC-T3) but contains no lesson text (gap G-13). The developer drafted these lessons from those objectives; the subject teacher approves or edits them.
- Every lesson shows **"Draft · teacher review"**. The bicycle-uphill section also shows **"Awaiting teacher check" (D-13)**.
- Videos are YouTube links chosen by the teacher (Video tab, D-27), set in `src/content/modules.ts`.

## 1. What each lesson contains

| Module | Sections | Worked examples | Practice questions | Lab links |
|---|---|---|---|---|
| Torque and rotational motion (SRC-O1, G1) | straight-line ↔ turning partners (table); torque τ = r F sin θ; τ_net = I α | door 32 N·m; at 30°: 16 N·m; wheel α = 5.0 rad/s² | wrench (MCQ), torque (numeric) | lever, wheel and axle |
| Mechanical advantage and efficiency (SRC-O2, G2, G4) | work; AMA and IMA; efficiency | ramp: IMA 4.0, AMA 3.08, η 76.9 % | AMA < IMA (T/F), pulley η (numeric) | inclined plane |
| From simple to compound machines (SRC-O3, G3) | the six simple machines (table of IMA); machines in series | car jack: IMA 200, η 72 %, AMA 144 | wheelbarrow (MCQ), η in series (numeric) | — (compound labs later, D-05) |
| Hydraulics and Pascal's principle (SRC-O4, G6) | pressure; Pascal; brakes, lifts, excavators and their limits | 60 kPa; car lift 15 000 N and 5.0 m of stroke | piston distances (T/F), air in brake lines (MCQ) | hydraulic press |
| Measuring efficiency in real machines (SRC-O5, O6, G4, G5) | measuring η; where the energy goes; power; bicycles and brakes | pulley 81.8 %; input power 37.5 W; bicycle climb 10.8 kJ (illustrative) | η > 100 % (MCQ), ramp η (numeric) | pulley |

**In every lesson:**
- **Start:** an introduction and a clickable list of contents.
- **Sections:** each names its source codes, e.g. "Part 2 · SRC-O2".
- **"Common idea / what the evidence says":** a block for each misconception the module targets, quoting the learner belief from `content/misconceptions.ts`.
- **Worked examples:** numbered steps and the answer.
- **Practice questions:** these use the same question component and marking as the knowledge checks: feedback, one more try, then the answer and explanation, and "Try this question again". **They are not recorded.** Recorded checks remain the quest knowledge checks and diagnostics (Milestone 10).

## 2. Accuracy checks (`src/content/lessons.test.ts`)
- **Worked-example answers are recomputed with `edu-calc`:** torque, angular acceleration, velocity ratio, AMA, efficiency, pressure, Pascal and power. The compound-efficiency and bicycle values are checked by direct calculation.
- **Every module** has one lesson, and every section has a source code.
- **Links and references:** every lab link points to a listed lab, and every misconception the module targets has a "common idea" block.
- **Practice questions:** keys exist; a correct option is never a tagged distractor; tolerances are above 0.
- **D-13:** the bicycle section carries the teacher-check note.
- **Regression:** every quest's lab stage points to a listed lab.

## 3. Fixed along the way
- **The hydraulic press was missing from the lab list** (a Milestone 09 edit that silently didn't apply). It now appears on the Lab page, the "Pressure at work" quest links to it, and lab progress counts 5 labs. A test now guards this.
- **Math in lesson text** (e.g. W_out) is shown with subscripts, like the equation cards (`components/MathText.tsx`).
- **End-to-end tests never use the real Supabase project:** `playwright.config.ts` blanks the Supabase variables for the test build.
- **Online-class sign-in fields** are labelled "… on your slip", so they no longer share a name with the learner-code field in Settings.

## 4. For the teacher to review
1. Each lesson's wording, examples and reading level (Grade 11, English, D-06).
2. **D-13:** the bicycle-uphill framing and its illustrative numbers (70 kg, 15 m, 95 % chain efficiency).
3. The typical values used for illustration: ramp 65 N, jack 90 % / 80 %, wheel I = 0.12 kg·m².
4. Whether to add local examples (farm tools, jeepney brakes) for SRC-T5.
5. When approved:
   - set `status: 'approved'` and bump `version` in `lessons.ts`;
   - the draft badge disappears automatically;
   - remove `pendingCheck` once D-13 is confirmed.
