import { useCallback, useEffect, useRef, useState } from 'react';
import type { MachineRun } from '@/physics-core';
import { createMotion } from '../motion';
import { measureRun, readingAt, type LiveReading, type Measurement } from './measurement';
import { INITIAL_PLAYBACK, playback, type PlaybackEvent, type PlaybackState } from './playback';
import type { LabParams, MachineDefinition } from './types';

export interface LoadedRun<P> {
  params: P;
  result: MachineRun;
  measurement: Measurement<P>;
}

const LIVE_INTERVAL_MS = 100;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Drives any machine's run: physics computed once (deterministic), then played back.
 * - `motion` (ref) updates every frame for the diagram and 3D scene (no re-renders).
 * - `live` readings update about 10 times a second.
 * - `state` mirrors the pure playback state machine (start, pause, resume, replay, reset).
 */
export function useMachineRun<P extends LabParams>(def: MachineDefinition<P>) {
  const motion = useRef(createMotion(0));
  const pb = useRef<PlaybackState>(INITIAL_PLAYBACK);
  const runRef = useRef<LoadedRun<P> | null>(null);
  const frame = useRef(0);
  const lastFrame = useRef(0);
  const lastLive = useRef(0);

  const [state, setState] = useState<PlaybackState>(INITIAL_PLAYBACK);
  const [run, setRun] = useState<LoadedRun<P> | null>(null);
  const [live, setLive] = useState<LiveReading | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const sync = useCallback(
    (force: boolean) => {
      const r = runRef.current;
      const s = pb.current;
      if (r) {
        const reading = readingAt(r.result, s.elapsedS, def.rulerResolutionM);
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
    },
    [def.rulerResolutionM],
  );

  const dispatch = useCallback(
    (event: PlaybackEvent) => {
      const before = pb.current;
      const after = playback(before, event);
      pb.current = after;
      if (after !== before) {
        const statusChanged = after.status !== before.status || event.type !== 'TICK';
        if (statusChanged) setState(after);
        sync(statusChanged);
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
    (params: P) => {
      const valid = def.validate(params);
      if (!valid.ok) {
        setErrors(valid.errors);
        return;
      }
      setErrors([]);
      const result = def.simulate(params);
      const loaded: LoadedRun<P> = {
        params,
        result,
        measurement: measureRun(params, result, def.loadMassKg(params), def.rulerResolutionM),
      };
      runRef.current = loaded;
      setRun(loaded);
      dispatch({ type: 'START', durationS: result.durationS });
      play();
    },
    [def, dispatch, play],
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

  /** Back to the initial conditions: load at rest at the start, no run, readings cleared. */
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
