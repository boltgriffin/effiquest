// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import core from '../../../supabase/migrations/20261124000001_core_schema.sql?raw';
import functions from '../../../supabase/migrations/20261124000002_functions.sql?raw';
import registry from '../../../supabase/migrations/20261124000003_assessment_registry.sql?raw';
import teacherIssued from '../../../supabase/migrations/20261124000004_teacher_issued_accounts.sql?raw';
import shim from '../../../supabase/tests/auth-shim.sql?raw';

/**
 * Security tests for the Supabase migrations: the real SQL runs in PGlite (embedded Postgres)
 * with a stand-in for Supabase's auth schema. Each "as" call switches to the `authenticated`
 * role with that user's JWT subject, exactly as PostgREST does for API requests.
 */

const T1 = '00000000-0000-4000-8000-0000000000a1'; // teacher
const T2 = '00000000-0000-4000-8000-0000000000a2'; // another teacher
const L1 = '00000000-0000-4000-8000-0000000000b1'; // learner in T1's class
const L2 = '00000000-0000-4000-8000-0000000000b2'; // learner in T1's class
const L3 = '00000000-0000-4000-8000-0000000000b3'; // learner in T2's class
const X = '00000000-0000-4000-8000-0000000000c1'; // signed in, no role

let db: PGlite;

async function as<T>(uid: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

/** As the service role (only the manage-learners Edge Function, on the server, has it). */
async function asService<T>(fn: () => Promise<T>): Promise<T> {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  await db.exec('set role service_role');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

const enroll = (classId: string, userId: string, code: string) =>
  rows('select public.enroll_learner_account($1, $2, $3)', [classId, userId, code]);

const rows = async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows;

let n = 0;
const uuid = () => `10000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

/** A valid quest-check attempt for check-effort-vs-efficiency (3 items, max 3). */
function checkAttempt(score: number, overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const items = ['q1-1', 'q1-2', 'q1-3'];
  return {
    attempt: {
      id: uuid(),
      assessmentId: 'check-effort-vs-efficiency',
      assessmentVersion: '1.0.0-draft',
      kind: 'quest_check',
      mode: 'practice',
      startedAt: now,
      submittedAt: now,
      score,
      maxScore: 3,
      ...overrides,
    },
    responses: items.map((itemId, i) => ({
      id: uuid(),
      itemId,
      response: JSON.stringify('a'),
      isCorrect: i < score,
      points: i < score ? 1 : 0,
      maxPoints: 1,
      tries: 1,
      misconceptionId: 'G2',
      answeredAt: now,
    })),
  };
}

const submit = (a: ReturnType<typeof checkAttempt>) =>
  rows('select public.submit_attempt($1::jsonb, $2::jsonb) as ok', [
    JSON.stringify(a.attempt),
    JSON.stringify(a.responses),
  ]);

let class1 = '';
let class2 = '';

beforeAll(async () => {
  db = new PGlite();
  await db.exec(shim);
  await db.exec(core);
  await db.exec(functions);
  await db.exec(registry);
  await db.exec(teacherIssued);
  // Sign-ups (Supabase Auth inserts into auth.users; the trigger creates empty profiles).
  for (const id of [T1, T2, L1, L2, L3, X]) {
    await db.query('insert into auth.users (id) values ($1)', [id]);
  }
  // The administrator (service role / SQL editor) grants the teacher role. Never the client.
  await db.query(
    `insert into public.user_roles (profile_id, role) values ($1, 'teacher'), ($2, 'teacher')`,
    [T1, T2],
  );
  const c1 = await as(T1, () =>
    rows(`insert into public.classes (name, school_year) values ('G11 STEM A', '2026-2027')
          returning id, join_code`),
  );
  const c2 = await as(T2, () =>
    rows(`insert into public.classes (name) values ('G11 ABM B') returning id, join_code`),
  );
  class1 = (c1[0] as { id: string }).id;
  class2 = (c2[0] as { id: string }).id;
  // Teacher-issued accounts (D-20): the Edge Function enrolls each learner with the service role.
  await asService(() => enroll(class1, L1, 'G11A-01'));
  await asService(() => enroll(class1, L2, ' g11a-02 '));
  await asService(() => enroll(class2, L3, 'G11B-01'));
}, 60_000);

describe('roles cannot be supplied by the client', () => {
  it('a user cannot grant themself a role', async () => {
    await expect(
      as(X, () =>
        rows(`insert into public.user_roles (profile_id, role) values ($1, 'teacher')`, [X]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it('a user without the teacher role cannot create a class', async () => {
    await expect(
      as(L1, () => rows(`insert into public.classes (name) values ('Fake class')`)),
    ).rejects.toThrow(/row-level security/);
  });

  it('a class cannot be created for another teacher', async () => {
    await expect(
      as(T1, () => rows(`insert into public.classes (name, teacher_id) values ('x', $1)`, [T2])),
    ).rejects.toThrow(/row-level security/);
  });

  it('a teacher cannot change a class join code or owner', async () => {
    await expect(
      as(T1, () =>
        rows(`update public.classes set join_code = 'AAAAAAAA' where id = $1`, [class1]),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(T1, () => rows(`update public.classes set teacher_id = $2 where id = $1`, [class1, T2])),
    ).rejects.toThrow(/permission denied/);
  });

  it('users read only their own roles', async () => {
    expect(await as(L1, () => rows('select profile_id, role from public.user_roles'))).toEqual([
      { profile_id: L1, role: 'learner' },
    ]);
  });
});

describe('teacher-issued learner accounts', () => {
  it('enrolling normalises the code and grants only the learner role', async () => {
    const p = await as(L2, () =>
      rows('select learner_code from public.profiles where id = $1', [L2]),
    );
    expect(p).toEqual([{ learner_code: 'G11A-02' }]);
    expect(await as(L2, () => rows('select role from public.user_roles'))).toEqual([
      { role: 'learner' },
    ]);
  });

  it('only the service role can enroll: not learners, not even teachers', async () => {
    await expect(as(X, () => enroll(class1, X, 'G11A-09'))).rejects.toThrow(/permission denied/);
    await expect(as(T1, () => enroll(class1, X, 'G11A-09'))).rejects.toThrow(/permission denied/);
  });

  it('rejects a malformed code, an unknown or archived class and a duplicate code', async () => {
    await expect(asService(() => enroll(class1, X, 'bad code!'))).rejects.toThrow(/Learner code/);
    await expect(asService(() => enroll(uuid(), X, 'G11A-09'))).rejects.toThrow(/archived/);
    await expect(asService(() => enroll(class1, X, 'G11A-01'))).rejects.toThrow(/already in/);
  });

  it('self-joining no longer exists', async () => {
    await expect(
      as(X, () => rows(`select * from public.join_class('AAAAAAAA', 'G11A-09')`)),
    ).rejects.toThrow(/does not exist/);
  });

  it('owns_active_class is true only for the class teacher', async () => {
    const owns = (uid: string) =>
      as(uid, () => rows('select public.owns_active_class($1) as ok', [class1]));
    expect(await owns(T1)).toEqual([{ ok: true }]);
    expect(await owns(T2)).toEqual([{ ok: false }]);
    expect(await owns(L1)).toEqual([{ ok: false }]);
  });

  it('cannot be done by writing enrollments directly', async () => {
    await expect(
      as(X, () =>
        rows(
          `insert into public.enrollments (class_id, learner_id, learner_code) values ($1, $2, 'ZZZ')`,
          [class1, X],
        ),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});

describe('attempts are validated on the server', () => {
  it('accepts a valid attempt once (idempotent)', async () => {
    const a = checkAttempt(2);
    expect(await as(L1, () => submit(a))).toEqual([{ ok: true }]);
    expect(await as(L1, () => submit(a))).toEqual([{ ok: false }]);
    const stored = await as(L1, () =>
      rows('select count(*)::int as c from public.attempt_responses where attempt_id = $1', [
        a.attempt.id,
      ]),
    );
    expect(stored).toEqual([{ c: 3 }]);
  });

  it('rejects a score that does not add up, a wrong max, unknown items and old versions', async () => {
    await expect(as(L1, () => submit(checkAttempt(2, { score: 3 })))).rejects.toThrow(/add up/);
    await expect(as(L1, () => submit(checkAttempt(2, { maxScore: 99 })))).rejects.toThrow(/add up/);
    await expect(
      as(L1, () => submit(checkAttempt(2, { assessmentVersion: '0.9' }))),
    ).rejects.toThrow(/older version/);
    const bad = checkAttempt(1);
    const first = bad.responses[0];
    if (first) first.itemId = 'q9-9';
    await expect(as(L1, () => submit(bad))).rejects.toThrow(/Unknown question/);
    const inflated = checkAttempt(1);
    const r0 = inflated.responses[0];
    if (r0) r0.points = 5;
    await expect(as(L1, () => submit(inflated))).rejects.toThrow(/does not match/);
  });

  it('rejects attempts from a user who has not joined a class', async () => {
    await expect(as(X, () => submit(checkAttempt(1)))).rejects.toThrow(/Join a class/);
  });

  it('accepts a diagnostic only once per learner', async () => {
    const now = new Date().toISOString();
    const items: Array<[string, number, string]> = [
      ['d-g1-1', 1, 'G1'],
      ['d-g1-2', 1, 'G1'],
      ['d-g2-1', 1, 'G2'],
      ['d-g2-2', 1, 'G2'],
      ['d-g3-1', 4, 'G3'],
      ['d-g3-2', 1, 'G3'],
      ['d-g4-1', 1, 'G4'],
      ['d-g4-2', 1, 'G4'],
      ['d-g5-1', 1, 'G5'],
      ['d-g5-2', 1, 'G5'],
      ['d-g6-1', 1, 'G6'],
      ['d-g6-2', 1, 'G6'],
      ['d-reflect', 0, 'G2'],
    ];
    const make = () => ({
      attempt: {
        id: uuid(),
        assessmentId: 'diagnostic-baseline',
        assessmentVersion: '1.0.0-draft',
        kind: 'baseline',
        mode: 'test',
        startedAt: now,
        submittedAt: now,
        score: 0,
        maxScore: 15,
      },
      responses: items.map(([itemId, maxPoints, misconceptionId]) => ({
        id: uuid(),
        itemId,
        response: 'null',
        isCorrect: false,
        points: 0,
        maxPoints,
        tries: 1,
        misconceptionId,
        answeredAt: now,
      })),
    });
    expect(await as(L2, () => submit(make()))).toEqual([{ ok: true }]);
    await expect(as(L2, () => submit(make()))).rejects.toThrow(/already submitted/);
  });

  it('cannot be bypassed by inserting attempts directly', async () => {
    await expect(
      as(L1, () =>
        rows(
          `insert into public.attempts (id, owner_id, assessment_id, assessment_version, kind, mode,
             started_at, submitted_at, score, max_score)
           values ($1, $2, 'check-turning-forces', '1.0.0-draft', 'quest_check', 'practice',
             now(), now(), 6, 6)`,
          [uuid(), L1],
        ),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});

describe('progress events', () => {
  it('a learner appends their own events only', async () => {
    await as(L1, () =>
      rows(
        `insert into public.progress_events (id, kind, ref_id, created_at)
         values ($1, 'lesson_completed', 'torque', now())`,
        [uuid()],
      ),
    );
    await expect(
      as(L1, () =>
        rows(
          `insert into public.progress_events (id, owner_id, kind, ref_id, created_at)
           values ($1, $2, 'lesson_completed', 'torque', now())`,
          [uuid(), L2],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('rejects invalid kinds, references and future timestamps', async () => {
    const insert = (kind: string, ref: string, at: string) =>
      as(L1, () =>
        rows(
          `insert into public.progress_events (id, kind, ref_id, created_at) values ($1, $2, $3, $4)`,
          [uuid(), kind, ref, at],
        ),
      );
    await expect(insert('hacked', 'torque', new Date().toISOString())).rejects.toThrow(/check/);
    await expect(insert('lesson_completed', '<script>', new Date().toISOString())).rejects.toThrow(
      /check/,
    );
    await expect(insert('lesson_completed', 'torque', '2099-01-01T00:00:00Z')).rejects.toThrow(
      /check/,
    );
  });

  it('events cannot be edited or deleted by clients', async () => {
    await expect(
      as(L1, () => rows(`update public.progress_events set ref_id = 'x'`)),
    ).rejects.toThrow(/permission denied/);
    await expect(as(L1, () => rows(`delete from public.progress_events`))).rejects.toThrow(
      /permission denied/,
    );
  });

  it('a user without the learner role cannot write events', async () => {
    await expect(
      as(X, () =>
        rows(
          `insert into public.progress_events (id, kind, ref_id, created_at)
           values ($1, 'lesson_completed', 'torque', now())`,
          [uuid()],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe('who can read learner data', () => {
  const owners = async (uid: string, table: string) =>
    (
      await as(uid, () => rows(`select distinct owner_id from public.${table} order by owner_id`))
    ).map((r) => (r as { owner_id: string }).owner_id);

  it('learners see only their own records', async () => {
    expect(await owners(L1, 'attempts')).toEqual([L1]);
    expect(await owners(L2, 'attempts')).toEqual([L2]);
    expect(await owners(L3, 'attempts')).toEqual([]);
    const profiles = await as(L1, () => rows('select id from public.profiles'));
    expect(profiles).toEqual([{ id: L1 }]);
  });

  it('a teacher sees only learners enrolled in their own classes', async () => {
    expect(await owners(T1, 'attempts')).toEqual([L1, L2]);
    expect(await owners(T1, 'attempt_responses')).toEqual([L1, L2]);
    expect(await owners(T2, 'attempts')).toEqual([]);
    const roster = await as(T2, () => rows('select learner_code from public.enrollments'));
    expect(roster).toEqual([{ learner_code: 'G11B-01' }]);
    const classes = await as(T2, () => rows('select name from public.classes'));
    expect(classes).toEqual([{ name: 'G11 ABM B' }]);
  });

  it('a learner sees their class but not its join code list of other classes', async () => {
    const classes = await as(L3, () => rows('select name from public.classes'));
    expect(classes).toEqual([{ name: 'G11 ABM B' }]);
  });

  it('the anonymous (signed-out) role can read nothing', async () => {
    for (const t of [
      'profiles',
      'attempts',
      'progress_events',
      'classes',
      'enrollments',
      'assessments',
    ]) {
      await expect(as(null, () => rows(`select * from public.${t}`))).rejects.toThrow(
        /permission denied/,
      );
    }
  });

  it('removing a learner from the class ends the teacher’s access', async () => {
    await as(T1, () => rows('delete from public.enrollments where learner_id = $1', [L2]));
    expect(await owners(T1, 'attempts')).toEqual([L1]);
    // Another teacher cannot remove learners from a class they do not own.
    await as(T2, () => rows('delete from public.enrollments where learner_id = $1', [L1]));
    expect(await owners(T1, 'attempts')).toEqual([L1]);
  });
});

describe('deleting cloud data', () => {
  it('a learner can delete everything stored about them', async () => {
    await as(L1, () => rows('select public.delete_my_cloud_data()'));
    await db.exec('reset role');
    const left = await rows(
      `select (select count(*) from public.attempts where owner_id = $1)::int as a,
              (select count(*) from public.attempt_responses where owner_id = $1)::int as r,
              (select count(*) from public.progress_events where owner_id = $1)::int as e,
              (select count(*) from public.enrollments where learner_id = $1)::int as en`,
      [L1],
    );
    expect(left).toEqual([{ a: 0, r: 0, e: 0, en: 0 }]);
  });

  it('a teacher account cannot delete itself this way', async () => {
    await expect(as(T1, () => rows('select public.delete_my_cloud_data()'))).rejects.toThrow(
      /administrator/,
    );
  });
});
