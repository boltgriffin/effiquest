/**
 * Client-side input checks (pure). They give quick, clear messages; the database repeats every
 * check (constraints and SECURITY DEFINER functions), so nothing here is trusted for security.
 */
import {
  LEARNER_CODE_RE,
  MAX_BATCH,
  normalizePin,
  PIN_ALPHABET,
  PIN_LENGTH,
} from '../../../supabase/functions/_shared/learnerAccounts';

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export function checkJoinCode(raw: string): Checked<string> {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '');
  return /^[A-F0-9]{8}$/.test(v)
    ? { ok: true, value: v }
    : { ok: false, error: 'Class code: 8 letters and digits, as given by your teacher.' };
}

export function checkLearnerCode(raw: string): Checked<string> {
  const v = raw.trim().toUpperCase();
  return LEARNER_CODE_RE.test(v)
    ? { ok: true, value: v }
    : { ok: false, error: 'Learner code: 3 to 16 letters, digits or hyphens.' };
}

/** PIN from the teacher's slip: 8 letters and digits (spaces and dashes ignored). */
export function checkPin(raw: string): Checked<string> {
  const v = normalizePin(raw);
  return v.length === PIN_LENGTH && [...v].every((ch) => PIN_ALPHABET.includes(ch))
    ? { ok: true, value: v }
    : { ok: false, error: `PIN: the ${PIN_LENGTH} letters and digits on your slip.` };
}

/** Learner codes typed or pasted by the teacher: one per line, or separated by commas. */
export function parseLearnerCodes(raw: string): Checked<string[]> {
  const codes = raw
    .split(/[\s,;]+/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  if (codes.length === 0) return { ok: false, error: 'Type at least one learner code.' };
  if (codes.length > MAX_BATCH) return { ok: false, error: `At most ${MAX_BATCH} at a time.` };
  const bad = codes.find((c) => !LEARNER_CODE_RE.test(c));
  if (bad) return { ok: false, error: `"${bad}": 3 to 16 letters, digits or hyphens.` };
  const dup = codes.find((c, i) => codes.indexOf(c) !== i);
  if (dup) return { ok: false, error: `${dup} is listed twice.` };
  return { ok: true, value: codes };
}

export function checkEmail(raw: string): Checked<string> {
  const v = raw.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254
    ? { ok: true, value: v }
    : { ok: false, error: 'Enter a valid email address.' };
}

export function checkPassword(raw: string): Checked<string> {
  return raw.length >= 8 && raw.length <= 72
    ? { ok: true, value: raw }
    : { ok: false, error: 'Password: 8 to 72 characters.' };
}

export function checkClassName(raw: string): Checked<string> {
  const v = raw.trim().replace(/\s+/g, ' ');
  return v.length >= 1 && v.length <= 80
    ? { ok: true, value: v }
    : { ok: false, error: 'Class name: 1 to 80 characters.' };
}

/** Optional school year, "2026-2027" with consecutive years. Empty means none. */
export function checkSchoolYear(raw: string): Checked<string | null> {
  const v = raw.trim();
  if (!v) return { ok: true, value: null };
  const m = /^(\d{4})-(\d{4})$/.exec(v);
  return m && Number(m[2]) === Number(m[1]) + 1
    ? { ok: true, value: v }
    : { ok: false, error: 'School year like 2026-2027, or leave it empty.' };
}
