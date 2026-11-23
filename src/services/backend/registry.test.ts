// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';
import { allAssessments } from '@/content/assessments';
import { maxPointsOf } from '@/features/assessment/scoring';
import core from '../../../supabase/migrations/20261124000001_core_schema.sql?raw';
import functions from '../../../supabase/migrations/20261124000002_functions.sql?raw';
import registry from '../../../supabase/migrations/20261124000003_assessment_registry.sql?raw';
import teacherIssued from '../../../supabase/migrations/20261124000004_teacher_issued_accounts.sql?raw';
import shim from '../../../supabase/tests/auth-shim.sql?raw';

/** The server's assessment registry must match the app's content pack exactly. */
describe('assessment registry migration', () => {
  it('matches every assessment and item in src/content/assessments.ts', async () => {
    const db = new PGlite();
    await db.exec(shim);
    await db.exec(core);
    await db.exec(functions);
    await db.exec(registry);
    await db.exec(teacherIssued);

    const dbAssessments = (
      await db.query<{
        id: string;
        kind: string;
        mode: string;
        version: string;
        item_count: number;
        max_score: number;
      }>('select * from public.assessments order by id')
    ).rows;
    const expected = [...allAssessments]
      .map((a) => ({
        id: a.id,
        kind: a.kind,
        mode: a.mode,
        version: a.version,
        item_count: a.items.length,
        max_score: a.items.reduce((s, i) => s + maxPointsOf(i), 0),
      }))
      .sort((x, y) => x.id.localeCompare(y.id));
    expect(dbAssessments).toEqual(expected);

    const dbItems = (
      await db.query<{
        assessment_id: string;
        item_id: string;
        max_points: number;
        misconception_id: string;
      }>('select * from public.assessment_items order by assessment_id, item_id')
    ).rows;
    const expectedItems = allAssessments
      .flatMap((a) =>
        a.items.map((i) => ({
          assessment_id: a.id,
          item_id: i.id,
          max_points: maxPointsOf(i),
          misconception_id: i.misconceptionId,
        })),
      )
      .sort((x, y) =>
        x.assessment_id === y.assessment_id
          ? x.item_id.localeCompare(y.item_id)
          : x.assessment_id.localeCompare(y.assessment_id),
      );
    expect(dbItems).toEqual(expectedItems);
    await db.close();
  }, 60_000);
});
