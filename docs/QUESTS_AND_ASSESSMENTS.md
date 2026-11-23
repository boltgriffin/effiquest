# QUESTS_AND_ASSESSMENTS.md

Milestone 10: quest-based learning and the assessment system.

**Status of the content:** every question in this milestone is a **draft** (`status: 'draft'`). It was written by the developer from the concept note's objectives (decision D-10), and the app shows it as "Draft items · teacher review". **No official competency codes are claimed** (D-07: codes not yet supplied).

## 1. Sources used

| Need | Source |
|---|---|
| Baseline diagnostic before the modules | SRC-T2 (weeks 1-2), SRC-N1 (pretest on MA, efficiency, machine connections) |
| Post diagnostic, effectiveness comparison | SRC-T7 (weeks 11-12); D-15 (baseline and post per G1-G6 in the CSV) |
| Formative quizzes and reflection | SRC-N2 (weekly quizzes, reflection sheets), SRC-N4 (journals) |
| What the items target | SRC-G1..G6 (misconceptions) and SRC-O1..O6 (objectives) |
| No points, XP, badges or leaderboards | D-11. Assessment scores are measurement, not game points |

## 2. Learning sequence

```
Baseline diagnostic (/assess/baseline, once)
        │
        ▼
Quest ×4, one per misconception (G2, G4, G1, G6)
  1. Lesson         concept review: module marked complete
  2. Lab            simulation activity + experiment task (guide, trials, journal)
  3. Knowledge check practice quiz with feedback and one retry  ← new
  4. Reflection     answer the quest question with evidence (locked until 1-3 are done)
  ✓ Completion feedback, with a link to the next quest
        │
        ▼
Post diagnostic (/assess/post, once, only after the baseline)
        │
        ▼
Progress page (baseline vs post per idea) → learner file → teacher CSV (D-15)
```

### How this matches the milestone's suggested quest structure

| Suggested element | Used? | Where |
|---|---|---|
| Mission introduction | Yes | Quest page, "Mission" panel (the quest question) |
| Learning objective | Yes | Quest page, the SRC-O objective paraphrased with its code |
| Concept review | Yes | Stage 1, the lesson (module) |
| Simulation activity | Yes | Stage 2, the lab |
| Experiment task | Yes | Stage 2, the lab's 7-step guide (predict, measure, record trials) |
| Knowledge check | Yes (new) | Stage 3, `/quests/:id/check` |
| Reflection | Yes | Stage 4, the quest question with evidence |
| Completion feedback | Yes | "Quest complete" message with the next quest |

G3 (simple to compound machines) and G5 (efficiency in practice) have no quest yet, because there is no compound-machine lab (D-05). Both are covered by the diagnostic, and the results link learners to the module that targets them.

## 3. Item types (`components/assessment/ItemView.tsx`)

| Type | Interaction | Marking |
|---|---|---|
| Multiple choice | radio buttons A-D | 1 point. A wrong option may be tagged with the misconception it reveals |
| True or false | two radio buttons | 1 point |
| Matching | one native select per prompt (works on phones and with screen readers; no drag-and-drop) | 1 point per correct pair (partial credit); "correct" only when all pairs are right |
| Numeric | text field with the unit shown | 1 point if within the item's absolute tolerance. Accepts `12.5`, `1,000`, `-3`, `1e3`. Rejects `12 N`, `1,5` and empty input **with a message, without using a try** |
| Short reflection | text area, minimum length | Not scored. Complete at the minimum length; shown back in the results |

Every item has a `prompt`, an `objective` (SRC-O code), a target `misconceptionId`, an `explanation` and a review `status`.

## 4. Modes, feedback and retries

| | Diagnostic (test) | Knowledge check (practice) |
|---|---|---|
| Feedback | **none before submission** | after each **Check answer** |
| Retries | none; taken **once** | a wrong answer may be checked once more (`PRACTICE_MAX_TRIES = 2`), then the answer and explanation are shown. The whole check can be retaken; every attempt is kept |
| Score | points for the submitted answers | points only for answers **correct on the first check**, so the score shows what the learner knew; tries are recorded |
| Answers shown in the results | baseline: **no**; post: yes | yes |
| Before submitting | review screen listing unanswered and unreadable answers | — |

**Why the baseline hides its answers (REC):** the post diagnostic repeats the same items, so the baseline-to-post comparison is valid. Showing the answers after the baseline would teach the test. The teacher can go through the answers in class. *Owner/teacher to confirm.*

**Results summary:**
- the score and percent;
- per idea (G1-G6): points and a band. "Strength" is 75 % or more, "Keep working" is below 50 %, and "Developing" is in between. These cut-offs are a REC for the teacher to confirm;
- "Areas to improve" links to the matching quest, or to a module if the idea has no quest;
- an item review with your answer, the correct answer, the explanation and the misconception a chosen distractor matches (when answers are revealed).

## 5. What is recorded (device only, D-03)

| Record | Store | When |
|---|---|---|
| Attempt `{assessmentId, version, kind, mode, startedAt, submittedAt, score, maxScore}` | `attempts` | on submission |
| One response per item `{response, isCorrect, points, maxPoints, tries, misconceptionId, revealed}` | `attempt_responses` (new index `byAttempt`) | on submission |
| `assessment_submitted` event | `progress_events` | on submission |
| Draft (answers so far, question on screen, tries) | `assessment_drafts` (new, working state) | 300 ms after each change, and when the page is hidden |
| `lesson_opened` event | `progress_events` | first time a module page is opened |

- **One transaction:** the attempt, its responses, the event and the draft removal are written together, so progress never shows a submission without its answers.
- **Refresh-safe:** a refresh or closed tab returns the learner to the same question with their answers ("Welcome back: your earlier answers were kept"). A draft for an older version of the items is discarded.
- **Versioned:** each assessment has a `version`. Item-by-item review is rebuilt only for the same version; otherwise only the stored score is shown.
- The database moved to **version 3**, covered by an upgrade test from version 2.

### Progress indicators (Progress page)
- Lessons opened, modules completed, labs completed, knowledge checks done and quests completed.
- Diagnostics per idea: the baseline, then baseline vs post.
- An attempts table with score and time submitted.

**Time spent is not recorded.** It cannot be measured reliably offline (tabs left open), and it is not evidence of learning.

### Teacher export (D-15)
- "Download my results" now fills `diagnostics.baseline` and `diagnostics.post` with the percent per idea from the **first** baseline and post attempts, using the stored points.
- The teacher's class CSV already reads these. The file format is unchanged (version 1).
- The new `lesson_opened` event is accepted on import.

## 6. Item bank (drafts, `src/content/assessments.ts`)

| Assessment | Items | Ideas |
|---|---|---|
| Baseline = post diagnostic | 13: 4 MCQ, 2 true/false, 1 matching (4 pairs), 5 numeric, 1 reflection. 15 points | G1-G6, 2 scored items each |
| Check: Less effort, more efficient? | true/false, numeric (AMA), MCQ (two ramps) | G2 |
| Check: Where does the energy go? | numeric (lost energy), matching (loss ↔ lab machine), true/false | G4 |
| Check: Pushing straight, turning round | numeric (torque), matching (linear ↔ rotational), MCQ | G1 |
| Check: Pressure at work | numeric (pressure), true/false, numeric (car lift) | G6 |

**Answer keys are validated by tests** (`content/assessments.test.ts`):
- Numeric keys are recomputed with the project's `edu-calc` engine (torque, efficiency, pressure, Pascal).
- The two-ramp data are checked to come from one surface (μ = 0.1 at 14° and 30°).
- Every MCQ key exists and is never a tagged distractor, and matching keys exist and are unique.
- Tolerances are at most about 2 % of the answer.
- Every idea G1-G6 has at least two scored diagnostic items.

## 7. Accessibility and mobile
- One question per screen.
- Each question is a `fieldset`/`legend`, so the question is read with its controls.
- Focus moves to the new question or to the results.
- Feedback is announced in a polite live region. Status uses icon + text, never colour alone.
- Tap targets are at least 44-48 px; matching uses native selects. Every input is labelled; numeric errors are linked to the field.

## 8. Tests
- **Unit and interaction (new):**
  - `scoring.test.ts`: every item type, tolerance edges, number parsing, partial credit, practice first-try scoring, bands.
  - `history.test.ts`: first-attempt diagnostic percentages, restoring results, version guard.
  - `content/assessments.test.ts`: the content checks above.
  - `AssessmentRunner.test.tsx`: practice feedback, retry and reveal; unreadable number; test mode with no feedback; draft survives a remount; the stored attempt, responses and event; draft cleared.
  - Updated: quest progress (4 stages), DB v3 upgrade, export round trip.
- **End-to-end (desktop and Pixel 7):**
  - **The full learner journey:** lesson → lab → knowledge check (wrong, retry, correct) → results → reflection → quest complete → dashboard.
  - The baseline diagnostic with a refresh mid-way, the review screen, results by idea, no retake, Progress showing the baseline, and the post diagnostic unlocking.
  - A matching question with partial credit and a retake.
  - The Assess page with the post diagnostic locked.

## 9. Open items for the owner and teacher
1. Review and approve, or edit, all 25 items (D-10); when approved, set `status: 'approved'` and bump `version`.
2. Confirm: baseline answers hidden; diagnostics taken once; band cut-offs 75 % / 50 %; practice scoring counts only answers right on the first try.
3. A teacher reset for a diagnostic submitted by mistake is **not** built (device-only, no accounts). Decide if one is needed.
4. G3 and G5 quests depend on compound-machine labs (D-05, later).
