import { describe, expect, it } from 'vitest';
import { simulatePulleyLift } from '@/physics-core';
import { DRAWING, pulleyLayout } from './layout';
import { measurePulley, readingAt } from './measurement';
import { DEFAULT_PULLEY_PARAMS, PULLEY_GEOMETRY, samePulleyParams, toModel } from './params';
import { canPause, canReplay, canResume, INITIAL_PLAYBACK, playback } from './playback';

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

describe('pulley measurements', () => {
  const params = { ...DEFAULT_PULLEY_PARAMS, segments: 4 as const };
  const run = simulatePulleyLift(toModel(params), { loadSpeedMps: 0.2 });
  const m = measurePulley(params, run);

  it('reads the instruments: load weight, effort, distances', () => {
    expect(m.loadWeightN).toBe(98.1);
    expect(m.outputForceN).toBe(98.1);
    expect(m.outputDistanceM).toBe(PULLEY_GEOMETRY.liftM);
    expect(m.inputDistanceM).toBe(4);
  });

  it('VR is ideal and equals the segment count; AMA is lower than VR', () => {
    expect(m.vr.ok && m.vr.value).toBe(4);
    expect(m.vr.ok && m.vr.basis).toBe('ideal');
    expect(m.ama.ok && m.ama.value).toBeLessThan(4);
  });

  it('efficiency comes from work and agrees with AMA ÷ VR within reading resolution', () => {
    if (!m.eta.ok || !m.ama.ok || !m.vr.ok || !m.check.valid) throw new Error('invalid');
    expect(m.eta.basis).toBe('simulated');
    expect(m.eta.value).toBeCloseTo(m.check.efficiencyPercent, 9);
    expect(Math.abs((m.ama.value / m.vr.value) * 100 - m.eta.value)).toBeLessThan(0.3);
  });

  it('losses add up to input − useful work', () => {
    const lost = m.losses.reduce((a, l) => a + l.joules, 0);
    expect(lost).toBeCloseTo(m.inputWorkJ - m.outputWorkJ, 9);
  });

  it('live readings move from start to finish', () => {
    const start = readingAt(run, 1, 0);
    const end = readingAt(run, 1, run.durationS);
    expect(start).toMatchObject({ ropePulledM: 0, loadRiseM: 0, fraction: 0, inputWorkJ: 0 });
    expect(end.fraction).toBeCloseTo(1, 2);
    expect(end.inputWorkJ).toBeCloseTo(m.inputWorkJ, 9);
    const mid = readingAt(run, 1, run.durationS / 2);
    expect(mid.effortN).toBe(m.inputForceN); // steady part: scale reads the steady effort
    expect(mid.ropePulledM).toBeCloseTo(4 * mid.loadRiseM, 1);
  });

  it('compares settings', () => {
    expect(samePulleyParams(params, { ...params })).toBe(true);
    expect(samePulleyParams(params, { ...params, segments: 3 })).toBe(false);
  });
});
