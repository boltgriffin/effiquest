/**
 * Client-side input checks (pure). They give quick, clear messages; the database repeats every
 * check (constraints and SECURITY DEFINER functions), so nothing here is trusted for security.
 */
export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export function checkJoinCode(raw: string): Checked<string> {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '');
  return /^[A-F0-9]{8}$/.test(v)
    ? { ok: true, value: v }
    : { ok: false, error: 'Class code: 8 letters and digits, as given by your teacher.' };
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
