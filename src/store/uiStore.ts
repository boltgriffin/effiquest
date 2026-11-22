import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QualityTier = 'auto' | 'low' | 'high';
export type ThemePreference = 'system' | 'light' | 'dark';

interface UiState {
  /** 3D quality preference; the lab canvas maps it to pixel ratio (low-end devices, decision D-08). */
  quality: QualityTier;
  theme: ThemePreference;
  /** Whether the welcome screen has been dismissed on this device. */
  seenWelcome: boolean;
  setQuality: (quality: QualityTier) => void;
  setTheme: (theme: ThemePreference) => void;
  setSeenWelcome: (seen: boolean) => void;
}

/** Per-viewer preferences only. Learner records belong in IndexedDB via services/storage. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      quality: 'auto',
      theme: 'system',
      seenWelcome: false,
      setQuality: (quality) => set({ quality }),
      setTheme: (theme) => set({ theme }),
      setSeenWelcome: (seenWelcome) => set({ seenWelcome }),
    }),
    { name: 'effiquest-ui' },
  ),
);
