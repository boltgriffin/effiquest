import { Button } from '@/components/ui/Button';
import { formatQuantity } from '@/utils/format';
import { canPause, canReplay, canResume, type PlaybackState } from './playback';

interface SimControlsProps {
  state: PlaybackState;
  hasRun: boolean;
  status: { idle: string; running: string; finished: string };
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReplay: () => void;
  onReset: () => void;
}

/** Start · Pause/Resume · Replay · Reset, with a spoken status line. Same in every lab. */
export function SimControls({
  state,
  hasRun,
  status,
  onStart,
  onPause,
  onResume,
  onReplay,
  onReset,
}: SimControlsProps) {
  const text = state.status === 'paused' ? 'Paused.' : status[state.status];
  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label="Simulation controls" className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon="play"
          onClick={onStart}
          disabled={state.status === 'running'}
        >
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
        {text}
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
