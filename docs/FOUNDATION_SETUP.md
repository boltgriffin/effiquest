# FOUNDATION_SETUP.md

Milestone 02 - Development environment and application foundation.

## 1. Decisions and assumptions applied
The owner did not answer the Milestone 01 decisions before Milestone 02 was issued. The following **recommended options** were applied; each is easy to revisit.

| Decision | Applied | Effect |
|---|---|---|
| D-02 codebase | New Vite + React + TypeScript project in the empty `effiquest/` folder. The workspace contained only `docs/`, so no existing project was replaced. The older Next.js + Laravel prototype was **not touched**. | "Preserve existing working features" is satisfied vacuously for this workspace. |
| D-03 backend | **Local-only.** Supabase is not installed; only commented placeholders exist in `.env.example`. | No accounts or cloud yet. |
| D-12 physics | Rapier and Three are installed; physics code starts in Milestone 03. | No Rapier code or WASM in the bundle yet. |
| D-17 dependencies | `idb` was chosen for IndexedDB. Dexie, KaTeX, zod, fast-check, axe were **not** added. | |

Also: `git init` was run in `effiquest/` (it was not a repository). No commit was made.

## 2. Toolchain
Package manager: **npm** (the only one installed; `pnpm`/`yarn` absent). Node 24.18, npm 11.16.

| Area | Version (installed) |
|---|---|
| React / React DOM | 19.3.1 |
| TypeScript | 6.0.3 (strict) |
| Vite | 8.3.8 + `@vitejs/plugin-react` |
| Tailwind CSS | 4.3.5 via `@tailwindcss/vite` |
| Router | react-router-dom 7.18 |
| 3D | three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7, @react-three/rapier 2.2 |
| State / data | zustand 5.1, idb 8.0, recharts 3.11, gsap 3.15 |
| PWA | vite-plugin-pwa 2.0 |
| Quality | ESLint 10 (flat) + typescript-eslint, Prettier 3.10 |
| Tests | Vitest 5.1 (+ Testing Library, jsdom, fake-indexeddb), Playwright 1.65 |

Installed but **not yet used in code**: `@react-three/rapier`, `gsap`, `recharts` (prepared for Milestones 03-07). The 3D chunk currently contains only the R3F/Drei demo scene.

## 3. Commands
See the table in `CLAUDE.md`. First-time setup:
```
npm install
npx playwright install chromium   # once, for e2e
cp .env.example .env.local         # optional
npm run dev
```

## 4. What was configured
- **TypeScript:** `tsconfig.json` with project references: `tsconfig.app.json` (browser code, strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `@/*` alias) and `tsconfig.node.json` (config files, e2e).
- **Path alias:** `@/` -> `src/` in `tsconfig.app.json`, `vite.config.ts` and `vitest.config.ts`.
- **ESLint:** flat config; `no-explicit-any` and `consistent-type-imports` as errors; React Hooks rules; an architecture boundary rule preventing `types/`, `physics-core/`, `edu-calc/` from importing UI/3D/storage layers.
- **Prettier:** `.prettierrc.json` (single quotes, width 100). `docs/` is excluded.
- **Environment:** `.env.example` documents `VITE_APP_ENV`; Supabase variables are commented out. `src/config/env.ts` is the only reader of `import.meta.env`. `.gitignore` excludes `.env*` except the example. No secrets exist in the repo.
- **Tailwind:** v4 with semantic design tokens in `src/styles/index.css`, light/dark via `prefers-color-scheme`, visible focus ring, reduced-motion support.
- **PWA:** manifest, generated service worker (precache of 16 files), update prompt (`registerType: 'prompt'`), offline-ready notice. Icons in `public/icons` are **generated placeholders** and should be replaced with real artwork.
- **Testing:** Vitest config (jsdom) separate from the Vite config; Playwright runs against the production build in desktop and mobile Chromium projects.

## 5. Application skeleton
- Entry: `src/main.tsx` -> `RouterProvider` (`src/app/router.tsx`).
- Shared layout: `AppShell` (bottom tab bar on phones, top nav from `md`; offline banner; PWA prompt; route-level `ErrorBoundary`).
- Routes: `/` Home, `/lab` (lazy, R3F demo scene with WebGL-loss recovery and no-WebGL fallback), `/learn`, `/diagnostics`, `/progress` (empty states), `/settings` (3D quality preference, online status), `*` not found. Router `errorElement` handles route errors.
- State panels: `LoadingState`, `EmptyState`, `ErrorState`, `NotFoundState`.
- Types (`src/types`): `Profile`/`UserRole`, `Lesson`, `Experiment`, `MachineId`, `MisconceptionId`, `SimReadouts`/`SimTrial`, `Assessment`/`AssessmentItem`/`Attempt`/`AttemptResponse`, `ProgressEvent`, `JournalEntry`. They follow `DATABASE_PLAN.md` and mirror the approved model only.
- Storage: `services/storage/db.ts` defines the versioned IndexedDB schema (settings, attempts, attempt_responses, sim_trials, journal, progress_events, outbox, meta).

## 6. Verification results (2026-11-22)
| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 errors, 0 warnings |
| `npm test` | 3 files, 7 tests pass (storage round-trip, WebGL detection, ErrorBoundary) |
| `npm run build` | pass; shell JS 311.5 kB (98.7 kB gzip); lazy 3D chunk 934.6 kB (247 kB gzip); PWA precache 1.25 MiB |
| `npm run test:e2e` | 10 tests pass (desktop + mobile): home/nav, empty state, not-found, manifest, lab canvas |
| `npm run dev` | starts and serves |

Not verified: installation on a real device, offline behaviour in a real browser session (the e2e suite does not yet cover offline), and frame rate on a low-end device.

## 7. Known exceptions and notes
- `npm audit`: 4 moderate findings in `glob`/`minimatch`, reached only through `workbox-build` (a **build-time** dependency of vite-plugin-pwa). Nothing ships to browsers. `npm audit fix --force` would downgrade vite-plugin-pwa to 1.1.0; not applied. Re-check when workbox updates.
- The 3D chunk (~935 kB) will grow when Rapier is added; the Workbox limit (6 MiB per file) and Vite warning limit were raised deliberately.
- `src/components/PwaUpdatePrompt.tsx` imports `virtual:pwa-register`, which exists only through the Vite plugin, so it is not unit-tested.
- The Home page and placeholder pages contain only structural text; real lesson/diagnostic content depends on owner-supplied material (decision D-10).

## 8. Not done (out of scope for this milestone)
Physics models, machine scenes, lessons, assessments, auth, Supabase, sync, the 2D fallback lab, i18n, and offline e2e tests.
