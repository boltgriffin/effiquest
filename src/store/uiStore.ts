import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QualityTier = 'auto' | 'low' | 'high';
export type ThemePreference = 'system' | 'light' | 'dark';

interface UiState {
  /** 3D quality preference; the lab canvas maps it to pixel ratio (low-end devices, decision D-08). */
  quality: QualityTier;
  theme: ThemePreference;
  setQuality: (quality: QualityTier) => void;
  setTheme: (theme: ThemePreference) => void;
}

/** Per-viewer preferences only. Learner records belong in IndexedDB via services/storage. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      quality: 'auto',
      theme: 'system',
      setQuality: (quality) => set({ quality }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'effiquest-ui' },
  ),
);
