-- EffiQuest 3D: assessment registry seed (content pack 1.0.0-draft).
-- Mirrors src/content/assessments.ts (shape only: no question text, no answer keys).
-- A unit test (src/services/backend/registry.test.ts) fails if this drifts from the content.
-- When the teacher approves or edits items: bump the version in the content AND add a new
-- migration that updates these rows (never edit an applied migration).

insert into public.assessments (id, kind, mode, version, item_count, max_score) values
  ('diagnostic-baseline', 'baseline', 'test', '1.0.0-draft', 13, 15),
  ('diagnostic-post', 'post', 'test', '1.0.0-draft', 13, 15),
  ('check-effort-vs-efficiency', 'quest_check', 'practice', '1.0.0-draft', 3, 3),
  ('check-perfect-machine', 'quest_check', 'practice', '1.0.0-draft', 3, 6),
  ('check-turning-forces', 'quest_check', 'practice', '1.0.0-draft', 3, 6),
  ('check-pressure-at-work', 'quest_check', 'practice', '1.0.0-draft', 3, 3);

insert into public.assessment_items (assessment_id, item_id, max_points, misconception_id)
select a.id, i.item_id, i.max_points, i.misconception_id
from (values ('diagnostic-baseline'), ('diagnostic-post')) as a (id)
cross join (values
  ('d-g1-1', 1, 'G1'), ('d-g1-2', 1, 'G1'),
  ('d-g2-1', 1, 'G2'), ('d-g2-2', 1, 'G2'),
  ('d-g3-1', 4, 'G3'), ('d-g3-2', 1, 'G3'),
  ('d-g4-1', 1, 'G4'), ('d-g4-2', 1, 'G4'),
  ('d-g5-1', 1, 'G5'), ('d-g5-2', 1, 'G5'),
  ('d-g6-1', 1, 'G6'), ('d-g6-2', 1, 'G6'),
  ('d-reflect', 0, 'G2')
) as i (item_id, max_points, misconception_id);

insert into public.assessment_items (assessment_id, item_id, max_points, misconception_id) values
  ('check-effort-vs-efficiency', 'q1-1', 1, 'G2'),
  ('check-effort-vs-efficiency', 'q1-2', 1, 'G2'),
  ('check-effort-vs-efficiency', 'q1-3', 1, 'G2'),
  ('check-perfect-machine', 'q2-1', 1, 'G4'),
  ('check-perfect-machine', 'q2-2', 4, 'G4'),
  ('check-perfect-machine', 'q2-3', 1, 'G4'),
  ('check-turning-forces', 'q3-1', 1, 'G1'),
  ('check-turning-forces', 'q3-2', 4, 'G1'),
  ('check-turning-forces', 'q3-3', 1, 'G1'),
  ('check-pressure-at-work', 'q4-1', 1, 'G6'),
  ('check-pressure-at-work', 'q4-2', 1, 'G6'),
  ('check-pressure-at-work', 'q4-3', 1, 'G6');
