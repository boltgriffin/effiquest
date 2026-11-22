import { Button } from '@/components/ui/Button';
import { formatQuantity } from '@/utils/format';
import { canPause, canReplay, canResume, type PlaybackState } from './playback';

interface PulleyControlsProps {
  state: PlaybackState;
  hasRun: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReplay: () => void;
  onReset: () => void;
}

const statusText: Record<PlaybackState['status'], string> = {
  idle: 'Ready. The load is on the floor.',
  running: 'Pulling the rope at a steady speed…',
  paused: 'Paused.',
  finished: 'Run complete. The load has risen 1 m.',
};

/** Start · Pause/Resume · Replay · Reset, with a spoken status line. */
export function PulleyControls({
  state,
  hasRun,
  onStart,
  onPause,
  onResume,
  onReplay,
  onReset,
}: PulleyControlsProps) {
  const running = state.status === 'running';
  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label="Simulation controls" className="flex flex-wrap gap-2">
        <Button variant="primary" icon="play" onClick={onStart} disabled={running}>
          {hasRun ? 'Start new run' : 'Start'}
        </Button>
        {canResume(state) ? (
          <Button icon="play" onClick={onResume}>
            Resume
          </Button>
        ) : (
          <Button icon="pause" onClick={onPause} disabled={!canPause(state)}>
            Pause
          </Button>
        )}
        <Button icon="replay" onClick={onReplay} disabled={!canReplay(state)}>
          Replay
        </Button>
        <Button
          icon="reset"
          variant="ghost"
          onClick={onReset}
          disabled={state.status === 'idle' && !hasRun}
        >
          Reset
        </Button>
      </div>
      <p role="status" aria-live="polite" className="num text-sm text-muted">
        {statusText[state.status]}
        {state.durationS > 0 && state.status !== 'idle' ? (
          <>
            {' '}
            ({formatQuantity(state.elapsedS, 1)} s of {formatQuantity(state.durationS, 1)} s)
          </>
        ) : null}
      </p>
    </div>
  );
}
