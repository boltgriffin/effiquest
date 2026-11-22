import { useCallback, useEffect, useRef, useState } from 'react';
import { simulatePulleyLift, validatePulley, type LiftResult } from '@/physics-core';
import { createMotion } from '../motion';
import { measurePulley, readingAt, type LiveReading, type PulleyMeasurement } from './measurement';
import { LOAD_SPEED_MPS, PULLEY_GEOMETRY, toModel, type PulleyLabParams } from './params';
import { INITIAL_PLAYBACK, playback, type PlaybackEvent, type PlaybackState } from './playback';

export interface LoadedRun {
  params: PulleyLabParams;
  result: LiftResult;
  measurement: PulleyMeasurement;
}

const LIVE_INTERVAL_MS = 100;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Drives a pulley run: the physics is computed once (deterministic), then played back.
 * - `motion` (ref) is updated every frame for the diagram and 3D scene (no re-renders).
 * - `live` readings update about 10 times a second for the measurement panel.
 * - `state` mirrors the pure playback state machine.
 */
export function usePulleyRun() {
  const motion = useRef(createMotion(0));
  const pb = useRef<PlaybackState>(INITIAL_PLAYBACK);
  const runRef = useRef<LoadedRun | null>(null);
  const frame = useRef(0);
  const lastFrame = useRef(0);
  const lastLive = useRef(0);

  const [state, setState] = useState<PlaybackState>(INITIAL_PLAYBACK);
  const [run, setRun] = useState<LoadedRun | null>(null);
  const [live, setLive] = useState<LiveReading | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const sync = useCallback((force = false) => {
    const r = runRef.current;
    const s = pb.current;
    if (r) {
      const reading = readingAt(r.result, PULLEY_GEOMETRY.liftM, s.elapsedS);
      motion.current.fraction = reading.fraction;
      const now = performance.now();
      if (force || now - lastLive.current >= LIVE_INTERVAL_MS) {
        lastLive.current = now;
        setLive(reading);
      }
    } else {
      motion.current.fraction = 0;
      setLive(null);
    }
    motion.current.playing = s.status === 'running';
  }, []);

  const dispatch = useCallback(
    (event: PlaybackEvent) => {
      const before = pb.current;
      const after = playback(before, event);
      pb.current = after;
      if (after !== before) {
        if (after.status !== before.status || event.type !== 'TICK') {
          setState(after);
          sync(true);
        } else {
          sync(false);
        }
      }
      return after;
    },
    [sync],
  );

  const play = useCallback(() => {
    cancelAnimationFrame(frame.current);
    if (prefersReducedMotion()) {
      dispatch({ type: 'SKIP_TO_END' });
      return;
    }
    lastFrame.current = performance.now();
    // Local recursive frame callback: advances the state machine by the real elapsed time.
    const tick = (now: number) => {
      const dtS = Math.min(0.1, (now - lastFrame.current) / 1000);
      lastFrame.current = now;
      const s = dispatch({ type: 'TICK', dtS });
      if (s.status === 'running') frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [dispatch]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const start = useCallback(
    (params: PulleyLabParams) => {
      const model = toModel(params);
      const valid = validatePulley(model);
      if (!valid.ok) {
        setErrors(valid.errors);
        return;
      }
      setErrors([]);
      const result = simulatePulleyLift(model, { loadSpeedMps: LOAD_SPEED_MPS });
      const loaded = { params, result, measurement: measurePulley(params, result) };
      runRef.current = loaded;
      setRun(loaded);
      dispatch({ type: 'START', durationS: result.durationS });
      play();
    },
    [dispatch, play],
  );

  const pause = useCallback(() => {
    cancelAnimationFrame(frame.current);
    dispatch({ type: 'PAUSE' });
  }, [dispatch]);

  const resume = useCallback(() => {
    if (pb.current.status !== 'paused') return;
    dispatch({ type: 'RESUME' });
    play();
  }, [dispatch, play]);

  const replay = useCallback(() => {
    const s = dispatch({ type: 'REPLAY' });
    if (s.status === 'running') play();
  }, [dispatch, play]);

  /** Back to the initial conditions: load on the floor, no run, readings cleared. */
  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current);
    runRef.current = null;
    setRun(null);
    setErrors([]);
    dispatch({ type: 'RESET' });
    sync(true);
  }, [dispatch, sync]);

  return { state, run, live, errors, motion, start, pause, resume, replay, reset };
}
