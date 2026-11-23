import { BackendError, getBackend, toBackendError, unwrap } from './client';
import { learnerLoginId } from '../../../supabase/functions/_shared/learnerAccounts';
import { checkEmail, checkJoinCode, checkLearnerCode, checkPassword, checkPin } from './validation';

/** Who is signed in to the online class on this device (never includes tokens). */
export interface CloudUser {
  id: string;
  anonymous: boolean;
  roles: Array<'learner' | 'teacher'>;
}

/** The current user and their roles as stored on the server (never trusted from the client). */
export async function currentUser(): Promise<CloudUser | null> {
  const sb = await getBackend();
  const { data, error } = await sb.auth.getSession();
  if (error) throw toBackendError(error);
  const user = data.session?.user;
  if (!user) return null;
  const roles = unwrap(await sb.from('user_roles').select('role').eq('profile_id', user.id));
  return { id: user.id, anonymous: user.is_anonymous ?? false, roles: roles.map((r) => r.role) };
}

/** Calls `listener` after sign-in, sign-out and token refresh. Returns an unsubscribe function. */
export async function onAuthChange(listener: () => void): Promise<() => void> {
  const sb = await getBackend();
  const { data } = sb.auth.onAuthStateChange(() => listener());
  return () => data.subscription.unsubscribe();
}

/** Teachers sign in with the email and password the administrator set up. */
export async function signInTeacher(email: string, password: string): Promise<void> {
  const e = checkEmail(email);
  if (!e.ok) throw new BackendError('invalid', e.error);
  const p = checkPassword(password);
  if (!p.ok) throw new BackendError('invalid', p.error);
  const sb = await getBackend();
  const { error } = await sb.auth.signInWithPassword({ email: e.value, password: p.value });
  if (error) throw new BackendError('auth');
}

/**
 * Learners sign in with the class code, their learner code and the PIN from the teacher's slip
 * (decision D-20). No email or name: the login id is derived from the two codes.
 */
export async function signInLearner(
  joinCode: string,
  learnerCode: string,
  pin: string,
): Promise<void> {
  const j = checkJoinCode(joinCode);
  if (!j.ok) throw new BackendError('invalid', j.error);
  const c = checkLearnerCode(learnerCode);
  if (!c.ok) throw new BackendError('invalid', c.error);
  const p = checkPin(pin);
  if (!p.ok) throw new BackendError('invalid', p.error);
  const sb = await getBackend();
  const { error } = await sb.auth.signInWithPassword({
    email: learnerLoginId(j.value, c.value),
    password: p.value,
  });
  if (error) {
    throw new BackendError(
      'auth',
      'Sign-in failed. Check the class code, your learner code and your PIN.',
    );
  }
}

/** Signs out on this device only. Data saved on the device stays. */
export async function signOut(): Promise<void> {
  const sb = await getBackend();
  const { error } = await sb.auth.signOut({ scope: 'local' });
  if (error) throw toBackendError(error);
}
