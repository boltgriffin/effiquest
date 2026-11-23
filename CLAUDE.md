# CLAUDE.md - EffiQuest 3D

Grade 11 General Science PWA: an interactive machine and efficiency laboratory. It addresses misconceptions (mechanical advantage vs efficiency, "perfect machine", translational to rotational transfer, hydraulics transfer). The source of truth for scope is `docs/` (Milestone 01), especially `SOURCE_REQUIREMENTS.md`.

## Commands (npm is the package manager; keep `package-lock.json`)

| Command                           | Purpose                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`                     | Vite dev server (service worker is not active in dev)                                 |
| `npm run build`                   | `tsc -b` then production build (also generates the service worker)                    |
| `npm run preview`                 | Serve the production build locally                                                    |
| `npm run typecheck`               | Strict TypeScript project check                                                       |
| `npm run lint`                    | ESLint (flat config)                                                                  |
| `npm run format` / `format:check` | Prettier                                                                              |
| `npm test` / `test:watch`         | Vitest (jsdom)                                                                        |
| `npm run test:e2e`                | Playwright against `build` + `preview` (needs `npx playwright install chromium` once) |

Before declaring work done: `typecheck`, `lint`, `test`, `build` must pass.

## Architecture (see docs/SYSTEM_ARCHITECTURE.md)

```
src/
  app/          router, AppShell (layout, nav). Nothing imports app/.
  pages/        route-level screens; compose features and components
  features/     vertical slices: lab/ (shared/ template + machines/ definitions; see docs/SIMPLE_MACHINES_LABS.md), assessment/, progress/, teacher/; features do not import each other
  components/   shared UI: ui/ (design-system components), icons/, StatePanels, ErrorBoundary, EquationCard
  content/      module, quest and misconception data (source-traced; no invented lesson text) +
                progress.ts (pure derivation of completion from the progress event log)
  edu-calc/     learner-facing calculations with structured, explained results (docs/PHYSICS_CALCULATIONS.md). Pure.
  physics-core/ deterministic machine models (incline, lever, pulley, wheel & axle) + energy ledger + shared run shape. Pure.
  scene/        R3F scenes (incline, pulley, lever, wheel & axle) + SceneLabel; read motion refs, never compute physics
  hooks/ store/ shared hooks; Zustand stores (view preferences only)
  services/     storage/ (IndexedDB via idb). Only place that touches IndexedDB.
  config/       env.ts is the only reader of import.meta.env
  types/        domain types (users, content, simulation, assessment, progress). Pure.
  utils/ styles/ test/
```

Planned for later milestones (create only when there is real code): a Rapier adapter under `src/scene/` (only for scenes that need contact), `services/sync` (outbox, only if a cloud backend is approved). Physics status and deviations: `docs/PHYSICS_IMPLEMENTATION.md`.

## Design system (docs/DESIGN_SYSTEM.md, live at `/design`)

- Reuse `components/ui` (Button, TextField, Select, Slider, Switch, SegmentedControl, Tabs, Dialog, Tooltip, ProgressBar, StepIndicator, Badge/SampleBadge, Callout, Panel/PageHeader, Readout) before adding UI. New components also go on `/design`.
- Colors only via tokens (`bg-surface`, `text-muted`, `border-rule`, `border-rule-strong`, `bg-brand`...). Physics roles are fixed: `input` (effort) blue, `output` (load/useful) amber, `loss` crimson with hatch/dash. New colors need a contrast check.
- Icons only from `components/icons/glyphs.tsx` (24 px, 1.75 stroke). No other icon library.
- Serif (`font-display`) for titles, `.num` for every measured value, eyebrow labels via `eyebrowClass`.
- Page grids start with `grid-cols-1` so content can never cause horizontal scroll.
- No dead controls: unbuilt actions are disabled with a visible reason; sample/placeholder data always carries a `SampleBadge` or an empty state.

Dependency rules (partly enforced by ESLint `no-restricted-imports`):

1. `types/`, `physics-core/`, `edu-calc/` are pure: no React, Three, router, store, services or components.
2. 3D code is lazy-loaded (`React.lazy`) so the shell stays small.
3. Per-frame physics state never lives in React state or Zustand; Zustand holds parameters and snapshots.
4. Only `services/storage` touches IndexedDB; learner records are append-only with client-generated UUIDs.

## Coding standards

- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`). No `any` (lint error); if truly unavoidable, add a comment explaining why.
- Use `import type` for types. Path alias `@/` maps to `src/`.
- Functional components, focused and small; logic that is not UI goes in hooks/services/pure modules.
- Tailwind v4 utilities with the semantic tokens in `src/styles/index.css` (`bg-bg`, `bg-surface`, `text-ink`, `text-muted`, `border-rule`, `bg-brand`...). Do not hard-code colors; dark mode comes from the tokens.
- Responsive from the start (mobile-first, tap targets >= 44 px / `min-h-11`), honor `prefers-reduced-motion`, label every input, announce results with live regions.
- Every page needs loading, empty, error and not-found handling (`components/StatePanels.tsx`, `ErrorBoundary`).
- Environment: read variables only through `src/config/env.ts`; only `VITE_*` variables reach the browser, so **never** put secrets in them. Never commit `.env*` (except `.env.example`).
- Add dependencies only when the approved architecture needs them, and mention new ones to the owner (decision D-17).

## Physics rules (docs/PHYSICS_MODEL_PLAN.md)

- **Efficiency is an output, never an input.** eta = W_out / W_in x 100, from computed work. No "efficiency %" or "friction %" slider may drive a simulation. Losses come from named physical parameters (friction coefficient, block weight, seal friction, leakage...).
- SI units internally; units shown wherever a quantity appears. Reject invalid input with a message; do not clamp silently. Flag eta > 100 % as a measurement error.
- Rapier is for rigid-body visuals only; the energy ledger in `physics-core` is the source of efficiency numbers.

## Working rules

- Provenance: every feature traces to the concept note (SRC), the owner's brief (BRF), or is marked as a recommendation (REC) / extension needing approval (EXT).
- Milestone discipline: complete one milestone, report, and wait for owner approval before the next.
- Do not create empty abstractions or folders just to fill a structure.
- The older Next.js + Laravel prototype in `Desktop\JAVA JDBC CRUD\EffiQuest` is reference only. Do not copy its `.env.local`.
- New labs: add a `MachineDefinition` in `features/lab/machines/` (own physics module, diagram, 3D view, guide content) and a case in `pages/MachineLabPage.tsx`; do not fork the template.
- Navigation config lives in `src/app/navigation.ts` (one list for sidebar, rail, tabs, menu). Learner identity = pseudonymous learner code in `store/learnerStore.ts`; teacher mode is a display switch, not security. See `docs/NAVIGATION_AND_DASHBOARDS.md`.
- Owner decisions are recorded in `docs/DECISIONS.md` (device-only data, no accounts, quest progress only, first machines: incline, lever, pulley, wheel and axle, hydraulic press). Follow them; state any other assumption you rely on.
