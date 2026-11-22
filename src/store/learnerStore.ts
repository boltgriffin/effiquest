import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Owner id used when no learner code has been entered on this device. */
export const GUEST_OWNER_ID = 'guest';

interface LearnerState {
  /**
   * Pseudonymous code given by the teacher (decision D-09: no real names). Records are stored under
   * this code, so a shared school PC can switch between learners without mixing their work.
   */
  learnerCode: string | null;
  /** Shows the teacher tools on this device. A convenience switch, NOT a security boundary. */
  teacherMode: boolean;
  setLearnerCode: (code: string | null) => void;
  setTeacherMode: (on: boolean) => void;
}

export const useLearnerStore = create<LearnerState>()(
  persist(
    (set) => ({
      learnerCode: null,
      teacherMode: false,
      setLearnerCode: (learnerCode) => set({ learnerCode }),
      setTeacherMode: (teacherMode) => set({ teacherMode }),
    }),
    { name: 'effiquest-learner' },
  ),
);

export function useOwnerId(): string {
  return useLearnerStore((s) => s.learnerCode) ?? GUEST_OWNER_ID;
}

/** Codes: 3-16 letters, digits or hyphens, stored upper-case. Returns null when invalid. */
export function normalizeLearnerCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9-]{3,16}$/.test(code) ? code : null;
}
