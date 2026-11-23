/**
 * Single place that reads `import.meta.env`. Only VITE_-prefixed variables reach the browser,
 * so nothing here may be a secret. See `.env.example`.
 *
 * Supabase (Milestone 11): the project URL and the ANON (public) key only. The anon key is safe
 * in the browser because every table is protected by Row Level Security. A service-role key must
 * never be put in any VITE_ variable.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

/** Refuses obviously wrong values instead of failing later with a confusing network error. */
function validSupabaseConfig(url: string, key: string): boolean {
  if (!url || !key) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
      return false;
    }
  } catch {
    return false;
  }
  // A service-role JWT must never ship to the browser: refuse to use it.
  return !looksLikeServiceRole(key);
}

export function looksLikeServiceRole(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  const payload = key.split('.')[1];
  if (!payload) return false;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: string;
    };
    return json.role === 'service_role';
  } catch {
    return false;
  }
}

export const env = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  appEnv: import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE,
  supabase: validSupabaseConfig(supabaseUrl, supabaseAnonKey)
    ? { url: supabaseUrl, anonKey: supabaseAnonKey }
    : null,
  /** Set but rejected (e.g. a service-role key): shown to the teacher as a configuration error. */
  supabaseMisconfigured:
    Boolean(supabaseUrl || supabaseAnonKey) && !validSupabaseConfig(supabaseUrl, supabaseAnonKey),
} as const;
