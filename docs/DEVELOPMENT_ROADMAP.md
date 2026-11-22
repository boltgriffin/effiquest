# DEVELOPMENT_ROADMAP.md

**[REC]**. Proposed milestone sequence after Milestone 01. Durations are relative effort, **not** commitments: team size, hours, and target date are unknown (D-14). The concept note's 12-week classroom schedule (SRC-T1..T7) is the *deadline driver*: the diagnostic and first labs must exist before learners reach weeks 1–2 / 5–6 of their implementation window, whose dates are not given (G-04).

## 0. Gate
**Milestone 02 cannot start until the owner reviews these documents and answers the blocking decisions** (D-01, D-02, D-03 at least in direction, D-05, D-08).

## 1. Priority order and rationale
1. Correct, tested physics + energy ledger (the product's credibility; BRF-5).
2. Offline-capable shell with local storage (SRC-S6).
3. First three labs that attack the biggest misconceptions: incline (η vs MA), pulley (more segments ≠ better), lever (SRC-G2/G4).
4. Diagnostics (SRC-N1/T2/T7) — the evidence the Master Teacher I report needs.
5. Remaining machines and compound scenarios.
6. Accounts/teacher/cloud, only if approved.

## 2. Milestones

| # | Milestone | Main deliverables | Exit criteria | Pri |
|---|---|---|---|---|
| **02** | **Project foundation** | Vite+React+TS+Tailwind scaffold in `effiquest/`; folder structure; lint boundary rules; Vitest + Playwright wired; PWA shell (manifest, SW, offline page); CI; design tokens; `docs/` ADRs for approved decisions | Builds, installs, loads offline; tests run in CI; no feature code | M |
| **03** | **Physics core + edu-calc** | `physics-core` (incline, lever, pulley, hydraulic first), energy ledger, `edu-calc`; branded units; test vectors from `PHYSICS_MODEL_PLAN.md` | All analytic, limit, conservation, monotonicity tests pass; **SME sign-off** on equations/parameters | M |
| **04** | **Storage + content engine** | IndexedDB repositories + migrations; content-pack schema/loader; `ActivityRunner`; guest mode; export | Records persist offline across reloads; invalid pack rejected; migration test | M |
| **05** | **3D lab foundation + Incline & Lever** | `LabCanvas` (quality tiers, context-loss), instruments, Rapier adapter, `LabShell` (predict/measure/calculate/explain), energy-flow chart, trial recorder | Lab runs ≥ 30 fps on reference device; η from ledger; Rapier ≈ analytic within tolerance; keyboard + text alternatives | M |
| **06** | **Pulley & Wheel-and-axle labs** | Block-and-tackle with real losses; torque/rotation analogy lab | Misconception G2 scenario ("more segments, lower η") reproducible and tested | M |
| **07** | **Hydraulics lab** | Jack/press with seal friction and leakage | Pascal ideal + real vs ideal comparison; tests | M |
| **08** | **Assessment & journal** | Baseline/post diagnostics, weekly checks, misconception tagging, scoring, journal, progress view | Pre/post comparison per learner; items map to G1–G6; accessibility pass | M |
| **09** | **Compound machines & remaining simple machines** | Bicycle (hill), hydraulic brake, lift/arm; screw & wedge | SME-approved content (D-13) | S |
| **10** | **Lessons, quests, video packs** | Content authoring pipeline, offline video handling, quests (scope per D-11), bilingual switch (if D-06) | Content pack versioning + update flow tested | S |
| **11** | **Accounts, teacher view, sync** *(only if D-03 ≠ local-only)* | Supabase schema + RLS, auth, class codes, outbox sync, teacher dashboard, CSV export | RLS tests; sync idempotency tests; privacy checklist signed (G-10) | S/C |
| **12** | **Hardening & performance** | Bundle/perf budgets, low-end device tuning, a11y audit, e2e suite complete, error-state review | Meets N1–N7; zero critical a11y issues | M |
| **13** | **Pilot / UAT** | Classroom trial with teacher; feedback; fixes; teacher guide | Learners complete diagnostics + ≥ 3 labs offline; issues triaged | M |
| **14** | **Release & handover** | Deployment (static host / USB bundle), docs, maintenance guide | Release checklist done; owner acceptance | M |

If D-03 is **local-only**, Milestone 11 is replaced by a small "export/import & teacher summary tool" and the schedule shortens.

## 3. Suggested parallel tracks (non-code)
- **Content/SME track (owner/teacher):** diagnostic item bank with misconception-tagged distractors; lesson scripts; videos; rubrics; parameter-source citations. This is the long pole and is *not* something the developer can invent (SRC-R1, G-13).
- **Research track:** decide pre/post analysis and export format (D-15).
- **Privacy/approvals track:** if cloud, begin early (G-10).

## 4. Definition of Done (every milestone)
Type-check + lint clean; tests added and passing; docs updated; accessibility checked for new UI; no unsupported claims (each feature traced to SRC/BRF or marked REC/EXT); demo against acceptance criteria; owner review before the next milestone starts.

## 5. Estimated sizing (very rough, one experienced developer, full-time)
M02 ≈ 1 wk · M03 ≈ 2 wk · M04 ≈ 1.5 wk · M05 ≈ 3 wk · M06 ≈ 2 wk · M07 ≈ 1.5 wk · M08 ≈ 2 wk · M09 ≈ 3 wk · M10 ≈ 2 wk · M11 ≈ 3 wk · M12 ≈ 2 wk · M13 ≈ 2 wk · M14 ≈ 1 wk. Total ≈ 26 weeks (≈ 20 without M11). *Assumption-only estimate; to be revised after D-05/D-08.* A minimum viable pilot (M02–M08 + M13) is ≈ 14 weeks.
