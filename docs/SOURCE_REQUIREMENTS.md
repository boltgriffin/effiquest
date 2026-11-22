# SOURCE_REQUIREMENTS.md

Everything in this file is traceable to a source. Nothing here is a developer recommendation.

## 1. Sources and how they are tagged

| Tag | Source | Status |
|---|---|---|
| **SRC-x** | *Innovation Concept Note* (DepEd "Attachment C" template, filled in; reference dates July 20 – Aug 14, 2026; signed/recommended Aug 14, 2026). File: `Desktop\CUCHARO_GERRY_S_ATTACHMENT-C.-Innovation-Concept-Note-Template.docx` (last modified 20 Nov 2026). | Read in full. **Primary source.** |
| **BRF-x** | The project owner's Milestone 01 brief (the instruction message that commissioned this plan). | Treated as owner instructions, *not* as part of the concept note. |
| **PROTO** | Existing prototype at `Desktop\JAVA JDBC CRUD\EffiQuest` (see `PROJECT_OVERVIEW.md` §3). | Evidence of past work only; not a requirements source. |

**Source-access note.** The concept note was not in the `effiquest` workspace (which is empty). It was located by searching the user's profile for `.docx` files and matching content ("EffiQuest"). The filename carries a person's name, and the document text names the proponent as a Master Teacher I. **The owner should confirm this is the intended "uploaded innovation concept document"** (open decision D-01).

## 2. What the concept note actually is

An *instructional innovation proposal* (a DepEd Master Teacher I innovation concept note) for **Grade 11 General Science**. Its core is a classroom method: flipped-learning videos + guided hands-on experiments with real apparatus + collaborative projects + diagnostics. **It does not mention** a PWA, 3D graphics, a physics engine, user accounts, a database, a cloud backend, gamification mechanics (XP, badges, levels), or leaderboards. The only digital elements it names are video lessons, slide decks, worksheets, an LMS/USB/offline distribution for modules, and diagnostic tests.

## 3. Requirements stated in the concept note

### 3.1 Title, context, audience
- **SRC-01** Title: *"EffiQuest: Bridging Misconceptions in Machines and Efficiency Learning among the Grade 11 Learners."*
- **SRC-02** Learning area / level: General Science, Grade 11 (Senior High School).
- **SRC-03** School context: a national high school, 3rd District, Cluster 5.
- **SRC-04** Target learners: Grade 11 learners who can recall formulas but struggle with conceptual understanding and applying efficiency analysis to real situations.
- **SRC-05** Secondary beneficiaries: teachers (a structured model for addressing misconceptions), the school community, and the future workforce.
- **SRC-06** Framing: learning as "a quest for true efficiency", moving learners from rote memorization to inquiry, transfer, and real-world application.

### 3.2 Learning gaps / misconceptions to address
- **SRC-G1** Learners recall translational formulas but cannot transfer them to rotational motion (torque, angular acceleration).
- **SRC-G2** Learners confuse mechanical advantage with efficiency (assuming effort reduction ⇒ efficient).
- **SRC-G3** Learners can list simple and complex machines but cannot explain how simple machines combine into compound machines (e.g., bicycle, hydraulic lift).
- **SRC-G4** Learners treat machines as "perfect", ignoring friction, leakage and energy loss.
- **SRC-G5** Learners memorize definitions but fail to apply efficiency to practical scenarios (example given: a bicycle going uphill).
- **SRC-G6** Learners understand basic hydraulics in isolation but struggle to transfer it to complex machines and real-world limits.

### 3.3 Objectives
- **SRC-GO** General objective: improve understanding and application of mechanical advantage, efficiency, and machine systems by addressing misconceptions through inquiry-based, hands-on, transfer-focused learning.
- **SRC-O1** Apply translational motion formulas to rotational contexts (torque, angular acceleration) using guided analogies and problem-solving.
- **SRC-O2** Differentiate mechanical advantage from efficiency; recognize friction, energy loss, real-world limits.
- **SRC-O3** Explain how simple machines (lever, pulley, wheel and axle, inclined plane, screw, wedge) combine into complex machines, supported by hands-on demonstrations.
- **SRC-O4** Apply basic hydraulic principles such as Pascal's Law to real systems, including brakes, lifts, and excavators.
- **SRC-O5** Conduct experiments to measure input and output forces, calculate efficiency, and analyze energy losses.
- **SRC-O6** Apply efficiency concepts to practical scenarios (bicycles climbing hills, hydraulic brakes) and justify conclusions with evidence.

### 3.4 Method / description
- **SRC-M1** Flipped learning: short, focused video lessons on torque, mechanical advantage, efficiency, hydraulic principles, before class.
- **SRC-M2** Guided classroom experiments: measure input/output forces, compute efficiency, analyze energy loss in real machines.
- **SRC-M3** Collaborative projects and performance tasks (bicycles, hydraulic lifts, agricultural tools).
- **SRC-M4** Experiments must include friction, leakage and energy loss to challenge the "perfect machine" idea.
- **SRC-M5** Conceptual-change strategies cited: inquiry-based learning, cognitive conflict, diagnostic-based interventions, hands-on experiments.
- **SRC-M6** Learners keep journals recording insights and corrections of misconceptions after each activity.

### 3.5 Implementation period (as written)
- **SRC-T1** One quarter, 10–12 weeks, "second trimester" / "second grading period" (both phrases appear; see gap **G-04**).
- **SRC-T2** Weeks 1–2: orientation + baseline diagnostic (mechanical advantage, efficiency, formula application, friction).
- **SRC-T3** Weeks 3–4: flipped modules (torque, efficiency, hydraulics).
- **SRC-T4** Weeks 5–6: guided experiments and collaborative projects (input/output force, efficiency, energy loss).
- **SRC-T5** Weeks 7–8: connect simple machines to complex systems (bicycles, hydraulic lifts, agricultural tools).
- **SRC-T6** Weeks 9–10: performance tasks, reflection, summative assessment.
- **SRC-T7** Weeks 11–12: post-diagnostic test, effectiveness evaluation, documentation for the Master Teacher I proposal report.

### 3.6 Resources named
- **SRC-R1** Instructional: flipped modules, slide decks, worksheets/activity sheets, assessment tools (diagnostics, performance tasks, rubrics, reflection sheets).
- **SRC-R2** Physical lab: models of lever, pulley, inclined plane, wheel & axle, screw, wedge; compound demos (bicycle, hydraulic jack, brake model); spring scales, force meters, rulers, protractors; friction tools (sandpaper, lubricants, weights).

### 3.7 Expected outputs and outcomes
- **SRC-E1** Outputs: instructional materials; hands-on demonstrations; performance tasks; diagnostic + summative assessment data showing improved transfer and reduced misconceptions; documentation (reports, photos, reflections).
- **SRC-E2** Outcomes: conceptual clarity (MA vs efficiency), knowledge transfer (translational→rotational, hydraulics→real systems), critical thinking, inquiry/experimentation skills, teacher empowerment (replicable model), community impact (school projects, local livelihood tools).

### 3.8 Monitoring
- **SRC-N1** Baseline diagnostics (pretest) on MA, efficiency, machine connections.
- **SRC-N2** Formative assessment: weekly quizzes, reflection sheets, activity outputs.
- **SRC-N3** Classroom observation of inquiry activities and group work.
- **SRC-N4** Learner journals.

### 3.9 Sustainability / scalability
- **SRC-S1** Low-cost, locally available materials.
- **SRC-S2** Reusable modules across school years.
- **SRC-S3** Teacher capacity building without external support.
- **SRC-S4** Integration with the standard Grade 11 curriculum.
- **SRC-S5** Cluster/district adoption; cross-subject reuse (electricity, energy conservation, agricultural tools).
- **SRC-S6** **Digital distribution of modules "via USB, school LMS, or offline platforms, making it scalable even in low-connectivity areas."** (This is the only statement that supports an offline-capable design.)
- **SRC-S7** Replication through documented lesson exemplars, rubrics, activity sheets.

## 4. Requirements stated by the owner's brief (not in the concept note)

- **BRF-1** Product name: *EffiQuest 3D – Interactive Machine and Efficiency Laboratory*.
- **BRF-2** Delivered as a Progressive Web App.
- **BRF-3** For Grade 11 General Science learners.
- **BRF-4** Separation of: presentation/navigation, 3D rendering, physics, educational calculations, lesson/quest content, assessment/progress, auth/roles, offline storage/sync.
- **BRF-5** Efficiency must come from a physically meaningful calculation, not arbitrary friction percentages.
- **BRF-6** The listed technology stack is a *recommendation*; the existing project must be inspected before its stack is changed.
- **BRF-7** Planning only in this milestone; no major implementation before review.

## 5. What the concept note does NOT say (gaps)

These must not be presented as source requirements.

| ID | Not specified in the concept note |
|---|---|
| G-01 | That the innovation is a software product, a PWA, or uses 3D. |
| G-02 | Number of learners, class size, sections, devices available, or internet quality at the school. |
| G-03 | Language of instruction/UI (English, Filipino, bilingual). |
| G-04 | Which period precisely ("second trimester" vs "second grading period" vs "one quarter"); actual start/end dates (the reference window July 20 – Aug 14, 2026 is the *proposal-writing* window, not the implementation window). |
| G-05 | Curriculum competency codes (MELC / Most Essential Learning Competencies / SHS General Science standards) the content must map to. |
| G-06 | User roles, authentication method, or learner identity scheme. |
| G-07 | Success metrics or targets (the Monitoring section lists strategies only; the "evaluation" half of "Monitoring and Evaluation Plan" has no indicators or thresholds). |
| G-08 | Whether digital simulation supplements or replaces the physical experiments (SRC-R2 lists physical apparatus). |
| G-09 | Gamification mechanics (XP, badges, levels, leaderboards), beyond the "quest" framing. |
| G-10 | Data privacy handling for minors' records, parental consent, DepEd data-privacy approvals. |
| G-11 | Hosting, budget, maintenance ownership, or licensing for the software. |
| G-12 | Teacher/admin features (dashboards, content authoring, class management). |
| G-13 | Item bank content: the actual diagnostic questions, rubrics, and video lessons are referred to but not included. |
