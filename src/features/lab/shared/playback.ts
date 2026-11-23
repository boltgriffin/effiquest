/**
 * Playback state machine for a precomputed run: start, pause, resume, finish, reset, replay.
 * Pure (no timers): the hook feeds it TICK events from requestAnimationFrame. Fully unit-tested.
 */
export type PlaybackStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface PlaybackState {
  status: PlaybackStatus;
  /** Seconds of the run already shown. */
  elapsedS: number;
  /** Length of the loaded run (s); 0 when nothing is loaded. */
  durationS: number;
  /** How many times the run has been played to the end (replays included). */
  completions: number;
}

export type PlaybackEvent =
  | { type: 'START'; durationS: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK'; dtS: number }
  | { type: 'SKIP_TO_END' }
  | { type: 'REPLAY' }
  | { type: 'RESET' };

export const INITIAL_PLAYBACK: PlaybackState = {
  status: 'idle',
  elapsedS: 0,
  durationS: 0,
  completions: 0,
};

export function playback(state: PlaybackState, event: PlaybackEvent): PlaybackState {
  switch (event.type) {
    case 'START':
      // A new run always begins at t = 0, whatever was happening before.
      if (!(event.durationS > 0)) return state;
      return { ...state, status: 'running', elapsedS: 0, durationS: event.durationS };
    case 'PAUSE':
      return state.status === 'running' ? { ...state, status: 'paused' } : state;
    case 'RESUME':
      return state.status === 'paused' ? { ...state, status: 'running' } : state;
    case 'TICK': {
      if (state.status !== 'running' || !(event.dtS > 0)) return state;
      const elapsedS = Math.min(state.durationS, state.elapsedS + event.dtS);
      return elapsedS >= state.durationS
        ? { ...state, status: 'finished', elapsedS, completions: state.completions + 1 }
        : { ...state, elapsedS };
    }
    case 'SKIP_TO_END':
      return state.status === 'running' || state.status === 'paused'
        ? {
            ...state,
            status: 'finished',
            elapsedS: state.durationS,
            completions: state.completions + 1,
          }
        : state;
    case 'REPLAY':
      return state.durationS > 0 && (state.status === 'finished' || state.status === 'paused')
        ? { ...state, status: 'running', elapsedS: 0 }
        : state;
    case 'RESET':
      return { ...INITIAL_PLAYBACK };
  }
}

export const canPause = (s: PlaybackState) => s.status === 'running';
export const canResume = (s: PlaybackState) => s.status === 'paused';
export const canReplay = (s: PlaybackState) =>
  s.durationS > 0 && (s.status === 'finished' || s.status === 'paused');
