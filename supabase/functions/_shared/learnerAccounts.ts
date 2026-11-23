/**
 * Teacher-issued learner accounts (decision D-20). Pure logic shared by the `manage-learners`
 * Edge Function (Deno, service role) and the app (sign-in identifier). No imports, no I/O:
 * everything that touches Supabase is passed in as `AccountDeps`, so it is unit-tested in Vitest.
 */

export const LEARNER_CODE_RE = /^[A-Z0-9-]{3,16}$/;
export const JOIN_CODE_RE = /^[A-F0-9]{8}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PIN alphabet without look-alikes (no 0/O, 1/I/L). 8 characters ≈ 39 bits. */
export const PIN_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const PIN_LENGTH = 8;
/** Largest class the function will create in one request. */
export const MAX_BATCH = 60;

/**
 * Supabase Auth needs an email-shaped identifier for password sign-in. This one is synthetic:
 * `.invalid` is a reserved top-level domain, so no email can ever be sent to it, and it holds no
 * personal data (class code + pseudonymous learner code).
 */
export function learnerLoginId(joinCode: string, learnerCode: string): string {
  return `${learnerCode.trim().toLowerCase()}.${joinCode.trim().toLowerCase()}@learners.effiquest.invalid`;
}

/** Random PIN by rejection sampling (no modulo bias). */
export function generatePin(randomBytes: (n: number) => Uint8Array): string {
  const max = 256 - (256 % PIN_ALPHABET.length);
  let out = '';
  while (out.length < PIN_LENGTH) {
    for (const b of randomBytes(PIN_LENGTH * 2)) {
      if (b < max && out.length < PIN_LENGTH) out += PIN_ALPHABET[b % PIN_ALPHABET.length];
    }
  }
  return out;
}

export function normalizePin(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '');
}

export interface AccountDeps {
  /** With the CALLER's JWT (RLS applies): the join code if the caller teaches this active class. */
  callerClassJoinCode(classId: string): Promise<string | null>;
  /** With the CALLER's JWT: is this learner enrolled in that class (visible to the teacher)? */
  callerSeesLearner(classId: string, learnerId: string): Promise<boolean>;
  /** Service role: create a confirmed auth user; returns its id. */
  createUser(loginId: string, password: string): Promise<string>;
  deleteUser(userId: string): Promise<void>;
  setPassword(userId: string, password: string): Promise<void>;
  /** Service role: enroll_learner_account(). Throws an Error with a safe message on refusal. */
  enroll(classId: string, userId: string, learnerCode: string): Promise<void>;
  randomBytes(n: number): Uint8Array;
}

export type AccountRequest =
  | { action: 'create'; classId: string; learnerCodes: string[] }
  | { action: 'reset-pin'; classId: string; learnerId: string }
  | { action: 'delete'; classId: string; learnerId: string };

export type AccountResult =
  | {
      ok: true;
      created?: Array<{ learnerCode: string; pin: string }>;
      failed?: Array<{ learnerCode: string; reason: string }>;
      pin?: string;
    }
  | { ok: false; status: 400 | 403; error: string };

const bad = (error: string): AccountResult => ({ ok: false, status: 400, error });
const forbidden: AccountResult = {
  ok: false,
  status: 403,
  error: 'Only the teacher of this class can do that.',
};

/** Validates an untrusted request body. */
export function parseRequest(body: unknown): AccountRequest | string {
  if (!body || typeof body !== 'object') return 'Malformed request.';
  const b = body as Record<string, unknown>;
  if (typeof b.classId !== 'string' || !UUID_RE.test(b.classId)) return 'Malformed class.';
  if (b.action === 'create') {
    if (!Array.isArray(b.learnerCodes) || b.learnerCodes.length === 0) {
      return 'Add at least one learner code.';
    }
    if (b.learnerCodes.length > MAX_BATCH) return `At most ${MAX_BATCH} learners at a time.`;
    const codes: string[] = [];
    for (const c of b.learnerCodes) {
      if (typeof c !== 'string') return 'Malformed learner code.';
      const code = c.trim().toUpperCase();
      if (!LEARNER_CODE_RE.test(code)) {
        return `Learner code "${code.slice(0, 20)}": 3 to 16 letters, digits or hyphens.`;
      }
      if (codes.includes(code)) return `Learner code ${code} is listed twice.`;
      codes.push(code);
    }
    return { action: 'create', classId: b.classId, learnerCodes: codes };
  }
  if (b.action === 'reset-pin' || b.action === 'delete') {
    if (typeof b.learnerId !== 'string' || !UUID_RE.test(b.learnerId)) return 'Malformed learner.';
    return { action: b.action, classId: b.classId, learnerId: b.learnerId };
  }
  return 'Unknown action.';
}

/**
 * Runs one request. The caller's ownership of the class is checked FIRST, with the caller's own
 * credentials, before any service-role action. PINs are returned once and never stored.
 */
export async function handleAccountRequest(
  deps: AccountDeps,
  body: unknown,
): Promise<AccountResult> {
  const req = parseRequest(body);
  if (typeof req === 'string') return bad(req);

  const joinCode = await deps.callerClassJoinCode(req.classId);
  if (!joinCode || !JOIN_CODE_RE.test(joinCode)) return forbidden;

  if (req.action === 'create') {
    const created: Array<{ learnerCode: string; pin: string }> = [];
    const failed: Array<{ learnerCode: string; reason: string }> = [];
    for (const code of req.learnerCodes) {
      const pin = generatePin(deps.randomBytes);
      let userId: string;
      try {
        userId = await deps.createUser(learnerLoginId(joinCode, code), pin);
      } catch {
        failed.push({ learnerCode: code, reason: 'An account for this code already exists.' });
        continue;
      }
      try {
        await deps.enroll(req.classId, userId, code);
        created.push({ learnerCode: code, pin });
      } catch (e) {
        await deps.deleteUser(userId).catch(() => undefined); // roll back the auth user
        failed.push({
          learnerCode: code,
          reason: e instanceof Error && e.message ? e.message : 'Could not be added.',
        });
      }
    }
    return { ok: true, created, failed };
  }

  if (!(await deps.callerSeesLearner(req.classId, req.learnerId))) return forbidden;

  if (req.action === 'reset-pin') {
    const pin = generatePin(deps.randomBytes);
    await deps.setPassword(req.learnerId, pin);
    return { ok: true, pin };
  }

  // delete: removes the account; the profile and every record cascade with it.
  await deps.deleteUser(req.learnerId);
  return { ok: true };
}
