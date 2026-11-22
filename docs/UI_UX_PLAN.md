# UI_UX_PLAN.md

**[REC]** direction. The concept note supplies the *pedagogical intent* (inquiry, cognitive conflict, hands-on measurement, journals, "quest for true efficiency"); it supplies **no visual design, layout, or interaction requirements**. No user research has been done yet (see §8).

## 1. Users and contexts
| User | Need | Source |
|---|---|---|
| Grade 11 learner (≈16–17 y) | Understand *why* a machine's MA isn't its efficiency; practice measuring; get corrected on the specific misconception | SRC-04, SRC-G2/G4 |
| Teacher | See which misconceptions persist; run pre/post diagnostics; collect results | SRC-05, SRC-N1..N4 |
| Likely contexts [GAP G-02] | Shared school PCs, phones/tablets, patchy internet, flipped learning at home | SRC-M1, SRC-S6 |

## 2. Design principles
1. **Misconception first.** Each screen states the belief being tested ("Does a bigger MA mean less energy wasted?").
2. **Predict → Observe → Explain.** The learner commits to a prediction before the run; the lab then creates the conflict; an explanation prompt closes the loop (supports SRC-M5, SRC-M6).
3. **Measure, don't set.** Learners read virtual instruments and compute η themselves; the app checks their calculation. No efficiency slider (BRF-5).
4. **Show the energy.** After every run, an energy-flow diagram splits W_in into useful work and losses — the antidote to the "perfect machine" (SRC-G4).
5. **Text equivalent for every 3D readout** (accessibility and low-end fallback).
6. **Calm, low-distraction.** Gamification light until D-11 is decided.
7. **Works on a 360 px phone and a 1366×768 school PC.**

## 3. Information architecture / navigation

```
Home (quest map)
├─ Diagnostics        Baseline (pre) · Post
├─ Learn              Lessons (video/text) per topic → linked labs
├─ Lab                Machine picker → Lab screen
│    Incline · Lever · Pulley · Wheel & Axle · Hydraulics · (Screw/Wedge) · Compound (Bicycle, Brake, Lift)
├─ Quests             Stages combining lessons + labs + checks
├─ My Journal         Reflections, "what I believed → what I found"
├─ My Progress        Misconception mastery, pre/post, trial history
├─ Teacher (if D-03/D-09)  Class list · Misconception heatmap · Export
└─ Settings           Language, quality (Auto/Low/High), reduced motion, text size, offline status, data export
```
Primary nav: bottom tab bar on mobile (Home, Lab, Learn, Progress), left rail on ≥ 1024 px. Persistent offline/sync indicator in the header.

## 4. The Lab screen (core UX)

Layout (landscape / desktop):
```
┌───────────────────────────────┬───────────────────────┐
│                               │ 1 PREDICT  (prompt)   │
│        3D viewport            │ 2 CONTROLS (params    │
│   (orbit/zoom, snap-views,    │   with units & bounds)│
│    virtual instruments)       │ 3 MEASURE  (table)    │
│                               │ 4 CALCULATE (W, MA,   │
│  [Run] [Pause] [Reset] [Rec]  │   VR, η — learner     │
├───────────────────────────────┤   enters, app checks) │
│ Energy-flow (Sankey) + charts │ 5 EXPLAIN  (journal)  │
└───────────────────────────────┴───────────────────────┘
```
Portrait mobile: viewport on top (~45 % height), a bottom sheet with stepper tabs 1→5; charts in a swipe pane.

Key interactions
- Parameter controls: numeric field + slider, unit always visible; invalid input shows a message and blocks Run (never silently clamps).
- "Ideal vs Real" toggle: ghost machine with μ = 0 vs real; lets the learner see MA unchanged while η drops.
- Measurement realism: spring-scale resolution, optional seeded noise, "tare" step — mirrors SRC-R2 apparatus.
- Guided mode (hints, GSAP camera tours) vs Free mode.
- 3D control scheme: orbit (one finger/drag), zoom (pinch/wheel), preset view buttons; **no gesture required** to complete any task (buttons/keyboard alternatives).

## 5. Key screens (first release)
1. Home / Quest map — progress ring, "next step" button, offline badge.
2. Baseline diagnostic — one question per screen, misconception-tagged, no feedback until the end (it measures, not teaches).
3. Lesson — video (offline-cached), transcript, key-equation card (always with units), "try it in the lab" link.
4. Lab screens (per machine; shared shell).
5. Result card after a run — measured vs ideal, η, energy split, one-sentence "what this means", prompt to journal.
6. Journal.
7. Progress — misconception mastery bars (G1–G6), pre/post comparison.
8. (Optional) Teacher dashboard — class heatmap by misconception; CSV export.
9. Settings.

## 6. Visual and interaction direction
- Light and dark themes; color is never the only signal (force vectors also differ by line style/labels).
- Consistent encoding: input force = one hue, output/load = another, losses = a third + hatch pattern; used identically in 3D arrows, tables, charts.
- 3D style: clean, low-poly, matte materials, no heavy post-processing (performance); labelled parts; real-scale grid optional.
- Typography: system/humanist sans, ≥ 16 px body; math set with a lightweight renderer (e.g., KaTeX) [REC, new dependency to approve].
- Motion: short, purposeful; `prefers-reduced-motion` disables camera tours and eases.
- Language: plain, short sentences; terms defined on first use; bilingual per D-06.

## 7. Accessibility and inclusion [REC]
WCAG 2.2 AA for all non-canvas UI; focus order and visible focus; labels and units programmatically associated (the prototype's approach is a good baseline); live-region announcements of results; target size ≥ 44 px; text alternatives for 3D (a "Describe this scene" summary + readouts table); color-contrast verified in both themes; no timers on assessments; screen-reader paths for lessons/quizzes/journals are mandatory, while full non-visual use of 3D labs is out of scope unless approved (document the limitation).

## 8. UX validation plan (not yet done)
1. Review wireframes with the teacher/proponent (D-04/D-05).
2. Paper-prototype the predict→observe→explain loop with 5 learners.
3. Usability test on the actual lowest-spec device and the school network.
4. Misconception-diagnostic pilot to check items detect G1–G6 as intended.
5. Metrics to gather (local/opt-in): time on task, trial counts, prediction accuracy before/after, completion — *no targets are set because the concept note sets none (G-07).*
