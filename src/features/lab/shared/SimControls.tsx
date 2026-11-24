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
    <div className="@container flex flex-col gap-2">
      {/* Narrow (phones): Start spans the width, the other three share even columns beneath it.
          Sized by the panel's own width, so it also holds in the narrow desktop column. */}
      <div
        role="toolbar"
        aria-label="Simulation controls"
        className="grid grid-cols-2 gap-2 @min-[21rem]:grid-cols-3 @lg:flex @lg:flex-wrap"
      >
        <Button
          variant="primary"
          icon="play"
          onClick={onStart}
          disabled={state.status === 'running'}
          className="col-span-full"
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
          className="col-span-2 @min-[21rem]:col-span-1"
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
