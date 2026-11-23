import { describe, expect, it } from 'vitest';
import { DRAWING, pulleyLayout } from './layout';
import { PULLEY_GEOMETRY } from './params';
import { canPause, canReplay, canResume, INITIAL_PLAYBACK, playback } from '../shared/playback';

describe('playback state machine', () => {
  const started = playback(INITIAL_PLAYBACK, { type: 'START', durationS: 5 });

  it('starts running from t = 0', () => {
    expect(started).toMatchObject({ status: 'running', elapsedS: 0, durationS: 5 });
    expect(canPause(started)).toBe(true);
  });

  it('pauses, ignores ticks while paused, and resumes where it stopped', () => {
    const t1 = playback(started, { type: 'TICK', dtS: 1.5 });
    const paused = playback(t1, { type: 'PAUSE' });
    expect(paused.status).toBe('paused');
    expect(canResume(paused)).toBe(true);
    expect(playback(paused, { type: 'TICK', dtS: 2 }).elapsedS).toBe(1.5);
    const resumed = playback(paused, { type: 'RESUME' });
    expect(resumed).toMatchObject({ status: 'running', elapsedS: 1.5 });
  });

  it('finishes exactly at the end and counts the completion', () => {
    const done = playback(started, { type: 'TICK', dtS: 99 });
    expect(done).toMatchObject({ status: 'finished', elapsedS: 5, completions: 1 });
    expect(canReplay(done)).toBe(true);
  });

  it('replays from the start and counts a second completion', () => {
    const done = playback(started, { type: 'TICK', dtS: 5 });
    const again = playback(done, { type: 'REPLAY' });
    expect(again).toMatchObject({ status: 'running', elapsedS: 0 });
    expect(playback(again, { type: 'TICK', dtS: 5 }).completions).toBe(2);
  });

  it('skips to the end (reduced motion) from running or paused', () => {
    expect(playback(started, { type: 'SKIP_TO_END' })).toMatchObject({
      status: 'finished',
      elapsedS: 5,
    });
  });

  it('reset restores the initial state from any state', () => {
    for (const s of [
      started,
      playback(started, { type: 'PAUSE' }),
      playback(started, { type: 'TICK', dtS: 9 }),
    ]) {
      expect(playback(s, { type: 'RESET' })).toEqual(INITIAL_PLAYBACK);
    }
  });

  it('ignores impossible transitions', () => {
    expect(playback(INITIAL_PLAYBACK, { type: 'PAUSE' })).toBe(INITIAL_PLAYBACK);
    expect(playback(INITIAL_PLAYBACK, { type: 'RESUME' })).toBe(INITIAL_PLAYBACK);
    expect(playback(INITIAL_PLAYBACK, { type: 'REPLAY' })).toBe(INITIAL_PLAYBACK);
    expect(playback(INITIAL_PLAYBACK, { type: 'TICK', dtS: 1 })).toBe(INITIAL_PLAYBACK);
    expect(playback(INITIAL_PLAYBACK, { type: 'START', durationS: 0 })).toBe(INITIAL_PLAYBACK);
    expect(playback(started, { type: 'TICK', dtS: -1 })).toBe(started);
  });
});

describe('pulley layout (reeving)', () => {
  it.each([
    [1, 1, 0, 'block'],
    [2, 1, 1, 'ceiling'],
    [3, 2, 1, 'block'],
    [4, 2, 2, 'ceiling'],
  ] as const)('n = %i: %i fixed, %i movable, dead end on the %s', (n, fixed, movable, deadEnd) => {
    const l = pulleyLayout(n);
    expect(l.segmentXs).toHaveLength(n);
    expect(l.sheaves.filter((s) => s.kind === 'fixed')).toHaveLength(fixed);
    expect(l.sheaves.filter((s) => s.kind === 'movable')).toHaveLength(movable);
    expect(l.sheaves).toHaveLength(n); // same pulley count as the physics model
    expect(l.deadEnd).toBe(deadEnd);
    expect(l.sheaves.at(-1)?.kind).toBe('fixed'); // the hauling line leaves over a fixed pulley
  });
});

describe('drawing scale', () => {
  it('keeps the effort end (scale + arrow) above the floor for the longest pull, 4 × 1 m', () => {
    const scaleAndArrow = 52;
    const lowest =
      DRAWING.effortStartY + 4 * PULLEY_GEOMETRY.liftM * DRAWING.pxPerM + scaleAndArrow;
    expect(lowest).toBeLessThanOrEqual(DRAWING.floorY);
  });
});
