# SYSTEM_ARCHITECTURE.md

All content is **[REC]** — a proposal. The stack is a recommendation, not a source requirement (BRF-6). Before adopting it, the owner decides D-02 (new Vite project vs. continuing the Next.js + Laravel prototype).

## 1. Why this stack fits (and where it doesn't)

| Choice | Rationale | Caveat |
|---|---|---|
| React + TypeScript + Vite | SPA with static output = trivial offline hosting/USB/LMS distribution (SRC-S6); fast dev; works with the PWA plugin. Next.js SSR/Laravel add servers the concept note doesn't call for. | The prototype's Next.js work is not reused. |
| Tailwind CSS | Consistent responsive UI; already used by the prototype. | |
| Three.js + React Three Fiber + Drei | Declarative 3D in React; instruments/labels (Drei `Html`, `Text`) | Bundle weight → lazy-load per scene; mobile GPU budget. |
| **Rapier** | Rigid-body contact/friction for visuals | Not suitable as the sole source of efficiency numbers (see `PHYSICS_MODEL_PLAN.md` §4). WASM must be precached. |
| Zustand | Small, simple stores; `persist` middleware to IndexedDB | Keep physics state *out* of React state (hot path). |
| GSAP | Camera moves, UI transitions, guided "tour" animations | Never drives physics. Verify current license terms before adoption. |
| Recharts | Force/energy/η charts; supports Sankey for energy-flow | Not for per-frame data (downsample). |
| IndexedDB (via a thin wrapper, e.g. `idb` or Dexie) | Offline records | Wrapper choice is a minor decision. |
| Supabase/PostgreSQL | Managed Postgres + Auth + RLS, if a cloud is approved (D-03) | Only if accounts/teacher views are approved; minors' data → privacy review. |
| Vite PWA plugin (Workbox) | Manifest + service worker + precache | Iterate cache versioning carefully. |
| Vitest + Playwright (+ axe) | Unit/property tests for physics; e2e incl. offline | |

## 2. Layered architecture and dependency rule

```
┌──────────────────────────────────────────────────────────────┐
│ app/            Presentation & navigation (routes, shell, i18n)│
├──────────────────────────────────────────────────────────────┤
│ features/       Vertical slices: lessons, quests, labs,        │
│                 assessment, journal, teacher, auth             │
├───────────────┬───────────────┬──────────────────────────────┤
│ scene/ (3D)   │ content/      │ services/                     │
│ R3F components│ lesson+quest  │ storage (IndexedDB), sync,    │
│ Rapier adapter│ data (JSON)   │ auth client, api client       │
├───────────────┴───────────────┴──────────────────────────────┤
│ edu-calc/       Educational calculations & unit helpers        │
│ physics-core/   Deterministic machine models + energy ledger   │
└──────────────────────────────────────────────────────────────┘
        domain/ — shared types (Quantity, MachineId, Attempt…)
```

**Dependency rules (enforced by lint, e.g. `eslint-plugin-boundaries` / `import/no-restricted-paths`):**
1. `physics-core`, `edu-calc`, `domain` import nothing from React, Three, Rapier, DOM, or `services`. They are pure and Node-testable.
2. `scene` may import `physics-core` and `domain`; never `services`.
3. `features` compose `scene`, `content`, `services`, `physics-core`; features do not import each other (share via `domain`/`services`).
4. `app` imports `features`. Nothing imports `app`.
5. Only `services/storage` touches IndexedDB; only `services/sync` touches the network.

## 3. Concern → module map (BRF-4)

| Required separation | Module(s) |
|---|---|
| Presentation and navigation | `src/app/*`, `src/ui/*` (design system components), router |
| 3D scene rendering | `src/scene/*` (machines, instruments, camera rigs, lighting, quality tiers) |
| Physics simulation | `src/physics-core/*`, `src/scene/rapier/*` (adapter) |
| Educational calculations | `src/edu-calc/*` (work, power, torque, MA/VR, η, Pascal; validators; worked-solution generators) |
| Lesson and quest content | `src/content/*` (versioned JSON/MDX content packs + schema, validated with Zod at build and at load) |
| Assessment and progress | `src/features/assessment/*`, `src/features/progress/*` |
| Authentication and roles | `src/features/auth/*`, `src/services/auth/*` (guest-first; cloud auth optional) |
| Offline storage and sync | `src/services/storage/*`, `src/services/sync/*` |

## 4. Proposed folder structure

```
effiquest/
├─ docs/                      planning documents (this folder)
├─ public/                    icons, manifest assets, model/texture files
├─ src/
│  ├─ app/                    main.tsx, router, AppShell, ErrorBoundary, i18n
│  ├─ ui/                     buttons, inputs, Field(with units), Panel, Tabs
│  ├─ domain/                 types.ts, units.ts (branded types), ids.ts
│  ├─ physics-core/
│  │   ├─ machines/           incline.ts lever.ts pulley.ts wheelAxle.ts
│  │   │                      screw.ts hydraulic.ts bicycle.ts
│  │   ├─ integrator.ts       fixed-step accumulator, RK4/semi-implicit
│  │   ├─ ledger.ts           energy accounting
│  │   └─ index.ts
│  ├─ edu-calc/               work.ts power.ts torque.ts advantage.ts
│  │                          efficiency.ts pascal.ts validate.ts feedback.ts
│  ├─ scene/
│  │   ├─ LabCanvas.tsx       Canvas, quality tiers, context-loss handler
│  │   ├─ machines/           InclineScene.tsx PulleyScene.tsx …
│  │   ├─ instruments/        SpringScale.tsx Ruler.tsx Protractor.tsx
│  │   ├─ rapier/             adapter + kinematic drivers
│  │   └─ fallback2d/         SVG fallback views
│  ├─ content/
│  │   ├─ schema.ts           Zod schemas
│  │   ├─ packs/en/…  packs/fil/…   (if D-06 approves)
│  │   └─ loader.ts
│  ├─ features/
│  │   ├─ lessons/  quests/  labs/  assessment/  journal/
│  │   ├─ progress/ teacher/  auth/  settings/
│  ├─ services/
│  │   ├─ storage/            db.ts (IndexedDB), repositories, migrations
│  │   ├─ sync/               outbox.ts, syncEngine.ts, conflict.ts
│  │   ├─ api/                supabase client (only if D-03)
│  │   └─ telemetry/          local-only, opt-in
│  ├─ stores/                 Zustand: sessionStore, labStore, uiStore
│  └─ test/                   fixtures, setup
├─ e2e/                       Playwright specs
├─ supabase/                  migrations, RLS policies, seed (only if D-03)
├─ vite.config.ts  tailwind.config.ts  tsconfig.json  vitest.config.ts
```

## 5. Reusable modules
- `Quantity` helpers and `Field` input component (value + unit + bounds + validation message).
- `MachineModel<TParams, TState>` interface: `validate(params)`, `step(state, dt)`, `readouts(state)`, `ledger(state)`; every machine implements it, so the same lab UI, chart panel, and test harness work for all machines.
- `LabShell`: layout with 3D viewport, controls panel, measurement table, energy-flow chart, prediction/explanation prompts.
- `ContentPack` loader/validator and `ActivityRunner` (predict → run → record → explain).
- `Repository<T>` over IndexedDB with schema versioning.
- `OutboxSync`: generic append-only sync.

## 6. Data flow

```
 User input → Controls (Zustand labStore: params)
          → physics-core.step(dt) at fixed rate  ─┐
          → (Rapier adapter updates visual bodies)│
          → ledger → readouts selector ───────────┴→ 3D view (R3F useFrame, no React re-render)
                                                   → HUD/Charts (throttled ~10 Hz, React)
 "Record trial" → TrialRecord → services/storage → IndexedDB → (outbox) → sync → Supabase (optional)
 Assessment submit → Attempt → storage → (outbox) → server scoring if graded online / local scoring if offline-pilot
```
- Hot loop state lives in plain mutable objects/refs; Zustand holds *parameters* and *snapshots*, not per-frame state.
- Content flows one way: static packs → loader → features. Learner-created data flows through `storage` only.

## 7. Offline and sync design
- App shell + content packs + Rapier WASM + textures precached by the service worker (`registerType: 'prompt'` so a mid-lesson update never reloads silently).
- All learner records are **append-only events with client-generated UUIDs** (attempts, trials, journal entries, progress events) ⇒ sync is idempotent insert; no merge conflicts. Mutable profile/settings use last-write-wins with `updated_at`.
- Outbox table in IndexedDB; sync on `online`, on app focus, and via Background Sync where supported (iOS lacks it ⇒ foreground retry fallback).
- Guest-mode data can later be "claimed" by an account (local → server upload) with consent.
- Storage quota check on startup; user told before large video packs are downloaded.

## 8. Error handling
| Failure | Handling |
|---|---|
| WebGL unsupported / context lost | `LabCanvas` listens for `webglcontextlost`, shows recoverable overlay; offers 2-D fallback |
| Rapier WASM fails to load | Fall back to analytic-only kinematics (labelled "simplified view"); log locally |
| Invalid physics inputs | Validated at edge; inline message; simulation does not run (no silent clamping) |
| η > 100 % or ledger imbalance | Run marked invalid, shown as "measurement error", never displayed as a result |
| IndexedDB unavailable/quota | In-memory session with warning banner; export-to-file option |
| Sync failure | Retry with exponential backoff; per-record status; never blocks learning |
| Content pack invalid | Zod validation fails → last-known-good pack retained |
| Uncaught React error | Route-level `ErrorBoundary` with "restart activity" and local error log |

## 9. Security and privacy
- Guest mode default; no PII required. If accounts exist (D-03/D-09): teacher-issued class codes, pseudonymous learner IDs, Row-Level Security so a learner reads only their rows, a teacher only their classes, graded answer keys kept server-side (Postgres function / Edge Function scoring).
- No secrets in the repo; `.env*` git-ignored; the prototype's `.env.local` is not imported.
- CSP, no third-party analytics, dependency audit in CI.

## 10. Testing strategy
| Level | Tool | Focus |
|---|---|---|
| Unit | Vitest | `edu-calc`, `physics-core` against the test vectors in `PHYSICS_MODEL_PLAN.md` §3; limit and monotonicity properties (fast-check optional); content-pack schema validation |
| Component | Vitest + Testing Library | `Field` validation, `ActivityRunner`, forms |
| Integration | Vitest (jsdom) | storage repositories (fake-indexeddb), outbox/sync with mocked network |
| Rapier cross-check | Vitest (Node WASM) | Rapier vs analytic within tolerance |
| E2E | Playwright | Install/offline flow (service-worker; airplane-mode context), run a lab, record trial, take diagnostic, reload offline, data persists; mobile viewport project |
| Accessibility | axe via Playwright | non-3D UI, keyboard paths |
| Performance | Playwright trace + manual device test | fps on reference low-end device; bundle-size budget check in CI |
| Content QA | SME checklist | Physics correctness, wording, language |

CI: type-check, lint (with boundary rules), unit, e2e smoke, bundle-size budget, `npm audit`.
