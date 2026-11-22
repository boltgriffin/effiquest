/**
 * Per-frame motion shared by the 2D diagram and the 3D scene without React re-renders
 * (CLAUDE.md rule: per-frame physics state never lives in React state).
 * `fraction` is the block's position along the ramp: 0 = bottom, 1 = top.
 */
export interface Motion {
  fraction: number;
  /** True while a run is animating; renderers poll every frame only then. */
  playing: boolean;
}

export function createMotion(fraction = 0): Motion {
  return { fraction, playing: false };
}

/** A ref to the shared motion. Read `.current` only in effects and animation frames. */
export type MotionRef = { readonly current: Motion };
