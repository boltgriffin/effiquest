import { useState } from 'react';
import { SuccessState } from '@/components/StatePanels';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Panel } from '@/components/ui/Panel';
import { Readout } from '@/components/ui/Readout';
import { EnergyFlowBar } from '../EnergyFlowBar';
import { sameParams, type LiveReading } from './measurement';
import type { PlaybackState } from './playback';
import type { LabParams, MachineDefinition } from './types';
import type { LoadedRun } from './useMachineRun';

interface Props<P extends LabParams> {
  def: MachineDefinition<P>;
  state: PlaybackState;
  run: LoadedRun<P> | null;
  live: LiveReading | null;
  params: P;
  onRecord: () => Promise<void>;
}

/**
 * Live measurement panel, identical in every lab. Instruments (scale, rulers, work so far)
 * update during the run; AMA, the ideal ratio and efficiency appear once the run is complete,
 * because they compare the whole movement. Nothing is shown before it has been measured.
 */
export function MeasurementsPanel<P extends LabParams>({
  def,
  state,
  run,
  live,
  params,
  onRecord,
}: Props<P>) {
  const [saved, setSaved] = useState<{
    for: LoadedRun<P> | null;
    state: 'idle' | 'saving' | 'saved' | 'error';
  }>({
    for: null,
    state: 'idle',
  });
  const finished = state.status === 'finished' && run !== null;
  const m = finished ? run.measurement : null;
  const stale = run !== null && !sameParams(run.params, params);
  // A recorded trial only counts for the unchanged set-up.
  const recorded = saved.state === 'saved' && saved.for === run && !stale;
  const v = (x: number | undefined | null) =>
    x === undefined || x === null || !Number.isFinite(x) ? null : x;
  const calc = (r: { ok: boolean; value?: number } | undefined) => (r && r.ok ? v(r.value) : null);
  // As many decimals as the ruler resolves: 1 cm → 2, 1 mm → 3, 0.1 mm → 4.
  const digits = Math.max(2, Math.round(-Math.log10(def.rulerResolutionM)));

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
      labelledBy={`${def.id}-measurements`}
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
            These numbers belong to the previous set-up. Press Start to measure the new one.
          </Callout>
        ) : null}
        {m && !m.check.valid ? (
          <Callout tone="danger" role="alert" title="Measurement error">
            The energy in this run does not add up, so no efficiency is shown.
          </Callout>
        ) : null}

        <div className="grid grid-cols-2 gap-x-6 border-y border-rule sm:grid-cols-3 [&>*]:border-b [&>*]:border-rule">
          <Readout
            symbol={def.outputForce?.symbol ?? 'W'}
            label={def.outputForce?.label ?? 'Load weight'}
            value={v(run?.measurement.loadWeightN)}
            unit="N"
            digits={1}
            tone="output"
            definition={def.outputForce?.definition ?? 'W = m × g, with g = 9.81 m/s².'}
          />
          <Readout
            symbol={
              <>
                F<sub>in</sub>
              </>
            }
            label={m ? 'Input force (steady)' : 'Input force (scale)'}
            value={v(m ? m.inputForceN : live?.inputForceN)}
            unit="N"
            digits={1}
            tone="input"
            definition="Spring-scale reading on the effort. It is higher while speeding up, lower while slowing down and steady in between; the results use the steady reading."
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
            definition="Force on the load while it rises at steady speed (equal to its weight)."
          />
          <Readout
            symbol={
              <>
                d<sub>in</sub>
              </>
            }
            label={def.labels.inputDistance}
            value={v(m ? m.inputDistanceM : live?.inputDistanceM)}
            unit="m"
            digits={digits}
            tone="input"
          />
          <Readout
            symbol={
              <>
                d<sub>out</sub>
              </>
            }
            label={def.labels.outputDistance}
            value={v(m ? m.outputDistanceM : live?.outputDistanceM)}
            unit="m"
            digits={digits}
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
            definition="Work done by the effort so far."
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
            label="Actual mech. advantage"
            value={calc(m?.ama)}
            unit=""
            definition="F_out ÷ F_in, from the steady reading. Includes the effect of friction."
          />
          <Readout
            symbol="IMA"
            label="Ideal mech. advantage"
            value={calc(m?.vr)}
            unit=""
            definition={`d_in ÷ d_out (${def.labels.idealMA}). Geometry only: friction does not change it.`}
          />
        </div>
        <Readout
          symbol="η"
          label="Efficiency"
          value={m && m.check.valid ? calc(m.eta) : null}
          unit="%"
          digits={1}
          size="lg"
          definition="W_out ÷ W_in × 100% over the whole run. Measured, never set."
        />

        {m && run && def.extraReadouts ? (
          <div className="grid grid-cols-2 gap-x-6 border-y border-rule sm:grid-cols-3 [&>*]:border-b [&>*]:border-rule">
            {def.extraReadouts(run.params, run.result).map((x) => (
              <Readout
                key={x.id}
                symbol={x.symbol}
                label={x.ideal ? `${x.label} (ideal)` : x.label}
                value={v(x.value)}
                unit={x.unit}
                digits={x.digits}
                definition={x.definition}
              />
            ))}
          </div>
        ) : null}

        {m && run && def.resultNote
          ? (() => {
              const note = def.resultNote(run.params, run.result);
              return note ? <Callout tone="info">{note}</Callout> : null;
            })()
          : null}

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
            Press Start. The readings update as the machine moves.
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
