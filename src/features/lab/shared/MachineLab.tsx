import { Suspense, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EmptyState, LoadingState } from '@/components/StatePanels';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog } from '@/components/ui/Dialog';
import { PageHeader } from '@/components/ui/Panel';
import { Tabs } from '@/components/ui/Tabs';
import { isWebGLAvailable } from '@/utils/webgl';
import { useTrials } from '../useTrials';
import { ExperimentGuide } from './ExperimentGuide';
import { MeasurementsPanel } from './MeasurementsPanel';
import { SimControls } from './SimControls';
import type { LabParams, MachineDefinition } from './types';
import { useMachineRun } from './useMachineRun';
import { VariablesPanel } from './VariablesPanel';

/**
 * The shared laboratory template. Every machine gets the same layout and behaviour: simulation
 * (diagram + 3D) with playback controls, live measurements, variables, and the guided activity.
 * Phone: simulation and controls first, then measurements, variables and guide.
 */
export function MachineLab<P extends LabParams>({ def }: { def: MachineDefinition<P> }) {
  const [params, setParams] = useState<P>(def.defaults);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const sim = useMachineRun(def);
  const { trials, record } = useTrials(def.id, def.machine);
  const playing = sim.state.status === 'running';
  const locked = sim.state.status === 'running' || sim.state.status === 'paused';
  // While a run is loaded and locked, show the set-up being run.
  const shown = sim.run && locked ? sim.run.params : params;
  const { Diagram, View3D } = def;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumbs items={[{ label: 'Laboratory', to: '/lab' }, { label: def.title }]} />
        <PageHeader
          eyebrow={`Laboratory · ${def.title}`}
          title={def.title}
          description={def.question}
          actions={
            <Button size="sm" icon="info" onClick={() => setShowAssumptions(true)}>
              Model assumptions
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-label="Simulation"
            className="flex flex-col gap-4 rounded-md border border-rule bg-surface p-4 sm:p-5"
          >
            <Tabs
              label="Simulation view"
              items={[
                {
                  id: 'diagram',
                  label: 'Diagram',
                  icon: def.icon,
                  content: (
                    <div className="paper-grid overflow-hidden rounded-md border border-rule">
                      <Diagram
                        params={shown}
                        motion={sim.motion}
                        playing={playing}
                        className="mx-auto max-h-[60vh] w-full max-w-2xl"
                      />
                    </div>
                  ),
                },
                {
                  id: '3d',
                  label: '3D view',
                  icon: 'layers',
                  content: isWebGLAvailable() ? (
                    <div className="h-[min(60vh,28rem)] overflow-hidden rounded-md border border-rule">
                      <ErrorBoundary area="the 3D view">
                        <Suspense fallback={<LoadingState label="Loading 3D view…" />}>
                          <View3D params={shown} motion={sim.motion} playing={playing} />
                        </Suspense>
                      </ErrorBoundary>
                    </div>
                  ) : (
                    <EmptyState title="3D is not available on this device" icon="monitor">
                      Use the diagram view. It shows the same machine and run in 2D.
                    </EmptyState>
                  ),
                },
              ]}
            />
            <SimControls
              state={sim.state}
              hasRun={sim.run !== null}
              status={def.status}
              onStart={() => sim.start(params)}
              onPause={sim.pause}
              onResume={sim.resume}
              onReplay={sim.replay}
              onReset={sim.reset}
            />
            {sim.errors.length ? (
              <Callout tone="danger" role="alert" title="This set-up cannot be run">
                {sim.errors.join(' ')}
              </Callout>
            ) : null}
          </section>

          <MeasurementsPanel
            def={def}
            state={sim.state}
            run={sim.run}
            live={sim.live}
            params={params}
            onRecord={async () => {
              const r = sim.run;
              if (!r) return;
              await record({
                params: { ...r.params },
                readouts: r.measurement.readouts,
                valid: r.measurement.check.valid,
              });
            }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <VariablesPanel
            title={`Set up the ${def.title.toLowerCase()}`}
            params={params}
            defaults={def.defaults}
            variables={def.variables}
            onChange={setParams}
            locked={locked}
          />
          <ExperimentGuide def={def} trials={trials} />
        </div>
      </div>

      <Dialog
        open={showAssumptions}
        onClose={() => setShowAssumptions(false)}
        title="Model assumptions"
        footer={
          <Button variant="primary" onClick={() => setShowAssumptions(false)}>
            Done
          </Button>
        }
      >
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
          {def.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          This is a model. It supports, and does not replace, the hands-on experiment in class.
        </p>
      </Dialog>
    </div>
  );
}
