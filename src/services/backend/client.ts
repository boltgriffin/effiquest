import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import type { Database } from './database.types';

export type Backend = SupabaseClient<Database>;

let client: Promise<Backend> | null = null;

/** True when a Supabase project is configured (anon key only). Otherwise the app is device-only. */
export const backendConfigured = (): boolean => env.supabase !== null;

/**
 * The single Supabase client, created on first use. supabase-js is loaded lazily, so devices
 * that never use the online class do not download it. Sessions persist in localStorage under
 * one key and refresh automatically; signOut() clears them.
 */
export function getBackend(): Promise<Backend> {
  const cfg = env.supabase;
  if (!cfg) return Promise.reject(new BackendError('not-configured'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient<Database>(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'effiquest-auth',
      },
    }),
  );
  return client;
}

export type BackendErrorKind =
  'not-configured' | 'offline' | 'not-signed-in' | 'forbidden' | 'invalid' | 'auth' | 'unknown';

const defaultMessages: Record<BackendErrorKind, string> = {
  'not-configured': 'The online class is not set up for this app.',
  offline: 'Cannot reach the class server. Your work is safe on this device; try again later.',
  'not-signed-in': 'Sign in first.',
  forbidden: 'You do not have access to that.',
  invalid: 'That was not accepted.',
  auth: 'Sign-in failed. Check the email and password.',
  unknown: 'Something went wrong with the class server. Try again later.',
};

/** Errors shown to people. Never contains tokens, keys or raw server details. */
export class BackendError extends Error {
  constructor(
    readonly kind: BackendErrorKind,
    message?: string,
  ) {
    super(message ?? defaultMessages[kind]);
    this.name = 'BackendError';
  }
}

/** Messages raised by our own SQL functions are written for learners and may be shown. */
const SAFE_SQLSTATES = new Set(['22023', 'P0001']);

/** Maps a supabase-js / PostgREST / fetch error to a BackendError with a safe message. */
export function toBackendError(error: unknown): BackendError {
  if (error instanceof BackendError) return error;
  const e = (error ?? {}) as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
    name?: unknown;
  };
  const code = typeof e.code === 'string' ? e.code : '';
  const message = typeof e.message === 'string' ? e.message : '';
  if (
    (typeof navigator !== 'undefined' && navigator.onLine === false) ||
    /Failed to fetch|NetworkError|fetch failed|Load failed/i.test(message)
  ) {
    return new BackendError('offline');
  }
  if (SAFE_SQLSTATES.has(code) && message) return new BackendError('invalid', message);
  if (code === '42501') {
    // Our functions raise 42501 with a readable message; RLS/permission errors get the default.
    return /row-level security|permission denied/i.test(message) || !message
      ? new BackendError('forbidden')
      : new BackendError('forbidden', message);
  }
  if (code === 'PGRST301' || e.status === 401) return new BackendError('not-signed-in');
  if (e.name === 'AuthApiError' || e.name === 'AuthError') return new BackendError('auth');
  return new BackendError('unknown');
}

/** Unwraps a supabase-js `{ data, error }` result, throwing a safe BackendError. */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw toBackendError(result.error);
  if (result.data === null) throw new BackendError('unknown');
  return result.data;
}
