import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Slider } from '@/components/ui/Slider';
import { DEFAULT_PULLEY_PARAMS, SEGMENT_NAMES, type PulleyLabParams } from './params';

interface PulleyVariablesProps {
  params: PulleyLabParams;
  onChange: (params: PulleyLabParams) => void;
  /** Settings are locked while a run is playing or paused. */
  locked: boolean;
}

const segmentOptions = ([1, 2, 3, 4] as const).map((n) => ({
  value: String(n) as '1' | '2' | '3' | '4',
  label: String(n),
}));

/** The variables a learner may change. Effort is NOT here: it is measured, never set. */
export function PulleyVariables({ params, onChange, locked }: PulleyVariablesProps) {
  const [message, setMessage] = useState<string | null>(null);

  const update = (next: PulleyLabParams, what: string) => {
    onChange(next);
    setMessage(`${what}. Press Start to measure this set-up.`);
  };

  return (
    <Panel eyebrow="Variables" title="Set up the pulley" bodyClassName="flex flex-col gap-5">
      {locked ? (
        <p className="text-sm text-muted">
          Settings are locked during a run. Wait for it to finish, or press Reset.
        </p>
      ) : null}
      <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-60">
        <div>
          <SegmentedControl
            legend="Supporting rope segments"
            value={String(params.segments) as '1' | '2' | '3' | '4'}
            options={segmentOptions}
            onChange={(v) => {
              const segments = Number(v) as PulleyLabParams['segments'];
              update(
                { ...params, segments },
                `${SEGMENT_NAMES[segments]}: velocity ratio ${segments}`,
              );
            }}
          />
          <p className="mt-1 text-sm text-muted">{SEGMENT_NAMES[params.segments]}</p>
        </div>
        <Slider
          label="Load mass"
          name="Load mass"
          symbol="m"
          value={params.loadMassKg}
          min={1}
          max={40}
          step={1}
          unit="kg"
          onChange={(loadMassKg) => update({ ...params, loadMassKg }, `Load mass ${loadMassKg} kg`)}
        />
        <Slider
          label="Movable block mass"
          name="Movable block mass"
          symbol={
            <>
              m<sub>b</sub>
            </>
          }
          value={params.blockMassKg}
          min={0}
          max={3}
          step={0.1}
          digits={1}
          unit="kg"
          onChange={(blockMassKg) =>
            update({ ...params, blockMassKg }, `Movable block mass ${blockMassKg.toFixed(1)} kg`)
          }
          hint={
            params.segments === 1
              ? 'A single fixed pulley has no movable block, so this has no effect.'
              : 'The movable pulleys rise with the load, so lifting them is extra work.'
          }
        />
        <Slider
          label="Bearing friction"
          name="Bearing friction coefficient"
          symbol={
            <>
              μ<sub>b</sub>
            </>
          }
          value={params.bearingFriction}
          min={0}
          max={0.3}
          step={0.01}
          digits={2}
          onChange={(bearingFriction) =>
            update({ ...params, bearingFriction }, `Bearing friction ${bearingFriction.toFixed(2)}`)
          }
          hint="Friction in each pulley's axle. 0 means perfectly smooth bearings."
        />
        <div>
          <Button
            size="sm"
            icon="reset"
            onClick={() => update(DEFAULT_PULLEY_PARAMS, 'Default settings restored')}
          >
            Restore default settings
          </Button>
        </div>
      </fieldset>
      <p aria-live="polite" className="text-sm text-brand">
        {message}
      </p>
    </Panel>
  );
}
