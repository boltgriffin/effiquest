import { createContext, useContext } from 'react';

/**
 * True when a lab scene is drawn on the welcome screen's showcase platform instead of in its own
 * lab canvas. The machine itself is drawn exactly as in the lab; only what belongs to a single
 * lab view is left out: its own floor and lights (LabStage), floating labels (SceneLabel) and
 * camera controls (LabOrbitControls). The showcase supplies one shared stage instead.
 */
export const ShowcaseContext = createContext(false);

export function useShowcase(): boolean {
  return useContext(ShowcaseContext);
}
