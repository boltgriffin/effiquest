/**
 * Small swing of a load hanging on a rope, as a damped pendulum (θ'' = −(g/ℓ)θ − cθ'). Visual
 * only. It is set going when the load leaves the floor (the hook is never exactly above its
 * centre of mass) and dies away like a real sack or bucket on a short rope.
 */
export interface SwingState {
  angle: number;
  vel: number;
  prevFraction: number;
}

export const newSwing = (): SwingState => ({ angle: 0, vel: 0, prevFraction: 0 });

/** Advances the swing; returns true while it still needs frames. */
export function stepSwing(
  s: SwingState,
  dt: number,
  fraction: number,
  lengthM: number,
  enabled: boolean,
): boolean {
  if (!enabled) {
    s.angle = s.vel = 0;
    s.prevFraction = fraction;
    return false;
  }
  if (s.prevFraction === 0 && fraction > 0) s.vel = 0.35; // lift-off
  s.prevFraction = fraction;
  if (fraction === 0) {
    s.angle = s.vel = 0;
    return false;
  }
  const steps = 4;
  const h = Math.min(dt, 1 / 30) / steps;
  for (let k = 0; k < steps; k++) {
    const acc = -(9.81 / Math.max(lengthM, 0.05)) * s.angle - 2.2 * s.vel;
    s.vel += acc * h;
    s.angle += s.vel * h;
  }
  const still = Math.abs(s.angle) + Math.abs(s.vel) < 1e-3;
  if (still) s.angle = s.vel = 0;
  return !still;
}
