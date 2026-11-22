# PROJECT_OVERVIEW.md

**Project:** EffiQuest 3D – Interactive Machine and Efficiency Laboratory
**Milestone:** 01 — Project Analysis and Technical Planning (planning only; no application code written)
**Plan date:** 2026-11-22
**Status:** Awaiting owner review. Milestone 02 will not begin until approved.

Document map: `SOURCE_REQUIREMENTS.md` · `FEATURE_REQUIREMENTS.md` · `SYSTEM_ARCHITECTURE.md` · `DATABASE_PLAN.md` · `PHYSICS_MODEL_PLAN.md` · `UI_UX_PLAN.md` · `DEVELOPMENT_ROADMAP.md` · `RISKS_AND_ASSUMPTIONS.md`

Tagging convention used in every document: **[SRC]** from the concept note · **[BRF]** from the owner's brief · **[REC]** developer recommendation · **[EXT]** extension beyond the sources, needs owner approval · **[GAP]** unknown.

## 1. Purpose (source-grounded)

The concept note [SRC-01..06] targets Grade 11 General Science learners who can recall formulas but hold persistent misconceptions: mechanical advantage ≠ efficiency, machines are "perfect", translational formulas don't transfer to rotational motion, simple machines don't obviously combine into compound ones, and hydraulics isn't transferred to real systems [SRC-G1..G6]. The owner's brief [BRF-1..3] asks for a PWA named *EffiQuest 3D* to serve this purpose. The software is therefore a **conceptual-change tool for a classroom intervention**, not a general physics sandbox.

**Design consequence [REC]:** every simulation should be built so a learner can *predict, observe, measure, and explain* a specific misconception, and the physics must be honest enough that "efficiency" is something the learner *measures*, never a number they set.

## 2. Workspace analysis

### 2.1 Target workspace — `c:\Users\Philip John Belo\Desktop\effiquest`
- **Completely empty** (0 files). Not a git repository. No framework, dependencies, or features exist here.
- The concept note was **not** in this folder (see `SOURCE_REQUIREMENTS.md` §1).

### 2.2 Existing prototype found elsewhere — `Desktop\JAVA JDBC CRUD\EffiQuest`
Found by searching the user's profile. Assessment is by **static inspection only**; I did not install, build, or run it, so "works / doesn't work" claims are not made.

| Aspect | Finding |
|---|---|
| Structure | Monorepo: `frontend/` (Next.js 16.4.6, React 19.3, Tailwind 4.3, TypeScript), `backend/` (Laravel 12, Sanctum, SQLite→MySQL/PostgreSQL), `docs/`. Plus a **second, parallel Next.js skeleton at the repo root** (`src/`, using `@supabase/ssr`, Recharts) that conflicts with `frontend/` (which uses Laravel proxies, Chart.js, framer-motion). Two competing auth/backend directions coexist. |
| Git | 1 commit ("Initial EffiQuest setup"); many later files modified/untracked. |
| Docs | `ARCHITECTURE.md`, `DATABASE.md`, `DATABASE_SCHEMA.sql`, `LEARNING_MODULES.md`, `SIMULATIONS.md`, `ASSESSMENT_ENGINE.md`, `MILESTONES.md`, 4 ADRs. **`PROJECT_SCOPE.md` and `docs/README.md` are 0 bytes** — the prototype never recorded a scope. `.claude/milestones/milestone-01…12.md` are generic placeholder templates. Its own "Milestone 01–07 complete" numbering conflicts with the new Milestone 01 in the owner's brief. |
| Implemented features | Auth (Sanctum, HttpOnly cookie proxies), topic/lesson catalog (5 topics × 3 lessons, plain text), per-lesson progress, admin content studio, quiz bank with server-side scoring and attempt review, learner dashboard, five 2-D calculators (lever, pulley, inclined plane, hydraulic press, torque). |
| Absent | PWA manifest/service worker/offline, 3D, physics engine, IndexedDB, automated frontend tests (no test folder in `frontend/`; `backend/tests` exists, not run), diagnostics/pre-post analytics, teacher dashboards, journals, simulation-run records. |
| Secrets | `.env.local` exists in the repo root. Not read. It must not be copied into the new project or committed. |

### 2.3 The pulley prototype specifically

Files: `frontend/lib/simulation-calculations.ts` (`calculatePulley`), `frontend/components/simulations/simulation-workbench.tsx` (`Pulley`), `simulation-visual.tsx` (`PulleyDiagram`).

| Part | Classification |
|---|---|
| `ropeTravel = liftHeight × segments` | **Real physics** (ideal kinematic constraint; correct). Keep as an analytic invariant. |
| `IMA = supporting segments` | **Real physics** (ideal). Keep, but name it as velocity ratio too. |
| `effort = load / (IMA × efficiency)` with **user-typed `efficiency` (default 85%)** | **Illustrative, and exactly what the brief prohibits [BRF-5].** Efficiency is an *input* that is then used to compute the effort it supposedly results from — circular. Replace with a model whose losses come from physical parameters (movable-block weight, bearing friction, rope friction) and whose efficiency is an *output*. |
| Same pattern in lever (`efficiency` default 100%) and inclined plane (default 80%) | Same defect. Torque and hydraulic press calculators are formula-correct for their ideal cases. |
| `PulleyDiagram` (SVG, CSS transitions 300 ms) | **Illustrative only.** Draws rope segments and a load block from the inputs; no time evolution, mass, tension, or motion. Not a simulation. |
| Hydraulic press | Ideal only (documented as omitting friction/compressibility); loss modeling needed for SRC-G4/G6. |
| Validation, units, error messages, a11y patterns (labelled inputs, `role=alert`, live results) | Good practice; worth carrying over conceptually. |

### 2.4 Reuse recommendation [REC]
Do **not** inherit the Next.js + Laravel code. Reusable as *reference only*: the topic list (Machines, Mechanical Advantage, Efficiency, Rotational Motion, Hydraulics), validation bounds, quiz-attempt snapshot idea, and DB concepts. See decision **D-02**.

## 3. Recommended product shape [REC]/[EXT]

A **Vite + React + TypeScript offline-first PWA** with a deterministic physics core, 3D scenes for each machine, a lesson/quest layer built around the misconception map, a diagnostic/assessment layer producing pre/post data, and an optional teacher/cloud layer. Whether the cloud layer is built at all is a decision (D-03) because the concept note does not require accounts [GAP G-06].

## 4. Decisions requiring owner approval (consolidated)

Details, options, and my recommendations are in `RISKS_AND_ASSUMPTIONS.md` §3.

| ID | Decision |
|---|---|
| D-01 | Confirm the concept note I found is the intended source document. |
| D-02 | New Vite project in `effiquest/` (recommended) vs. continuing the Next.js + Laravel prototype. |
| D-03 | Backend scope: local-only pilot, Supabase sync, or the existing Laravel. |
| D-04 | Is the app a supplement to physical experiments or a replacement for some? |
| D-05 | Scope of machines/scenarios for first release. |
| D-06 | Language(s) of content. |
| D-07 | Curriculum alignment target (competency codes). |
| D-08 | Target devices and connectivity at the pilot school. |
| D-09 | Roles and learner identity scheme (privacy of minors). |
| D-10 | Who authors diagnostic items, videos, rubrics, and validates them. |
| D-11 | Gamification scope (the source only frames a "quest"). |
| D-12 | Physics-engine strategy: analytic core + Rapier for rigid-body visuals only (recommended). |
| D-13 | Content-accuracy review of the "bicycle less efficient uphill" example. |
| D-14 | Target dates (implementation window is ambiguous in the source). |
| D-15 | Research/evaluation data export needs for the Master Teacher I report. |
| D-16 | Ownership, license, hosting and maintenance responsibility. |
| D-17 | Approval of any dependencies beyond the recommended list (e.g., KaTeX, `idb`/Dexie, fast-check, axe). |
