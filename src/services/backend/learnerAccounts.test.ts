import { describe, expect, it } from 'vitest';
import {
  generatePin,
  handleAccountRequest,
  learnerLoginId,
  parseRequest,
  PIN_ALPHABET,
  PIN_LENGTH,
  type AccountDeps,
} from '../../../supabase/functions/_shared/learnerAccounts';
import { checkPin, parseLearnerCodes } from './validation';

const CLASS = '11111111-1111-4111-8111-111111111111';
const LEARNER = '22222222-2222-4222-8222-222222222222';
const JOIN = '3FA9C01B';

/** In-memory stand-in for Supabase Auth + the enroll function. */
function fakeDeps(opts: { teaches?: boolean; seesLearner?: boolean; enrollFails?: string[] } = {}) {
  const users = new Map<string, { loginId: string; password: string }>();
  const enrolled: Array<{ userId: string; code: string }> = [];
  let next = 0;
  const deps: AccountDeps = {
    callerClassJoinCode: async () => (opts.teaches === false ? null : JOIN),
    callerSeesLearner: async () => opts.seesLearner !== false,
    createUser: async (loginId, password) => {
      if ([...users.values()].some((u) => u.loginId === loginId)) throw new Error('exists');
      const id = `user-${++next}`;
      users.set(id, { loginId, password });
      return id;
    },
    deleteUser: async (id) => void users.delete(id),
    setPassword: async (id, password) => {
      const u = users.get(id);
      if (u) u.password = password;
    },
    enroll: async (_c, userId, code) => {
      if (opts.enrollFails?.includes(code))
        throw new Error(`Learner code ${code} is already in this class.`);
      enrolled.push({ userId, code });
    },
    randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
  };
  return { deps, users, enrolled };
}

describe('learner login id and PINs', () => {
  it('derives a synthetic, non-deliverable login id from the codes only', () => {
    expect(learnerLoginId('3FA9C01B', 'G11A-07')).toBe(
      'g11a-07.3fa9c01b@learners.effiquest.invalid',
    );
  });

  it('generates PINs from the unambiguous alphabet without bias', () => {
    const pin = generatePin((n) => crypto.getRandomValues(new Uint8Array(n)));
    expect(pin).toHaveLength(PIN_LENGTH);
    expect([...pin].every((c) => PIN_ALPHABET.includes(c))).toBe(true);
    // Bytes at or above the rejection limit are skipped: 255 never maps to a symbol.
    const always255 = generatePin((n) => {
      const b = new Uint8Array(n).fill(255);
      b[0] = 2; // one usable byte per call → still completes
      return b;
    });
    expect(always255).toBe(PIN_ALPHABET[2]?.repeat(PIN_LENGTH));
  });

  it('learner PIN input is forgiving about case, spaces and dashes', () => {
    expect(checkPin(' k7p2-9xqm ')).toEqual({ ok: true, value: 'K7P29XQM' });
    expect(checkPin('K7P29XQ0').ok).toBe(false); // 0 is not in the alphabet
  });
});

describe('request validation (untrusted input)', () => {
  it('accepts valid requests and normalises codes', () => {
    expect(parseRequest({ action: 'create', classId: CLASS, learnerCodes: [' g11a-01 '] })).toEqual(
      {
        action: 'create',
        classId: CLASS,
        learnerCodes: ['G11A-01'],
      },
    );
  });

  it('rejects malformed classes, codes, duplicates, oversized batches and unknown actions', () => {
    expect(parseRequest(null)).toMatch(/Malformed/);
    expect(parseRequest({ action: 'create', classId: 'x', learnerCodes: ['A-1'] })).toMatch(
      /class/,
    );
    expect(parseRequest({ action: 'create', classId: CLASS, learnerCodes: ['bad code'] })).toMatch(
      /3 to 16/,
    );
    expect(
      parseRequest({ action: 'create', classId: CLASS, learnerCodes: ['AB1', 'ab1'] }),
    ).toMatch(/twice/);
    expect(
      parseRequest({
        action: 'create',
        classId: CLASS,
        learnerCodes: Array.from({ length: 61 }, (_, i) => `L-${i}`),
      }),
    ).toMatch(/At most/);
    expect(parseRequest({ action: 'drop-table', classId: CLASS })).toMatch(/Unknown/);
    expect(parseRequest({ action: 'delete', classId: CLASS, learnerId: 'nope' })).toMatch(
      /learner/,
    );
  });

  it('the teacher form parses pasted lists the same way', () => {
    expect(parseLearnerCodes('g11a-01\nG11A-02, G11A-03;')).toEqual({
      ok: true,
      value: ['G11A-01', 'G11A-02', 'G11A-03'],
    });
    expect(parseLearnerCodes('G11A-01 g11a-01').ok).toBe(false);
  });
});

describe('handleAccountRequest', () => {
  it('creates one account and enrollment per code and returns each PIN once', async () => {
    const { deps, users, enrolled } = fakeDeps();
    const r = await handleAccountRequest(deps, {
      action: 'create',
      classId: CLASS,
      learnerCodes: ['G11A-01', 'G11A-02'],
    });
    expect(r.ok && r.created?.map((c) => c.learnerCode)).toEqual(['G11A-01', 'G11A-02']);
    expect(enrolled.map((e) => e.code)).toEqual(['G11A-01', 'G11A-02']);
    const u = [...users.values()][0];
    expect(u?.loginId).toBe('g11a-01.3fa9c01b@learners.effiquest.invalid');
    expect(r.ok && r.created?.[0]?.pin).toBe(u?.password);
  });

  it('refuses everything when the caller is not the teacher of the class', async () => {
    const { deps, users } = fakeDeps({ teaches: false });
    const r = await handleAccountRequest(deps, {
      action: 'create',
      classId: CLASS,
      learnerCodes: ['G11A-01'],
    });
    expect(r).toEqual({ ok: false, status: 403, error: expect.stringMatching(/teacher/) });
    expect(users.size).toBe(0);
  });

  it('rolls back the auth user when enrollment is refused, and reports the reason', async () => {
    const { deps, users } = fakeDeps({ enrollFails: ['G11A-02'] });
    const r = await handleAccountRequest(deps, {
      action: 'create',
      classId: CLASS,
      learnerCodes: ['G11A-01', 'G11A-02'],
    });
    expect(r.ok && r.failed).toEqual([
      { learnerCode: 'G11A-02', reason: 'Learner code G11A-02 is already in this class.' },
    ]);
    expect(users.size).toBe(1);
  });

  it('resets a PIN or deletes an account only for a learner in the caller’s class', async () => {
    const ok = fakeDeps();
    const created = await handleAccountRequest(ok.deps, {
      action: 'create',
      classId: CLASS,
      learnerCodes: ['G11A-01'],
    });
    const oldPin = created.ok ? created.created?.[0]?.pin : '';
    const reset = await handleAccountRequest(ok.deps, {
      action: 'reset-pin',
      classId: CLASS,
      learnerId: LEARNER,
    });
    expect(reset.ok && reset.pin).toMatch(/^[2-9A-Z]{8}$/);
    expect(reset.ok && reset.pin).not.toBe(oldPin);

    const other = fakeDeps({ seesLearner: false });
    expect(
      await handleAccountRequest(other.deps, {
        action: 'delete',
        classId: CLASS,
        learnerId: LEARNER,
      }),
    ).toMatchObject({ ok: false, status: 403 });
  });
});
