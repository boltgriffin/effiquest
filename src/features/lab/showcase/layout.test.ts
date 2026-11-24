import { describe, expect, it } from 'vitest';
import { loopOffset, loopStep, nearby, nearestAngle, placementFor, TRACK_RADIUS } from './layout';

describe('showcase layout', () => {
  it('places items in a loop relative to the selection', () => {
    expect(loopOffset(0, 0, 9)).toBe(0);
    expect(loopOffset(1, 0, 9)).toBe(1);
    expect(loopOffset(8, 0, 9)).toBe(-1);
    expect(loopOffset(4, 0, 9)).toBe(4);
    expect(loopOffset(5, 0, 9)).toBe(-4);
    // every offset from -4 to 4 is used exactly once
    const offsets = Array.from({ length: 9 }, (_, i) => loopOffset(i, 3, 9)).sort((a, b) => a - b);
    expect(offsets).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
  });

  it('steps the short way round, so the ninth loops back to the first', () => {
    expect(loopStep(8, 0, 9)).toBe(1);
    expect(loopStep(0, 8, 9)).toBe(-1);
    expect(loopStep(2, 5, 9)).toBe(3);
  });

  it('puts the selection on the centre and the others on the track, next to the right', () => {
    expect(placementFor(0, 9)).toMatchObject({ radius: 0, scale: 1, angle: 0 });
    const next = placementFor(1, 9);
    const prev = placementFor(-1, 9);
    expect(next.radius).toBe(TRACK_RADIUS);
    expect(next.angle).toBeGreaterThan(0);
    expect(prev.angle).toBeCloseTo(-next.angle);
    expect(next.scale).toBeLessThan(1);
    // further places are further round, and never reach the back (π)
    expect(placementFor(4, 9).angle).toBeGreaterThan(placementFor(3, 9).angle);
    expect(placementFor(4, 9).angle).toBeLessThan(Math.PI);
  });

  it('turns the short way round', () => {
    expect(nearestAngle(0, 0.5)).toBeCloseTo(0.5);
    expect(nearestAngle(-2.6, 2.6)).toBeCloseTo(2.6 - 2 * Math.PI);
    expect(nearestAngle(6.4, 0.2)).toBeCloseTo(0.2 + 2 * Math.PI);
  });

  it('builds only the selected model and its neighbours', () => {
    expect(nearby(0, 9).sort((a, b) => a - b)).toEqual([0, 1, 2, 7, 8]);
    expect(nearby(4, 9, 1).sort((a, b) => a - b)).toEqual([3, 4, 5]);
  });
});
