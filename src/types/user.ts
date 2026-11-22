/** Roles are data enforced by the backend (docs/DATABASE_PLAN.md 3.1); the UI only reflects them. */
export type UserRole = 'learner' | 'teacher' | 'admin';

export interface Profile {
  id: string;
  /** Pseudonymous code; real names/emails are not required for learners (decision D-09). */
  learnerCode: string;
  displayName: string;
  gradeLevel: number;
  locale: string;
  roles: UserRole[];
}
