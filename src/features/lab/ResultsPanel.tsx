import { useState } from 'react';
import { EmptyState, SuccessState } from '@/components/StatePanels';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Panel } from '@/components/ui/Panel';
import { Readout } from '@/components/ui/Readout';
import { formatQuantity } from '@/utils/format';
import { EnergyFlowBar } from './EnergyFlowBar';
import { sameParams } from './measurement';
import { RAMP_LENGTH_M, type InclineParams } from './params';
import type { RunState } from './useInclineRun';
import { useTrials } from './useTrials';

const ledgerError: Record<string, string> = {
  'no-input-work': 'No work was done on the block.',
  'energy-not-conserved': 'The energy does not add up for this run.',
  'exceeds-100': 'The output work came out larger than the input work.',
  'negative-loss': 'A loss came out negative.',
};

interface ResultsPanelProps {
  run: RunState;
  params: InclineParams;
}

/** Results and measurements from the last run, plus the learner's recorded trials. */
export function ResultsPanel({ run, params }: ResultsPanelProps) {
  const { trials, status, record } = useTrials('incline', 'incline');
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedFor, setSavedFor] = useState<unknown>(null);

  const m = run.status === 'done' ? run.measurement : null;
  const stale = m !== null && !sameParams(m.params, params);
  const v = (x: number | undefined) => (m && x !== undefined && Number.isFinite(x) ? x : null);
  // Recorded only counts for the current, unchanged set-up.
  const alreadySaved = saved === 'saved' && savedFor === m && !stale;

  const recordTrial = async () => {
    if (!m) return;
    setSaved('saving');
    try {
      await record({
        params: { ...m.params, lengthM: RAMP_LENGTH_M },
        readouts: m.readouts,
        valid: m.check.valid,
      });
      setSaved('saved');
      setSavedFor(m);
    } catch {
      setSaved('error');
    }
  };

  return (
    <Panel
      eyebrow="Results"
      title="Measurements"
      labelledBy="results-title"
      actions={
        <Button
          size="sm"
          icon="record"
          disabled={!m || stale || !m.check.valid || alreadySaved || saved === 'saving'}
          onClick={() => void recordTrial()}
        >
          {alreadySaved ? 'Trial recorded' : 'Record trial'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {run.status === 'running' ? (
          <p role="status" className="text-sm text-muted">
            Pulling the block up the ramp…
          </p>
        ) : null}
        {stale ? (
          <Callout tone="warning" role="status" title="You changed the set-up after this run">
            These numbers belong to the previous set-up (θ = {m.params.angleDeg}°, μ ={' '}
            {m.params.friction.toFixed(2)}, m = {m.params.massKg} kg). Run again to measure the new
            one.
          </Callout>
        ) : null}
        {m && !m.check.valid ? (
          <Callout tone="danger" role="alert" title="Measurement error">
            {ledgerError[m.check.reason] ?? 'This run could not be measured.'} The efficiency is not
            shown, because it would be wrong.
          </Callout>
        ) : null}

        <div
          aria-live="polite"
          className="grid grid-cols-2 gap-x-6 border-y border-rule sm:grid-cols-3 [&>*]:border-b [&>*]:border-rule"
        >
          <Readout
            symbol={
              <>
                F<sub>in</sub>
              </>
            }
            label="Spring scale (effort)"
            value={v(m?.scaleN)}
            unit="N"
            digits={1}
            tone="input"
            definition="Force needed to pull the block up the ramp at a steady speed. Read to 0.1 N."
          />
          <Readout
            symbol={
              <>
                F<sub>out</sub>
              </>
            }
            label="Load (weight)"
            value={v(m?.loadN)}
            unit="N"
            digits={1}
            tone="output"
            definition="Weight of the block: W = m × g, with g = 9.81 m/s²."
          />
          <Readout
            symbol={
              <>
                d<sub>in</sub>
              </>
            }
            label="Distance pulled"
            value={v(m?.effortDistanceM)}
            unit="m"
            tone="input"
            definition="Length of ramp the block travelled. Read to 0.01 m."
          />
          <Readout
            symbol={
              <>
                d<sub>out</sub>
              </>
            }
            label="Height gained"
            value={v(m?.heightM)}
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
            value={v(m?.readouts.inputWorkJ)}
            unit="J"
            tone="input"
            definition="Work done by the effort over the whole pull (W = F × d)."
          />
          <Readout
            symbol={
              <>
                W<sub>out</sub>
              </>
            }
            label="Useful work"
            value={v(m?.readouts.outputWorkJ)}
            unit="J"
            tone="output"
            definition="Potential energy the load gained (W = m g h)."
          />
          <Readout
            symbol="AMA"
            label="Actual mech. advantage"
            value={v(m?.readouts.actualMA)}
            unit=""
            definition="F_out ÷ F_in. Friction lowers it."
          />
          <Readout
            symbol="IMA"
            label="Ideal mech. advantage"
            value={v(m?.readouts.idealMA)}
            unit=""
            definition="d_in ÷ d_out. Geometry only; friction does not change it."
          />
        </div>

        <Readout
          symbol="η"
          label="Efficiency"
          value={v(m?.readouts.efficiencyPercent)}
          unit="%"
          digits={1}
          size="lg"
          definition="W_out ÷ W_in × 100%. Measured from the run, never set."
        />

        {m && m.check.valid ? (
          <EnergyFlowBar inputJ={m.ledger.inputJ} usefulJ={m.ledger.usefulJ} />
        ) : run.status !== 'running' ? (
          <EmptyState compact icon="gauge" title="No measurements yet">
            Go to step 3 and press Run. The readings appear here.
          </EmptyState>
        ) : null}

        <div aria-live="polite">
          {alreadySaved ? <SuccessState title="Trial recorded on this device" /> : null}
          {saved === 'error' ? (
            <Callout tone="danger" role="alert" title="Could not record the trial">
              This browser is blocking local storage.
            </Callout>
          ) : null}
        </div>

        <TrialsTable trials={trials} status={status} />
      </div>
    </Panel>
  );
}

function TrialsTable({
  trials,
  status,
}: {
  trials: ReturnType<typeof useTrials>['trials'];
  status: string;
}) {
  if (status === 'loading') return null;
  if (status === 'error') {
    return <Callout tone="danger" title="Recorded trials could not be loaded." />;
  }
  if (!trials.length) {
    return (
      <p className="text-sm text-muted">
        Recorded trials appear here so you can compare ramps. Try a gentle and a steep ramp with the
        same friction.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <caption className="mb-2 text-left font-medium">Recorded trials</caption>
        <thead>
          <tr className="border-b border-rule text-left text-muted">
            <th scope="col" className="py-2 font-medium">
              #
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              θ (°)
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              μ
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              m (kg)
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              F<sub>in</sub> (N)
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              IMA
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              AMA
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              η (%)
            </th>
          </tr>
        </thead>
        <tbody className="num divide-y divide-rule">
          {trials.map((t, i) => (
            <tr key={t.id}>
              <th scope="row" className="py-2 text-left font-normal text-muted">
                {i + 1}
              </th>
              <td className="py-2 text-right">{t.params.angleDeg}</td>
              <td className="py-2 text-right">{t.params.friction?.toFixed(2)}</td>
              <td className="py-2 text-right">{t.params.massKg}</td>
              <td className="py-2 text-right">{formatQuantity(t.readouts.inputForceN, 1)}</td>
              <td className="py-2 text-right">{formatQuantity(t.readouts.idealMA, 2)}</td>
              <td className="py-2 text-right">{formatQuantity(t.readouts.actualMA, 2)}</td>
              <td className="py-2 text-right">
                {t.valid ? formatQuantity(t.readouts.efficiencyPercent, 1) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
