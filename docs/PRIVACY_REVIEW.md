# PRIVACY_REVIEW.md

**Purpose:** information for the school head and the school's Data Protection Officer (DPO), so they can decide whether EffiQuest's **optional online class** may be used with real learners.

**Status:** prepared by the developer for review. **Not legal advice.** The school and DepEd decide.

> **Until this review is approved:**
> - the online class is used with **test data only** (made-up learner codes);
> - the classroom pilot collects results with **files** (device-only mode), which sends nothing to any server.

The applicable law is the **Data Privacy Act of 2012 (Republic Act No. 10173)**, with the rules and advisories of the **National Privacy Commission (NPC)**. The learners are minors.

## 1. Two ways to use EffiQuest

| | Device-only (default) | Online class (optional) |
|---|---|---|
| Where learner work is stored | only in the browser of the device used | the device, **plus** a Supabase database (cloud) |
| How the teacher gets results | the learner downloads a results file; the teacher imports it | the teacher loads results in the app after signing in |
| Accounts | none | teacher: email + password; learner: code + PIN from the teacher |
| Needs this review | not for the app (the files are still personal data: handle them carefully) | **yes, before use with real learners** |

## 2. What personal data the online class holds (data inventory)

| Data | Example | Whose | Why it is needed |
|---|---|---|---|
| Learner code (pseudonym chosen by the teacher) | `G11A-07` | learner | to tell learners apart without names |
| Class name, school year | "G11 STEM A", 2026-2027 | teacher | to group learners |
| Assessment answers and scores | answers to the 13 diagnostic and 12 practice questions; points per idea | learner | baseline vs post comparison (concept note SRC-N1, SRC-T7) |
| Progress records | "lesson opened", "lab completed", "quest stage done", with date and time | learner | progress indicators for the teacher |
| Teacher email and password | stored by Supabase Auth (password hashed) | teacher | teacher sign-in |
| Learner PIN | stored only as a hash by Supabase Auth | learner | learner sign-in |
| Technical logs | IP address and time of requests, kept by the hosting provider | everyone | security and operation of the service |

**Not collected:**
- **Names:** no learner names, real names in codes, emails, phone numbers or photos. The app asks for codes only; the teacher must not use names as codes.
- **Free writing:** journals and quest reflections stay on the device.
- **Lab trials:** the detailed simulation measurements stay on the device.
- **Tracking:** no location, device fingerprinting, advertising or third-party analytics.

**The mapping from codes to real names** (e.g. "G11A-07 = …") is kept **by the teacher, offline**, never in the app. Without it, the online data cannot be linked to a learner by anyone else.

## 3. Who can see what

| Person | Can see |
|---|---|
| Learner | only their own records |
| Teacher | only learners enrolled in **their own active** classes (enforced by the database, "Row Level Security") |
| Administrator (project owner) | everything, through the Supabase dashboard. Should be limited to named persons |
| Anyone signed out | nothing (tested) |

Security measures:
- encrypted connections (HTTPS);
- database rules tested automatically (27 tests);
- the secret server key is never in the app;
- PINs of 8 random characters;
- teachers cannot see other teachers' classes.

Details: `docs/BACKEND_AND_SECURITY.md`.

## 4. Where the data is stored (processor)
- **Service:** Supabase (a hosted PostgreSQL database and sign-in service), which runs on Amazon Web Services.
- **Test project location:** **Sydney, Australia** (`ap-southeast-2`).
- **Pilot location:** the school decides. Supabase also offers **Singapore** (closest to the Philippines). The project would have to be re-created there, since a project's region can't be changed.
- **Cross-border transfer:** data stored outside the Philippines is a cross-border transfer; the DPO should consider it.
- **Agreements:** the school should check Supabase's data processing terms and security documentation, and keep a record of the processing.

## 5. Retention and deletion (proposed, for the school to set)

| What | Proposal |
|---|---|
| Learner results online | until the end of the school year, or until the Master Teacher report is submitted, whichever is later; then deleted |
| Classes | archived at the end of the school year (teacher access ends), then deleted with the learner data |
| Learner deletes own data | possible at any time in Settings → "Delete my online data" |
| Teacher removes a learner | deletes that learner's online account and results |
| Backups | Supabase daily backups expire on their own schedule. Exported copies (if any) are stored encrypted and deleted with the data |
| Class CSV / results files | kept by the teacher on school devices only, deleted on the same schedule |

## 6. Questions the school must answer before approval

1. **Approval:** who approves use with real learners? (school head, DPO, division office?)
2. **Notice and consent:** is a **privacy notice** to parents/guardians enough, or is **written consent** required? See the draft in §7. What happens for learners whose parents do not agree? They can use device-only mode with result files; nothing changes for their learning.
3. **Data location:** is storage outside the Philippines (Singapore or Australia) acceptable?
4. **Retention:** is the retention period in §5 acceptable? Who deletes, and when?
5. **Roles:** who is the administrator of the Supabase project, and who holds that account?
6. **Records:** does the processing need to be recorded in the school's or division's records of processing, or registered?
7. **Breach plan:** who is told, and how, if a teacher password or PIN slip list is lost? (Immediate steps: reset the teacher password and issue new PINs.)
8. **Research use:** will results appear in the Master Teacher report (SRC-T7)? If so, only class-level or anonymised figures (the class CSV average row) should be published.

## 7. Draft notice for parents/guardians (for the school to edit)

> **EffiQuest science lessons: how your child's learning data is used**
>
> In Grade 11 General Science, your child will use **EffiQuest**, a learning app with virtual machine experiments and short quizzes, during [dates].
>
> **What is recorded:** quiz answers and scores, and which lessons, experiments and quests were completed. Your child is identified only by a **code** given by the teacher (for example G11A-07), **not by name**. No photos, contact details or location are collected.
>
> **Why:** to show the teacher which science ideas your child understands, and how their understanding changes from the start to the end of the quarter.
>
> **Where:** [On the school device only. / In an online database provided by Supabase, located in [Singapore], protected by passwords and access rules. Only your child and their science teacher can see your child's results.]
>
> **How long:** until [date]; then the data is deleted.
>
> **Your rights:** you may ask to see, correct, or delete your child's data, or ask that your child use the app without the online class. Contact: [teacher / Data Protection Officer, contact details].

## 8. Sign-off

| Role | Name | Decision (approve / approve with conditions / not approved) | Date |
|---|---|---|---|
| Subject teacher | | | |
| School head | | | |
| Data Protection Officer | | | |
