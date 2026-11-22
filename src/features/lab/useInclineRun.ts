import { useCallback, useEffect, useRef, useState } from 'react';
import { simulateInclinePull, validateIncline, type PullSample } from '@/physics-core';
import { measureIncline, type InclineMeasurement } from './measurement';
import { createMotion } from './motion';
import { PULL_SPEED_MPS, RAMP_LENGTH_M, type InclineParams } from './params';

export type RunState =
  | { status: 'idle' }
  | { status: 'running'; durationS: number }
  | { status: 'done'; measurement: InclineMeasurement }
  | { status: 'invalid'; errors: string[] };

function positionAt(samples: readonly PullSample[], tS: number): number {
  const last = samples[samples.length - 1];
  if (!last || tS >= last.tS) return last?.positionM ?? 0;
  // Samples are ~60 Hz; linear interpolation between neighbours.
  let i = 1;
  while (i < samples.length && (samples[i]?.tS ?? 0) < tS) i++;
  const a = samples[i - 1];
  const b = samples[i];
  if (!a || !b) return 0;
  const f = (tS - a.tS) / (b.tS - a.tS || 1);
  return a.positionM + f * (b.positionM - a.positionM);
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs the inclined-plane model and plays it back in real time. The physics is computed in one go
 * (deterministic, fixed step); playback only moves the shared `motion` object, so the diagram and
 * 3D view animate without React re-renders. With reduced motion the block jumps to the top.
 */
export function useInclineRun() {
  // Mutable motion read every frame by the renderers; only touched in callbacks and frames.
  const motion = useRef(createMotion(0));
  const [state, setState] = useState<RunState>({ status: 'idle' });
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const run = useCallback((params: InclineParams) => {
    cancelAnimationFrame(frame.current);
    const model = { ...params, lengthM: RAMP_LENGTH_M };
    const valid = validateIncline(model);
    if (!valid.ok) {
      setState({ status: 'invalid', errors: valid.errors });
      return;
    }
    const result = simulateInclinePull(model, { speedMps: PULL_SPEED_MPS });
    const measurement = measureIncline(params, result);
    const finish = () => {
      motion.current.fraction = 1;
      motion.current.playing = false;
      setState({ status: 'done', measurement });
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    motion.current.fraction = 0;
    motion.current.playing = true;
    setState({ status: 'running', durationS: result.durationS });
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      if (t >= result.durationS) {
        finish();
        return;
      }
      motion.current.fraction = positionAt(result.samples, t) / RAMP_LENGTH_M;
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current);
    motion.current.fraction = 0;
    motion.current.playing = false;
    setState({ status: 'idle' });
  }, []);

  return { state, motion, run, reset };
}
