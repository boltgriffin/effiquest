import { useState } from 'react';
import { SuccessState } from '@/components/StatePanels';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Panel } from '@/components/ui/Panel';
import { Readout } from '@/components/ui/Readout';
import { EnergyFlowBar } from '../EnergyFlowBar';
import type { LiveReading } from './measurement';
import { samePulleyParams, type PulleyLabParams } from './params';
import type { PlaybackState } from './playback';
import type { LoadedRun } from './usePulleyRun';

interface Props {
  state: PlaybackState;
  run: LoadedRun | null;
  live: LiveReading | null;
  params: PulleyLabParams;
  onRecord: () => Promise<void>;
}

/**
 * Live measurement panel. Instruments (scale, rulers, work so far) update during the run;
 * mechanical advantage, velocity ratio and efficiency are shown once the lift is complete,
 * because they compare the whole movement.
 */
export function PulleyMeasurements({ state, run, live, params, onRecord }: Props) {
  const [saved, setSaved] = useState<{
    for: LoadedRun | null;
    state: 'idle' | 'saving' | 'saved' | 'error';
  }>({
    for: null,
    state: 'idle',
  });
  const finished = state.status === 'finished' && run !== null;
  const m = finished ? run.measurement : null;
  const stale = run !== null && !samePulleyParams(run.params, params);
  // A recorded trial only counts for the unchanged set-up.
  const recorded = saved.state === 'saved' && saved.for === run && !stale;
  const v = (x: number | undefined | null) =>
    x === undefined || x === null || !Number.isFinite(x) ? null : x;
  const calc = (r: { ok: boolean; value?: number } | undefined) => (r && r.ok ? v(r.value) : null);

  const record = async () => {
    setSaved({ for: run, state: 'saving' });
    try {
      await onRecord();
      setSaved({ for: run, state: 'saved' });
    } catch {
      setSaved({ for: run, state: 'error' });
    }
  };

  return (
    <Panel
      eyebrow={state.status === 'running' ? 'Live' : 'Results'}
      title="Measurements"
      labelledBy="pulley-measurements"
      actions={
        <Button
          size="sm"
          icon="record"
          onClick={() => void record()}
          disabled={!m || stale || !m.check.valid || recorded || saved.state === 'saving'}
        >
          {recorded ? 'Trial recorded' : 'Record trial'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {stale ? (
          <Callout tone="warning" role="status" title="You changed the set-up after this run">
            These numbers are for {run.params.segments} segment(s), {run.params.loadMassKg} kg.
            Press Start to measure the new set-up.
          </Callout>
        ) : null}
        {m && !m.check.valid ? (
          <Callout tone="danger" role="alert" title="Measurement error">
            The energy in this run does not add up, so no efficiency is shown.
          </Callout>
        ) : null}

        <div className="grid grid-cols-2 gap-x-6 border-y border-rule sm:grid-cols-3 [&>*]:border-b [&>*]:border-rule">
          <Readout
            symbol="W"
            label="Load weight"
            value={v(run?.measurement.loadWeightN)}
            unit="N"
            digits={1}
            tone="output"
            definition="W = m × g, with g = 9.81 m/s²."
          />
          <Readout
            symbol={
              <>
                F<sub>in</sub>
              </>
            }
            label={m ? 'Input force (steady)' : 'Input force (scale)'}
            // During the run: the live scale. After it: the steady reading the results use
            // (the scale dips while the pull slows to a stop at the end).
            value={v(m ? m.inputForceN : live?.effortN)}
            unit="N"
            digits={1}
            tone="input"
            definition="Spring-scale reading on the rope you pull. It is higher while speeding up, lower while slowing down, and steady in between; the results use the steady reading."
          />
          <Readout
            symbol={
              <>
                F<sub>out</sub>
              </>
            }
            label="Output force"
            value={v(run?.measurement.outputForceN)}
            unit="N"
            digits={1}
            tone="output"
            definition="Force the machine exerts on the load while lifting it at steady speed (equal to its weight)."
          />
          <Readout
            symbol={
              <>
                d<sub>in</sub>
              </>
            }
            label="Rope pulled"
            value={v(live?.ropePulledM)}
            unit="m"
            tone="input"
          />
          <Readout
            symbol={
              <>
                d<sub>out</sub>
              </>
            }
            label="Load raised"
            value={v(live?.loadRiseM)}
            unit="m"
            tone="output"
          />
          <Readout
            symbol={
              <>
                W<sub>in</sub>
              </>
            }
            label="Input work"
            value={v(live?.inputWorkJ)}
            unit="J"
            tone="input"
            definition="Work done by your pull so far."
          />
          <Readout
            symbol={
              <>
                W<sub>out</sub>
              </>
            }
            label="Useful work"
            value={v(live?.usefulWorkJ)}
            unit="J"
            tone="output"
            definition="Potential energy the load has gained so far."
          />
          <Readout
            symbol="AMA"
            label="Mechanical advantage"
            value={calc(m?.ama)}
            unit=""
            definition="F_out ÷ F_in, using the steady scale reading."
          />
          <Readout
            symbol="VR"
            label="Velocity ratio"
            value={calc(m?.vr)}
            unit=""
            definition="d_in ÷ d_out. Ideal value: friction does not change it."
          />
        </div>
        <Readout
          symbol="η"
          label="Efficiency"
          value={m && m.check.valid ? calc(m.eta) : null}
          unit="%"
          digits={1}
          size="lg"
          definition="W_out ÷ W_in × 100% over the whole lift. Measured, never set."
        />

        {m && m.check.valid ? (
          <>
            <EnergyFlowBar inputJ={m.inputWorkJ} usefulJ={m.outputWorkJ} losses={m.losses} />
            {m.eta.ok ? (
              <p className="text-sm text-muted">
                <span className="num block text-ink">{m.eta.substitution}</span>
                {m.eta.explanation}
              </p>
            ) : null}
          </>
        ) : state.status === 'idle' ? (
          <p className="text-sm text-muted">
            Press Start. The readings update as the rope is pulled.
          </p>
        ) : null}

        <div aria-live="polite">
          {finished && !stale && !recorded ? (
            <p className="text-sm font-medium text-brand">
              Run complete. Record this trial so you can compare set-ups.
            </p>
          ) : null}
          {recorded ? <SuccessState title="Trial recorded on this device" /> : null}
          {saved.state === 'error' && saved.for === run ? (
            <Callout tone="danger" role="alert" title="Could not record the trial">
              This browser is blocking local storage.
            </Callout>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
