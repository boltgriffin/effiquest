# DECISIONS.md

Owner decisions on the open items from `RISKS_AND_ASSUMPTIONS.md` §3. Recorded 2026-11-22.
Status: **Decided**, **Decided (pending check)** = decided but awaiting a named confirmation, **Open** = still needs an answer.

| ID | Decision | Status |
|---|---|---|
| D-01 | The Desktop concept note (`CUCHARO_GERRY_S_ATTACHMENT-C.-Innovation-Concept-Note-Template.docx`) is the primary source document. | Decided |
| D-02 | Keep the new Vite + React + TypeScript app in `effiquest/`. The old Next.js + Laravel prototype is reference only. | Decided |
| D-03 | Pilot stores learner data **on the device only** (IndexedDB). No cloud backend; no personal data leaves the device. A cloud backend (Supabase) may be considered later. | Decided |
| D-04 | The app **supplements** the hands-on classroom experiments; it does not replace them. | Decided |
| D-05 | First release machines: **inclined plane, lever, pulley, wheel and axle, hydraulic press**. Screw, wedge and compound machines (bicycle, hydraulic brake, lift) come next. | Decided |
| D-06 | **English first**; content structured so Filipino can be added. | Decided |
| D-07 | Tag modules with Grade 11 General Science competency codes **when the owner supplies them**. | Decided (codes not yet supplied) |
| D-08 | Target **low-end Android phones and school PCs with weak internet**: offline-first, low 3D quality available, 2D diagram fallback always present. | Decided |
| D-09 | **No accounts** for the pilot. If a cloud backend is added later: teacher-issued class code + pseudonymous learner code, no real names. | Decided |
| D-10 | The developer **drafts** lesson text and diagnostic items from the concept note's objectives; the **teacher approves or edits** them. Videos come from the teacher. | Decided |
| D-11 | **Quest progress only** (stages marked complete). No points, XP, badges or leaderboards. | Decided |
| D-12 | Efficiency numbers come from the project's own tested physics core (energy ledger); Rapier only animates 3D bodies. | Decided |
| D-13 | Reframe the bicycle-uphill example: "uphill needs more work and power; efficiency tells us how much of the rider's effort reaches the wheels." | Decided (pending check): **subject teacher must confirm** before the lesson is published |
| D-14 | Classroom implementation starts **Monday, March 1, 2027** (owner changed it on 2026-11-23; earlier dates 25 Nov and 7 Dec 2026 withdrawn). 12 weeks, to about May 21, 2027, before breaks. **Check against the school calendar** (see Schedule). | Decided (pending calendar check) |
| D-15 | Teacher export: **CSV** with each learner's baseline and post scores per misconception (G1–G6), completed labs, and the class average change. | Decided |
| D-18 | Pulley lab: **selectable 1-4 supporting rope segments**; **effort is measured at a steady pull**, not set by the learner (2026-11-23). | Decided |
| D-19 | **Optional Supabase backend built (Milestone 11, owner instruction 2026-11-23: "follow what is written in milestone 11").** It is off unless a project is configured; the app stays fully usable device-only. Learner sign-in replaced by D-20 (teacher-issued code + PIN); teachers use email + password created by the administrator; roles are granted on the server only. **Not deployed; no project connected.** Going live still requires the privacy review in DATABASE_PLAN.md section 7 (school/DepEd approval, consent, data location, retention). Supersedes D-03/D-09 only for this optional mode. New dependencies (D-17): `@supabase/supabase-js` (runtime, lazy-loaded) and `@electric-sql/pglite` (tests only). | Decided (privacy review pending before any live use) |
| D-20 | **Learner accounts are teacher-issued: learner code + PIN, no email** (owner chose option C, 2026-11-23). The teacher adds learner codes; a server-side Edge Function creates one account per code with a random 8-character PIN shown once on printable slips; the teacher can issue a new PIN or remove a learner. No anonymous accounts, no self sign-up, no learner emails or names. Teachers keep email + password created by the administrator. | Decided |
| D-16 | Ownership, licence, hosting (static host and/or USB copy) and maintenance: decide before release. | Open (not needed until release) |
| D-17 | Small extra libraries may be added only with the owner's approval, case by case. | Decided |

## Schedule (D-14)

Week numbers follow the concept note's 12-week plan (SRC-T2..T7). Dates assume consecutive school weeks from Monday, March 1, 2027.

| Weeks | Starts | Classroom activity (concept note) | What the app must have by then |
|---|---|---|---|
| 1-2 | Mon Mar 1 | Orientation, baseline diagnostic | Baseline diagnostic (teacher-approved items), learner code entry, results export |
| 3-4 | Mon Mar 15 | Flipped modules: torque, efficiency, hydraulics | Lesson pages (drafted, teacher-approved), videos if supplied |
| 5-6 | Mon Mar 29 | Guided experiments: input/output force, efficiency, energy loss | Working labs: inclined plane, lever, pulley (real physics) |
| 7-8 | Mon Apr 12 | Simple to complex machines | Wheel and axle, hydraulic press |
| 9-10 | Mon Apr 26 | Performance tasks, summative | (Classroom-led) |
| 11-12 | Mon May 10 | Post diagnostic, evaluation, report | Post diagnostic, teacher CSV export |

**Calendar risks to confirm (not verified here):**
- **Holy Week 2027** (Easter Sunday is March 28, 2027) falls at the end of week 4 / start of week 5; if classes pause, later weeks shift.
- The run ends around **May 21, 2027**. If the school year ends earlier (end-of-year break), the post diagnostic (weeks 11-12) would fall outside the school year. Confirm the official school calendar.
- The concept note places the intervention in the "second grading period / second trimester" (SRC-T1); a March start may fall in a different term. The proponent should confirm this is acceptable for the innovation report.

**Development deadlines that follow:**
- Diagnostic items drafted for teacher review: by **Jan 29, 2027**; approved by Feb 12; in-app baseline built and tested by **Feb 24**.
- Lessons published by **Mar 12** (drafts to the teacher by Feb 26).
- Inclined plane, lever and pulley with real physics: by **Mar 24** (before Holy Week).
- Wheel and axle and hydraulic press: by **Apr 9**.
- Post diagnostic and final CSV checks: by **May 7**.

## Consequences for the plan

1. **Device-only data + per-learner CSV (D-03 + D-15).** With no accounts or server, each learner's results live on the device they used. To build the class CSV:
   - each learner enters a **pseudonymous learner code** given by the teacher (no real name) once on their device;
   - the app exports a small results file from each device;
   - the teacher's view imports these files and produces the combined class CSV with averages.
   Shared devices (school PCs) need a "switch learner" option so codes don't mix. This is the planned replacement for the cloud milestone (roadmap M11 becomes "export/import and teacher summary").
2. **First three labs by week 5 (D-14, guided experiments):** inclined plane, lever and pulley, in that order. The baseline diagnostic is needed by week 1. Wheel and axle and hydraulic press follow.
3. **Content drafting (D-10):** drafted lessons and items are marked "Draft - awaiting teacher review" in the app until approved.
4. **Gamification (D-11):** the quest screens keep stage completion only; no scoring UI will be added.
5. **Supabase (D-03, updated by D-19):** installed as an optional, off-by-default backend in Milestone 11. Device-only remains the default and the fallback. See docs/BACKEND_AND_SECURITY.md.
