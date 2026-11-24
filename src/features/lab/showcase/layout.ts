/**
 * Where each machine stands on the welcome showcase platform. Pure so it can be tested.
 *
 * The selected machine stands on the raised centre. The others wait on the circular track in
 * selection order: the next machine just to the right of the centre, the previous one just to the
 * left, and the furthest ones at the back. Choosing "next" moves every machine one place along the
 * track, so the carousel loops (from the ninth back to the first).
 */

/** Track radius (scene units). */
export const TRACK_RADIUS = 2.6;
/** Angle of the first place either side of the front (rad): leaves the front clear for the centre. */
const FIRST_ANGLE = (50 * Math.PI) / 180;

export interface Placement {
  /** Angle round the platform, 0 = front (towards the camera), positive = to the right. */
  angle: number;
  /** Distance from the centre. */
  radius: number;
  /** 1 on the centre, smaller on the track. */
  scale: number;
  /** Height of the stand top above the platform. */
  lift: number;
}

export const CENTRE_LIFT = 0.18;
export const TRACK_LIFT = 0.08;
export const TRACK_SCALE = 0.46;

/** Signed place of item `index` relative to `selected` in a loop of `count`: 0, ±1, ±2... */
export function loopOffset(index: number, selected: number, count: number): number {
  let d = (((index - selected) % count) + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

/** Signed step from `from` to `to` the short way round the loop (e.g. 9 → 1 is +1). */
export function loopStep(from: number, to: number, count: number): number {
  return loopOffset(to, from, count);
}

export function placementFor(offset: number, count: number): Placement {
  if (offset === 0) return { angle: 0, radius: 0, scale: 1, lift: CENTRE_LIFT };
  const half = Math.floor(count / 2);
  // Spread the remaining places evenly from FIRST_ANGLE to just short of the back.
  const span = Math.PI - FIRST_ANGLE - 0.25;
  const step = half > 1 ? span / (half - 1) : 0;
  const angle = Math.sign(offset) * (FIRST_ANGLE + (Math.abs(offset) - 1) * step);
  return { angle, radius: TRACK_RADIUS, scale: TRACK_SCALE, lift: TRACK_LIFT };
}

/** The angle equal to `target` (mod 2π) nearest to `current`, so moves go the short way round. */
export function nearestAngle(current: number, target: number): number {
  const twoPi = Math.PI * 2;
  return target + Math.round((current - target) / twoPi) * twoPi;
}

/** Labs whose 3D model is built: the selected one and up to `reach` places either side. */
export function nearby(selected: number, count: number, reach = 2): number[] {
  const out: number[] = [];
  for (let d = -reach; d <= reach; d += 1) out.push((((selected + d) % count) + count) % count);
  return [...new Set(out)];
}
