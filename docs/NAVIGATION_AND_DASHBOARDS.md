# NAVIGATION_AND_DASHBOARDS.md

Milestone 04: navigation, dashboards and the user-experience flow. Built under the owner decisions in `DECISIONS.md`: device-only data (D-03), no accounts (D-09), quest progress only (D-11), first-release machines (D-05), teacher CSV (D-15).

## 1. Roles in scope

| Role | How it exists without accounts | Experience |
|---|---|---|
| **Learner** | Default. Optionally enters a teacher-issued **learner code** (pseudonym, 3-16 letters/digits/hyphens) in Settings. All records are stored under that code on the device; a shared PC can switch codes without mixing work. Without a code, records are stored as `guest`. | Dashboard, Learn, Lab, Quests, Assess, Progress, Settings |
| **Teacher** | A **teacher mode** switch in Settings shows the teacher tools on the teacher's own device. It is a convenience switch, **not security**: learner data reaches this device only through files the learners hand over. | Everything above + Class overview (`/teacher`) |

There is no authentication system, so no route protection is claimed. `/teacher` shows an **unauthorized state** ("Teacher tools are off on this device") with a link to Settings when teacher mode is off.

## 2. Route map

| Route | Screen | Notes |
|---|---|---|
| `/welcome` | Welcome | First visit; outside the app shell |
| `/` | Student dashboard | Redirects to `/welcome` until the welcome screen is dismissed |
| `/learn` | Modules list | Completion badges |
| `/learn/:moduleId` | Module | Breadcrumbs; **Mark module complete** |
| `/lab` | Lab picker | Four labs, planned machines as plain text, link to Compare |
| `/lab/:machineId` | Lab (shared template) | `lever`, `incline`, `pulley`, `wheel-and-axle`; saving the Reflect step completes the lab activity; see `SIMPLE_MACHINES_LABS.md` |
| `/lab/compare` | Compare machines | Latest trial per machine |
| `/quests` | Quests list | Per-quest stage progress |
| `/quests/:questId` | Quest | Breadcrumbs; stage route; reflection form at `#reflect` |
| `/assess` | Diagnostics | Sample items only (real items pending, see §8) |
| `/progress` | Progress | Real completion counts + diagnostics area (sample preview) |
| `/settings` | Settings | Learner code (`#learner`), results download, teacher mode, theme, 3D quality |
| `/teacher` | Class overview | Teacher mode only |
| `/design` | Design reference | Linked from Settings |
| `*`, unknown module/quest ids | Not found | Has an `h1`; link back to the dashboard |

All routes are defined in `src/app/router.tsx`. Heavy screens (lab, progress, settings, design, teacher) are lazy-loaded with a loading state; every route sits under a route-level error element and the shell's error boundary.

## 3. Navigation components

| Component | File | Behavior |
|---|---|---|
| Nav config | `src/app/navigation.ts` | Single list feeding sidebar, rail, phone tabs and phone menu, so they never disagree |
| Sidebar (≥1024 px) / icon rail (768-1023 px) | `src/app/AppShell.tsx` | Learner section; **Teacher** section when teacher mode is on; Settings, learner code and connection status at the bottom |
| Phone top bar | `AppShell.tsx` | Brand (link home), offline icon, **menu button** (`aria-expanded`) |
| Phone menu | `src/app/MobileMenu.tsx` | Side sheet on native `<dialog>` (focus containment, Esc, backdrop click). Lists every destination incl. Assess, Teacher, Settings, and the learner code. Closes on navigation |
| Phone tab bar | `AppShell.tsx` | Five tabs: Home, Learn, Lab, Quests, Progress (Assess is in the menu and on the dashboard) |
| Breadcrumbs | `src/components/ui/Breadcrumbs.tsx` | Module and quest pages; last item has `aria-current="page"` |
| Active state | `NavLink` | `aria-current="page"` + brand-soft fill and brand bar (sidebar) or brand icon pill (tabs). Nested pages keep their section active (e.g. `/quests/x` → Quests) |
| Skip link | `AppShell.tsx` | First focusable element, jumps to `#main` |

## 4. Student dashboard (`/`)

Order follows "what do I do next?", with simulation access second:

1. **Welcome area**: learner code in the eyebrow; if no code, a callout links to `Settings#learner`.
2. **Current learning activity**: the quest most recently worked on (else the first unfinished one), its stage progress and one primary button to the **next stage** (lesson, lab or reflection), plus "See all stages". When every quest is done, a success state links to Progress.
3. **Experiments** (prominent): clickable lab diagram, the inclined plane (Open / Done) and the four first-release machines still to come (D-05) as plain text, not links.
4. **Lessons**: the five modules with Completed / Not started.
5. **Your progress**: three progress bars (modules, labs, quests), no charts.
6. **Ideas to test**: each quest with stages done/total.
7. **Recent activity**: last five events with relative time, each a link; empty state when there is none.

Loading, error (with retry) and empty states are handled.

## 5. Completion and feedback

| Action | Where | Feedback |
|---|---|---|
| Mark module complete | Module page | Success state "Module marked complete", which quest it counts toward, **Next module** button |
| Complete lab activity | Lab, Explain step (save explanation) | "Lab activity complete", link back to dashboard |
| Answer the quest question | Quest page `#reflect` (locked until earlier stages are done) | Saves to the journal; when all stages are done, **"Quest complete"** banner with **Next quest** |
| Storage blocked (private window) | All of the above | Danger callout explaining the work was not saved |

Progress is derived from an **append-only event log** (`progress_events`: `lesson_completed`, `activity_completed`, `quest_stage`), so completions are never edited and later sync stays idempotent. Derivation lives in `src/content/progress.ts` (pure, unit-tested): stage completion, current quest, summary, recent activity.

## 6. Teacher dashboard (`/teacher`)

Scope comes from D-15 (class CSV) and the "consequences" in `DECISIONS.md`.

- **Import results files**: learners download `effiquest-results-<CODE>.json` from Settings; the teacher selects many files at once. Each file is validated (format, version, code, every record) and reported individually; a newer file for the same code replaces the older one. Imports are stored in IndexedDB (`class_imports`, schema v2).
- **Class overview**: learner count, average modules, labs and quests completed.
- **Learner progress summary**: table per learner code with completions and last activity; remove one learner's import.
- **Assessment overview**: average baseline and post score per misconception (G1-G6); an empty state until diagnostics exist.
- **Activity monitoring**: latest ten events across imported learners.
- **Download class CSV**: one row per learner (completions, `baseline_G1..G6`, `post_G1..G6`, `change_G1..G6`, last activity) and a `CLASS AVERAGE` row. Fields are escaped and protected against spreadsheet formula injection.
- **Preview with a sample class**: four invented learners, labeled "Sample class"; import and export are disabled while it is on.
- **Remove all imported results**: with a confirmation dialog; affects this device only.

## 7. User journeys (verified by end-to-end tests)

| Journey | Steps | Test |
|---|---|---|
| First visit | `/` → welcome → Enter → dashboard | `smoke.spec.ts` |
| Learner completes a quest | dashboard next step → module → Mark complete → lab → Explain → quest → answer → "Quest complete" → dashboard shows 1 of 4 quests and the activity | `journeys.spec.ts` |
| Reflection gate | quest with earlier stages open → reflection locked | `journeys.spec.ts` |
| Learner hands in results | Settings → invalid code rejected → code saved → Download my results | `journeys.spec.ts` |
| Teacher setup | `/teacher` unauthorized → Settings → teacher mode → Class overview | `journeys.spec.ts` |
| Teacher collects results | import valid + invalid file → per-file report → tables → Download class CSV | `journeys.spec.ts` |
| Navigation | every section via sidebar (desktop) and tabs + menu (phone); menu closes after navigating; active state; breadcrumbs | `smoke.spec.ts`, `journeys.spec.ts` |

## 8. Known limits and open items

- **Baseline diagnostic not built yet.** Implementation now starts 1 March 2027 (D-14); the in-app baseline is due by 24 Feb 2027 (see `DECISIONS.md`). The CSV already has the baseline/post columns.
- The lab is still a preview (no physics engine), but completing its Explain step counts as the lab activity for quests.
- Lesson text is not written yet (D-10: developer drafts, teacher approves).
- Teacher mode is not access control; learner data on a device is readable by anyone using that device.

## 9. Verification (2026-11-23)

Typecheck, lint and Prettier are clean. 35 unit tests pass (progress derivation, export validation, CSV, DB v1→v2 migration and others). 43 end-to-end tests pass on desktop and Pixel 7. A route sweep visited all 22 routes (including unknown ids) with **no console errors**, and confirmed every internal link on every page points to an existing route. It also found that the not-found and unauthorized states lacked a page `h1`, which is now fixed. Screenshots at 390 / 820 / 1440 px were reviewed.
