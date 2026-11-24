import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SessionState {
  /**
   * Whether this visit has gone past the welcome screen. Kept in sessionStorage (one browser tab):
   * every new visit (new tab or window, or launching the installed app) opens on the welcome
   * screen, while a reload keeps the learner where they were (owner request 2026-11-24, D-26).
   */
  enteredApp: boolean;
  enterApp: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      enteredApp: false,
      enterApp: () => set({ enteredApp: true }),
    }),
    {
      name: 'effiquest-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ enteredApp: s.enteredApp }),
    },
  ),
);
