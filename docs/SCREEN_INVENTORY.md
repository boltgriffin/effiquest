# SCREEN_INVENTORY.md

> Updated in Milestone 04: progress tracking, completion feedback, the phone menu, breadcrumbs and the teacher Class overview (`/teacher`) were added. See `NAVIGATION_AND_DASHBOARDS.md` for the current behavior; this file records the Milestone 03 baseline.

Milestone 03. Every screen, its route, what is real, what is placeholder, and every control's behavior.
Legend: **Works** = fully functional · **Sample** = functional UI showing clearly labeled sample/placeholder data · **Disabled** = shown but disabled with a visible reason.

| # | Screen | Route | File |
|---|---|---|---|
| 1 | Welcome / landing | `/welcome` | `pages/WelcomePage.tsx` |
| 2 | Student dashboard | `/` | `pages/DashboardPage.tsx` |
| 3 | Learning modules list | `/learn` | `pages/LearnPage.tsx` |
| 4 | Learning module page | `/learn/:moduleId` | `pages/ModulePage.tsx` |
| 5 | Simulation laboratory (with experiment instructions panel and results & measurements panel) | `/lab` | `pages/LabPage.tsx`, `features/lab/*` |
| 6 | Quests list | `/quests` | `pages/QuestsPage.tsx` |
| 7 | Quest / challenge screen | `/quests/:questId` | `pages/QuestPage.tsx` |
| 8 | Assessment (diagnostics + item runner + results) | `/assess` | `pages/AssessPage.tsx`, `features/assessment/*` |
| 9 | Progress | `/progress` | `pages/ProgressPage.tsx`, `features/progress/*` |
| 10 | Settings | `/settings` | `pages/SettingsPage.tsx` |
| 11 | Design system reference | `/design` | `pages/DesignPage.tsx` |
| 12 | Not found | any unknown path | `components/StatePanels.tsx` |
| - | Teacher dashboard | **not built** | Not in approved scope: it depends on decisions D-03 (backend) and D-09 (roles). No shell or dead link was added. |

## Content sources
- Module titles/objectives restate the concept note's objectives SRC-O1..O6. Misconception statements paraphrase SRC-G1..G6. Equations come from `PHYSICS_MODEL_PLAN.md`.
- **No lesson text, videos or diagnostic items were invented.** Those areas show empty states that name the teacher as the source (D-10).
- Quest questions and the lab's prediction prompt are short activity framings written for the layout; they should be reviewed by the teacher.

## 1. Welcome `/welcome`
Shown on the first visit (the dashboard redirects here until it is dismissed). Full-width, no app chrome.
- **Enter the laboratory** - Works: stores "seen" on this device and goes to the dashboard.
- **How a lab session works** - Works: in-page link to the method section.
- Hero diagram - static instance of the lab's inclined-plane diagram, with a legend for the three physics colors.

## 2. Dashboard `/`
Suggested next step (first quest), module list with "Not started" status, diagnostics status, quests, and a note on local storage.
- **Start this quest**, **Open the lab**, module rows, quest rows, **Go to diagnostics** - Works (navigation).
- "Not started" / "Not yet available" are true statements: progress tracking and diagnostic items do not exist yet.

## 3. Modules `/learn`
Numbered ruled list of the five modules with the misconceptions each targets. Each row - Works (navigation).

## 4. Module page `/learn/:moduleId`
Tabs: **Lesson** (empty state: text not yet supplied), **Video** (empty frame: no video yet), **Key equations** (real equations with units). Side panel lists the targeted misconceptions. **Try it in the lab** - Works. Tabs - Works (keyboard arrows). Unknown module id → not-found state.

## 5. Laboratory `/lab` (inclined plane)
Marked **Preview** in the header.
- **Model assumptions** - Works: opens a dialog listing the model's assumptions (Esc/close/backdrop closes).
- **Apparatus tabs:** Diagram (Works: the SVG follows the sliders exactly; arrow lengths labeled as illustrative) and 3D view (Works: lazy-loads the R3F canvas from Milestone 02, or a no-WebGL message).
- **Experiment instructions panel** (5-step protocol, step indicator clickable, Back/Next):
  1. *Predict* - choose an answer, **Lock in prediction** - Works (session only).
  2. *Set up* - sliders for angle θ (5-60°), friction μ (0-0.80), mass (1-50 kg) - Works (drive the diagram); **Reset to defaults** - Works.
  3. *Measure* - **Run** and **Record trial** - **Disabled**, with a visible warning: they need the physics engine (later milestone).
  4. *Calculate* - enter W<sub>in</sub>, W<sub>out</sub>, your η; **Check my answer** - Works: uses `edu-calc/efficiency.ts`, shows the worked solution, rejects invalid input and flags W<sub>out</sub> > W<sub>in</sub> as a measurement error.
  5. *Explain* - two reflection fields; **Save to journal** - Works: writes a journal entry to IndexedDB on this device, with success/error states.
- **Results & measurements panel:** readouts show "—" (not measured) and an empty state by default. **Show sample values** - Sample: fills the readouts and the energy-flow bar with the physics plan's test case (labeled, fixed, independent of the sliders).

## 6. Quests `/quests`
Four quests, each tied to one misconception (G2, G4, G1, G6). Each tile - Works (navigation).

## 7. Quest screen `/quests/:questId`
Vertical route of stages (lesson → lab → check) with an **Open** link for each - Works (navigation). Side panel states the belief being tested. Callout: progress, unlocking and points are not tracked yet (decision D-11). All stages read "Not started".

## 8. Assessment `/assess`
- Baseline and post diagnostics listed with **Items not yet supplied** badges (no fake test).
- **Try the sample items** - Sample: runs three clearly labeled sample items (two multiple-choice, one numeric with % unit): progress bar, Previous/Next, **Submit answers**, then a scored result that names the misconception behind any tagged wrong answer. **Try again** and **Back to diagnostics** - Works. Nothing is saved.

## 9. Progress `/progress`
Empty state by default ("No results yet" → **Go to diagnostics**). **Preview with sample data** - Sample: shows the baseline-vs-post chart (with **Chart/Table** tabs) and per-misconception progress bars, with a "Sample data" badge.

## 10. Settings `/settings`
- **Theme** System/Light/Dark - Works (applies immediately, remembered on this device).
- **3D quality** - Works (changes the 3D canvas pixel ratio).
- Connection status - Works (live).
- **Show the welcome screen** - Works. **Design system reference** - Works.

## 11. Design reference `/design`
Tokens, typography, every component with working interactions, states and the icon set.

## 12. Not found
Dashed state block with **Back to dashboard**.

## App shell (all in-app screens)
Phone: top bar + bottom tabs; tablet: icon rail; desktop: sidebar (see DESIGN_SYSTEM §5). Offline banner/indicator, skip link, PWA update/offline-ready toast (Update / Dismiss - Works).

## Verification
- E2E (Playwright, desktop + Pixel 7): 26 tests cover the welcome redirect, navigation to every section on both layouts, module tabs, lab slider → diagram, sample values, efficiency check, assumptions dialog + Esc, journal save, the full sample assessment, progress chart/table, theme switching, design page, not-found, 3D tab, manifest.
- Screenshots of all screens at 390 px, 820 px (dark theme) and 1440 px were reviewed. They revealed horizontal overflow on phone/tablet, a clipped step indicator, a diagram label collision and a wrapping sidebar subtitle, all fixed.
