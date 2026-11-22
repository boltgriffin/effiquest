# FEATURE_REQUIREMENTS.md

Each feature carries its provenance. **Only rows tagged SRC/BRF are requirements.** REC/EXT rows are proposals awaiting approval (decision IDs refer to `RISKS_AND_ASSUMPTIONS.md` §3). Priority uses MoSCoW (M/S/C/W) *relative to the proposed scope*.

## 1. Feature catalogue

### F1 — Misconception-driven learning content
| ID | Feature | Provenance | Pri |
|---|---|---|---|
| F1.1 | Lessons/modules covering torque, mechanical advantage, efficiency, hydraulics, simple→compound machines | SRC-M1, SRC-O1..O4 | M |
| F1.2 | A misconception map: each lesson/activity is tagged to the misconceptions G1–G6 it targets | REC (derived from SRC-G1..G6) | M |
| F1.3 | Predict → Observe → Explain activity pattern (cognitive conflict) | REC (supports SRC-M5) | M |
| F1.4 | Learner journal: reflection after each activity, "what I believed / what I found" | SRC-M6 | S |
| F1.5 | Embedded short video lessons (flipped learning), offline-cacheable | SRC-M1, SRC-S6 | S (videos supplied by owner, D-10) |
| F1.6 | Quest structure (ordered quests with stages) | SRC-06 (framing) + REC (mechanics) | S (D-11) |
| F1.7 | Bilingual content switch | GAP G-03 | C (D-06) |

### F2 — 3D laboratory and simulations
| ID | Feature | Provenance | Pri |
|---|---|---|---|
| F2.1 | Interactive 3D inclined plane (angle, friction coefficient, load) | SRC-O3/O5; SRC-R2 | M |
| F2.2 | Interactive 3D lever (pivot position, arm lengths, pivot friction) | SRC-O3/O5 | M |
| F2.3 | Interactive 3D pulley systems (fixed, movable, block-and-tackle, 1–6 supporting segments) | SRC-O3/O5; PROTO | M |
| F2.4 | Wheel & axle, with torque/rotational analogy (τ = rF sinθ; τ = Iα) | SRC-G1, SRC-O1 | M |
| F2.5 | Hydraulic jack/press (Pascal's principle) with seal friction and leakage | SRC-O4, SRC-G6 | M |
| F2.6 | Screw and wedge | SRC-O3 lists them | S |
| F2.7 | Compound machines: bicycle drivetrain/hill, hydraulic brake, hydraulic lift/excavator arm | SRC-O3, SRC-O4, SRC-O6 | S |
| F2.8 | Agricultural tool scenario | SRC-M3, SRC-E1 name it | C (D-05) |
| F2.9 | "Virtual spring scale / force meter / ruler / protractor" measuring instruments with realistic reading resolution | REC (mirrors SRC-R2) | M |
| F2.10 | Energy-flow display (input work → useful work + heat/friction + leakage) | REC (directly counters SRC-G4) | M |
| F2.11 | Efficiency is always *computed* from measured/simulated W_out ÷ W_in; no efficiency slider drives a simulation | BRF-5 | M |
| F2.12 | Side-by-side "ideal vs real" machine comparison | SRC-G4 + REC | M |
| F2.13 | Trial recorder: save measurements to a data table, plot with charts, export | SRC-O5 + REC | M |
| F2.14 | 2-D fallback rendering when WebGL is unavailable or device is weak | REC | S |

### F3 — Educational calculations (separate from rendering)
| ID | Feature | Provenance | Pri |
|---|---|---|---|
| F3.1 | Work W = Fd cosθ; Power P = W/t | BRF (equations list), SRC-O5 | M |
| F3.2 | Torque τ = rF sinθ; angular analogues (τ = Iα, W = τθ, P = τω) | SRC-O1, SRC-G1 | M |
| F3.3 | Actual MA = F_out/F_in; Ideal MA / Velocity ratio = d_in/d_out | BRF, SRC-O2 | M |
| F3.4 | Efficiency η = (W_out / W_in) × 100% with consistency checks (reject η > 100%) | BRF-5, SRC-O5 | M |
| F3.5 | Pascal's principle: P = F/A, F₂/F₁ = A₂/A₁ | SRC-O4 | M |
| F3.6 | Worked-solution and unit-checking feedback for learner-entered answers | REC | S |
| F3.7 | Relationship display η = AMA ÷ IMA | REC (clarifies SRC-G2) | M |

### F4 — Assessment and progress
| ID | Feature | Provenance | Pri |
|---|---|---|---|
| F4.1 | Baseline (pre) and post diagnostic tests, same blueprint | SRC-N1, SRC-T2, SRC-T7 | M |
| F4.2 | Misconception-tagged distractors so wrong answers reveal *which* misconception | REC | M |
| F4.3 | Weekly quizzes / formative checks | SRC-N2 | S |
| F4.4 | Performance-task submission (e.g., "analyze this bicycle/hydraulic lift") with rubric | SRC-M3, SRC-R1 | S |
| F4.5 | Per-learner progress (lessons, quests, activities, mastery per misconception) | REC | M |
| F4.6 | Pre/post comparison per learner and per class | SRC-E1 (assessment data) | M |
| F4.7 | Export of class results (CSV) for the Master Teacher I report | SRC-T7 + D-15 | S |
| F4.8 | Answer keys never shipped to the client for graded assessments | REC (security) | M if cloud |

### F5 — Users and roles
| ID | Feature | Provenance | Pri |
|---|---|---|---|
| F5.1 | Use the app with no account (guest mode, local data only) | REC (supports SRC-S6, low connectivity) | M |
| F5.2 | Learner accounts, class enrollment via teacher-issued code | GAP G-06 → EXT (D-09) | S |
| F5.3 | Teacher role: view class progress, diagnostics, journals | SRC-05 (teachers benefit) + EXT | S |
| F5.4 | Admin/content-author role | EXT (G-12) | C |
| F5.5 | Privacy: minimal personal data on minors | REC (G-10) | M if accounts |

### F6 — PWA, offline, distribution
| ID | Feature | Provenance | Pri |
|---|---|---|---|
| F6.1 | Installable PWA (manifest, icons, service worker) | BRF-2 | M |
| F6.2 | Full offline use of lessons, simulations, quizzes after first load | SRC-S6 + BRF-2 | M |
| F6.3 | Local storage of progress/attempts in IndexedDB | BRF (IndexedDB listed as recommendation) | M |
| F6.4 | Background sync of local records when online | REC | S (only if D-03 ≠ local-only) |
| F6.5 | Distribution via USB / school LMS / static hosting (no server needed to *run*) | SRC-S6 | S |
| F6.6 | Versioned content packs (update lessons without code release) | REC (supports SRC-S2, S7) | S |

### F7 — Non-functional requirements [REC]
| ID | Requirement |
|---|---|
| N1 | Runs on a low-end Android phone/tablet and school PCs (exact floor decided in D-08). Target ≥ 30 fps on the reference low-end device; a quality tier switch exists. |
| N2 | Initial JS budget ≤ ~300 KB gzip for the shell; 3D/physics lazy-loaded per scene; Rapier WASM cached by the service worker. |
| N3 | WCAG 2.2 AA; full keyboard operation of all non-3D controls; every 3D readout also available as text. |
| N4 | Physics results deterministic for the same inputs (same seed/time-step). |
| N5 | All physical quantities carry units; unit tests assert SI consistency. |
| N6 | No learner PII in logs or analytics; no third-party trackers. |
| N7 | Graceful failure: WebGL loss, WASM load failure, storage quota, sync failure all produce a recoverable UI state. |

## 2. Out of scope unless approved
Leaderboards, chat/social, public sharing, AR/VR, payments, native app-store builds, AI tutoring, multi-school tenancy, content-authoring WYSIWYG. None appears in the concept note.

## 3. Traceability summary
Every specific objective SRC-O1…O6 maps to at least one feature: O1→F2.4/F3.2; O2→F2.10–F2.12/F3.3–F3.7; O3→F2.1–F2.7; O4→F2.5/F3.5/F2.7; O5→F2.9/F2.13/F3.4; O6→F2.7/F4.4. SRC-M3's collaborative projects and the physical experiments of SRC-M2 happen **outside** the software; the plan does not assume the app replaces them (D-04).
