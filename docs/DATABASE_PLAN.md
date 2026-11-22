# DATABASE_PLAN.md

**[REC]** design. The concept note defines *what must be measured* (baseline/post diagnostics, weekly quizzes, reflections, journals, activity outputs — SRC-N1..N4) but **no data model, accounts, or backend** (GAP G-06, G-10, G-11). The cloud layer is therefore conditional on decision D-03. The **local IndexedDB layer is needed regardless** (offline, SRC-S6).

## 1. Storage tiers

| Tier | Holds | When |
|---|---|---|
| Static content packs (JSON in the build) | Lessons, quests, activity configs, item bank *without keys for graded cloud mode* | Always |
| IndexedDB (local) | Learner records, outbox, settings, cached packs | Always (guest mode works with only this) |
| Supabase/PostgreSQL (cloud) | Accounts, classes, synced records, teacher views, graded scoring | Only if D-03 approves |

Local-only pilot fallback: teacher collects results by **export file** (CSV/JSON) from each device — no server, no PII leaving devices. Satisfies SRC-T7 documentation needs at lower privacy risk.

## 2. Logical model (ER overview)

```mermaid
erDiagram
  PROFILE ||--o{ USER_ROLE : has
  PROFILE ||--o{ ENROLLMENT : joins
  CLASS ||--o{ ENROLLMENT : has
  CLASS }o--|| PROFILE : "owned by teacher"
  CONTENT_PACK ||--o{ LESSON : contains
  CONTENT_PACK ||--o{ ACTIVITY : contains
  CONTENT_PACK ||--o{ ASSESSMENT : contains
  MISCONCEPTION ||--o{ ITEM_OPTION : "tagged by"
  ASSESSMENT ||--o{ ITEM : has
  ITEM ||--o{ ITEM_OPTION : has
  PROFILE ||--o{ ATTEMPT : makes
  ASSESSMENT ||--o{ ATTEMPT : "taken as"
  ATTEMPT ||--o{ ATTEMPT_RESPONSE : has
  PROFILE ||--o{ SIM_TRIAL : records
  ACTIVITY ||--o{ SIM_TRIAL : "run in"
  PROFILE ||--o{ JOURNAL_ENTRY : writes
  PROFILE ||--o{ PROGRESS_EVENT : emits
  PROFILE ||--o{ TASK_SUBMISSION : submits
```

## 3. Tables (PostgreSQL; local IndexedDB mirrors the learner-owned ones)

Conventions: `id uuid` generated **on the client** (idempotent sync); `created_at timestamptz`; `updated_at` on mutable rows; `deleted_at` soft delete only where noted; all learner-owned tables carry `owner_id`.

### 3.1 Identity and roles *(cloud only)*
| Table | Key columns | Notes |
|---|---|---|
| `profiles` | id (= auth uid), display_name, learner_code (pseudonym), grade_level, locale, created_at | **No real name/email required for learners** (D-09). Teacher email via auth provider only. |
| `user_roles` | profile_id, role (`learner`,`teacher`,`admin`) | Roles are data, enforced by RLS — not by UI. |
| `classes` | id, teacher_id → profiles, name, school_year, join_code, archived_at | |
| `enrollments` | class_id, learner_id, joined_at | PK(class_id, learner_id). |

### 3.2 Content *(shipped as versioned packs; optionally mirrored in Postgres for authoring)*
| Table | Key columns |
|---|---|
| `content_packs` | id, version (semver), locale, published_at, checksum |
| `lessons` | id, pack_id, slug, title, body (MDX/Markdown), video_ref, order, misconception_ids[], duration_min |
| `activities` | id, pack_id, machine (`incline`,`lever`,`pulley`,`wheel_axle`,`screw`,`wedge`,`hydraulic`,`bicycle`,`brake`), config jsonb (parameter bounds/presets), predict_prompt, explain_prompt, order |
| `quests` | id, pack_id, title, stage_order, activity_ids[], unlock_rule jsonb *(only if D-11)* |
| `misconceptions` | id (`G1`..`G6`), statement, source_ref (`SRC-G1`..) |
| `assessments` | id, pack_id, kind (`baseline`,`weekly`,`post`,`performance_task`), blueprint jsonb |
| `items` | id, assessment_id, stem, type (`mcq`,`numeric`,`short`), unit, tolerance, difficulty, order |
| `item_options` | id, item_id, label, is_correct *(server-only in graded mode)*, misconception_id nullable |

### 3.3 Learner records *(append-only; local + synced)*
| Table | Key columns |
|---|---|
| `attempts` | id, owner_id, assessment_id, pack_version, started_at, submitted_at, score, max_score, mode (`local`,`server_graded`) |
| `attempt_responses` | id, attempt_id, item_id, response jsonb, is_correct, misconception_id nullable, answered_at |
| `sim_trials` | id, owner_id, activity_id, params jsonb, readouts jsonb (F_in, F_out, d_in, d_out, W_in, W_out, η, AMA, IMA), engine_version, seed, valid bool, recorded_at |
| `journal_entries` | id, owner_id, activity_id, belief_before, finding_after, misconception_id, created_at |
| `progress_events` | id, owner_id, kind (`lesson_completed`,`activity_completed`,`quest_stage`,`assessment_submitted`), ref_id, created_at |
| `task_submissions` | id, owner_id, assessment_id, payload jsonb, rubric_scores jsonb, reviewed_by, reviewed_at |

Derived (view/materialized, not stored by client): `v_pre_post` (per learner: baseline vs post score, per misconception), `v_class_summary`, `v_misconception_mastery`.

### 3.4 Operations
| Table | Notes |
|---|---|
| `sync_log` | owner_id, device_id, batch_id, received_at, record_count — idempotency/audit |
| `audit_log` | actor_id, action, target, at — teacher/admin actions only |

## 4. Local IndexedDB stores
`settings`, `packs` (cached pack + version), `attempts`, `attempt_responses`, `sim_trials`, `journal`, `progress_events`, `submissions`, `outbox` (id, table, payload, state, tries, last_error), `meta` (schema_version, device_id). Schema versioned with explicit upgrade functions; every upgrade has a test with fixtures from the previous version.

## 5. Sync rules
1. Records are immutable once written (except profile/settings) ⇒ upsert by `id` is idempotent.
2. Client sends batches from `outbox`; server validates, `INSERT … ON CONFLICT DO NOTHING`, returns accepted ids.
3. Server re-validates `sim_trials` plausibility (η ≤ 100 %, units) but trusts them as *learner activity*, never as grades. **Only the server (or the local scorer in local-only mode) scores assessments.**
4. Pack version is stored on every attempt so that later content edits never rewrite history.

## 6. Row-Level Security (cloud)
- Learner: `SELECT/INSERT` own rows (`owner_id = auth.uid()`); no `UPDATE/DELETE` on append-only tables.
- Teacher: `SELECT` rows where owner is enrolled in a class they own; no cross-class access.
- Admin: content tables write; learner data read-only with audit logging.
- `item_options.is_correct` unreadable by learners; scoring in a `SECURITY DEFINER` function / Edge Function.

## 7. Privacy and retention (open: G-10)
Data are about minors in a DepEd context. Before any cloud use: confirm DepEd/school data-privacy approval, parental-consent practice, data-processing location, retention period, and deletion procedure. Collect the minimum: pseudonymous code, grade, scores, trial data. No device fingerprinting, no third-party analytics. This is a **blocker for D-03 = cloud**, not for local-only.

## 8. Comparison with the prototype's schema
The prototype (`Laravel` migrations: users, roles, topics, lessons, quizzes, questions, quiz_attempts, quiz_attempt_answers, progress, simulations, reports) already separates quizzes from attempts and snapshots answers. Its model has **no** misconception tagging, sim trials, journals, class/enrollment, pack versioning, or sync fields. Concepts carry over; the SQL does not.
