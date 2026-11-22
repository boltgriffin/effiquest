/**
 * Geometry of the rope and pulleys for n supporting segments, shared by the 2D diagram and the
 * 3D scene so both always show the same arrangement. Pure; units are abstract (the SVG uses
 * them as px, the 3D scene scales them).
 *
 * Reeving: n pulleys in total (matches the physics model). Fixed pulleys = ceil(n/2), movable
 * = floor(n/2). The rope's dead end is tied to the ceiling when n is even and to the movable
 * block (or the load, for n = 1) when n is odd. Consecutive supporting segments are joined
 * alternately under a movable pulley and over a fixed pulley; the last segment passes over a
 * fixed pulley to the hauling (effort) end.
 */
export interface Sheave {
  x: number;
  /** 'fixed' hangs from the ceiling; 'movable' rises with the load. */
  kind: 'fixed' | 'movable';
}

export interface PulleyLayout {
  /** x of each supporting segment, dead end first. */
  segmentXs: number[];
  /** x of the effort (hauling) rope. */
  effortX: number;
  sheaves: Sheave[];
  /** Where the dead end is tied. */
  deadEnd: 'ceiling' | 'block';
  /** Sheave radius in layout units (half the segment spacing). */
  radius: number;
}

export const SPACING = 36;

export function pulleyLayout(n: number, x0 = 140): PulleyLayout {
  const segmentXs = Array.from({ length: n }, (_, i) => x0 + i * SPACING);
  const effortX = x0 + n * SPACING;
  const deadEnd = n % 2 === 0 ? 'ceiling' : 'block';
  const sheaves: Sheave[] = [];
  // Joins between segment i and i+1. With the dead end at the ceiling, segment 0 runs down, so
  // the first join is underneath (movable); otherwise segment 0 runs up and joins over the top.
  for (let i = 0; i < n - 1; i++) {
    const bottom = deadEnd === 'ceiling' ? i % 2 === 0 : i % 2 === 1;
    sheaves.push({ x: x0 + (i + 0.5) * SPACING, kind: bottom ? 'movable' : 'fixed' });
  }
  // The last segment always ends at the top and goes over a fixed pulley to the effort rope.
  sheaves.push({ x: x0 + (n - 0.5) * SPACING, kind: 'fixed' });
  return { segmentXs, effortX, sheaves, deadEnd, radius: SPACING / 2 };
}

/**
 * Shared drawing scale for the 2D diagram and the 3D scene (layout units; y grows downward).
 * Chosen so the effort end stays above the floor for the longest pull (4 segments × 1 m).
 */
export const DRAWING = {
  /** 1 m of travel in layout units, for both load and rope, so the ratio is true. */
  pxPerM: 50,
  ceilingY: 34,
  fixedY: 78,
  /** Movable pulley centre (or the hook, n = 1) with the load on the floor. */
  restY: 250,
  floorY: 352,
  loadH: 46,
  /** Top of the spring scale on the effort rope before the pull. */
  effortStartY: 100,
} as const;
