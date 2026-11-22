# RISKS_AND_ASSUMPTIONS.md

## 1. Assumptions (unverified — correct me if wrong)
| ID | Assumption | If wrong |
|---|---|---|
| A-01 | The Innovation Concept Note found on the Desktop is the intended source document. | Re-plan against the right document. |
| A-02 | The new project is built in `effiquest/` (currently empty) and the older Next.js + Laravel prototype is a reference, not the base. | Plan changes to extend the prototype; roadmap M02 rewritten. |
| A-03 | The app *supplements* physical experiments and flipped lessons (SRC-M1/M2/R2); it does not replace them. | Fidelity requirements and assessment design rise. |
| A-04 | Learners may have intermittent internet; some devices are low-end. | 3D budget could be relaxed; offline could be dropped. |
| A-05 | English is the primary content language. | i18n and content-authoring effort increase. |
| A-06 | A teacher/SME will review physics content and supply diagnostic items and videos. | Developer would have to author pedagogy content — not advisable. |
| A-07 | Pilot is a single school; no multi-tenant needs. | Tenancy design needed. |
| A-08 | Equations in `PHYSICS_MODEL_PLAN.md` are standard introductory-physics; no source supplies them. | SME corrections. |
| A-09 | I inspected the prototype statically; nothing was built, installed, or run. | Its technical condition may differ from what I inferred. |

## 2. Risks
| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R-01 | **Scope drift**: the owner's brief (PWA, 3D, Rapier, cloud) is much larger than the concept note (a classroom method). Features could be built that no source supports. | H | H | Tag every feature SRC/BRF/REC/EXT; owner approves EXT items; MVP defined by D-05. |
| R-02 | Physics credibility: efficiency numbers contaminated by solver energy errors or arbitrary friction parameters. | M | H | Analytic core + ledger; conservation tests; Rapier cross-checks; SME sign-off. |
| R-03 | Rapier unsuited to ropes/hydraulics; time lost forcing it. | M | M | Hybrid design (§4 of physics plan); Rapier optional per machine. |
| R-04 | Low-end devices cannot run 3D at usable frame rate; WASM size on slow networks. | M | H | Quality tiers, 2-D fallback, lazy loading, precache, early real-device testing (D-08). |
| R-05 | Minors' data / DepEd privacy compliance if a cloud is used. | M | H | Guest-first, pseudonymous IDs, local export, privacy review before any cloud (G-10). |
| R-06 | Content bottleneck: diagnostics, videos, rubrics not available (G-13). | H | H | Content track starts now; placeholder content clearly marked; item-writing template with misconception tags. |
| R-07 | Content error in the bicycle-uphill example propagates misconception (SRC-G5). | M | M | D-13 SME review before writing that lesson. |
| R-08 | Ambiguous implementation window (G-04); app unfinished when classes begin. | M | H | Confirm dates (D-14); prioritize MVP (M02–M08); local-only fallback. |
| R-09 | Inheriting the prototype's split-brain setup (root Supabase skeleton vs `frontend/`+Laravel) creates rework. | M | M | D-02 decision; start clean. |
| R-10 | PWA caching/update bugs strand learners on stale versions mid-quarter. | M | M | Prompt-to-update SW, versioned packs, e2e offline/update tests. |
| R-11 | Accessibility gaps for 3D content. | M | M | Text equivalents, 2-D fallback, a11y tests, documented limitation. |
| R-12 | Dependency/licensing surprises (e.g., GSAP terms, video hosting, 3D assets). | L | M | License review at M02; prefer procedurally generated meshes. |
| R-13 | Evaluation expectations unmet because no success indicators exist in the source (G-07). | M | M | D-15: agree pre/post metrics before building analytics. |
| R-14 | Secret leakage: prototype `.env.local` copied or committed. | L | H | New repo, `.gitignore`, secret scanning; rotate keys if that file was ever shared. |

## 3. Decisions requiring owner approval

> **Update 2026-11-22:** the owner has answered these. See `DECISIONS.md` for the decided values; D-14 (start date) and D-16 (ownership/hosting) remain open, and D-13 awaits the subject teacher's confirmation.

Legend: **B** = blocks Milestone 02. My recommendation is first.

| ID | Decision | Options | Recommendation | B |
|---|---|---|---|---|
| D-01 | Is the Desktop concept note the intended source? | Yes / different file | Please confirm | ✔ |
| D-02 | Codebase base | (a) New Vite project in `effiquest/` (b) Continue Next.js + Laravel prototype (c) Port selected prototype parts | **(a)**, port ideas only | ✔ |
| D-03 | Backend scope | (a) Local-only pilot + export (b) Supabase sync (c) Existing Laravel | **(a) first**, design for (b) later; (b) requires privacy approval | ✔ |
| D-04 | Role of the app vs physical lab | Supplement / partial replacement | Supplement | |
| D-05 | MVP machine set | Incline+Lever+Pulley+Hydraulic (+Wheel&axle) vs all six simple machines + compounds | Incline, Lever, Pulley, Wheel&axle, Hydraulic for MVP; compounds next | ✔ |
| D-06 | Content language(s) | English / Filipino / both | English first; structure for both | |
| D-07 | Curriculum alignment | Provide competency codes/learning standards | Provide codes so content maps to them | |
| D-08 | Target devices & connectivity | Specify min device, OS, browser, offline expectations | Provide a real device list | ✔ |
| D-09 | Roles & learner identity | Guest-only / class code + pseudonym / school email | Guest + class-code pseudonyms | |
| D-10 | Who writes/validates diagnostic items, videos, rubrics | Teacher/SME vs developer drafts reviewed by SME | Teacher/SME authors, developer builds tooling | |
| D-11 | Gamification scope | None / light quest progress / XP & badges | Light quest progress only | |
| D-12 | Physics-engine strategy | Analytic core + Rapier for visuals / Rapier only | Hybrid | |
| D-13 | Bicycle-uphill example wording (SRC-G5) | Keep as written / reframe (power & gravitational work) | SME decides; see `PHYSICS_MODEL_PLAN.md` §3.7 | |
| D-14 | Target dates | Provide pilot start | Needed for scheduling | |
| D-15 | Evaluation/export needs | Fields and formats for the Master Teacher I report | Pre/post per-misconception CSV | |
| D-16 | Ownership, licensing, hosting, maintenance | | Decide before M14 | |
| D-17 | Any new dependencies beyond the list (e.g., KaTeX, `idb`/Dexie, fast-check, axe) | Approve at M02 | Approve | |

## 4. Open questions for the owner (information gaps)
1. How many learners/sections, and what devices do they actually have at school and at home? (G-02)
2. Are the flipped-learning videos already made? Are the diagnostic tests and rubrics already written? (G-13)
3. Which MELC / General Science competencies must each lab map to? (G-05)
4. Does the Master Teacher I report need specific statistics from the app? (G-07)
5. Is there a school/district policy on learner accounts, cloud tools, or data collection from minors? (G-10)
6. Who maintains the app after release? (G-11)
7. "Second trimester" vs "second grading period" in the concept note — which applies, and what are the dates? (G-04)
8. Is the prototype's earlier "Milestone 01–07 complete" history important to preserve, or should numbering restart at this Milestone 01?

## 5. Items I did not do (to be explicit)
- No application code, scaffold, or dependency installation.
- No build/run/test of the old prototype.
- Did not read the prototype's `.env.local`.
- No modifications to any file outside `effiquest/docs/`.
