import { lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EmptyState, LoadingState } from '@/components/StatePanels';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog } from '@/components/ui/Dialog';
import { PageHeader } from '@/components/ui/Panel';
import { Tabs } from '@/components/ui/Tabs';
import {
  DEFAULT_PULLEY_PARAMS,
  LOAD_SPEED_MPS,
  PULLEY_GEOMETRY,
  type PulleyLabParams,
} from '@/features/lab/pulley/params';
import { PulleyControls } from '@/features/lab/pulley/PulleyControls';
import { PulleyDiagram } from '@/features/lab/pulley/PulleyDiagram';
import { PulleyGuide } from '@/features/lab/pulley/PulleyGuide';
import { PulleyMeasurements } from '@/features/lab/pulley/PulleyMeasurements';
import { PulleyVariables } from '@/features/lab/pulley/PulleyVariables';
import { usePulleyRun } from '@/features/lab/pulley/usePulleyRun';
import { useTrials } from '@/features/lab/useTrials';
import type { MotionRef } from '@/features/lab/motion';
import { isWebGLAvailable } from '@/utils/webgl';

const Pulley3DView = lazy(() => import('@/features/lab/pulley/Pulley3DView'));

const assumptions = [
  'Non-ideal pulley system: losses come from friction in each pulley’s axle bearing and from lifting the movable pulley block. There is no efficiency setting.',
  `Bearing friction: each pulley multiplies the rope tension by K = (R + μb·r) ÷ (R − μb·r), with pulley radius R = ${PULLEY_GEOMETRY.sheaveRadiusM * 1000} mm and axle radius r = ${PULLEY_GEOMETRY.axleRadiusM * 1000} mm.`,
  'The rope is light, does not stretch and does not slip; rope runs are vertical and parallel.',
  'Pulleys are light (no spin energy); the number of pulleys equals the number of supporting segments.',
  `The load starts and ends at rest and is raised ${PULLEY_GEOMETRY.liftM} m at a steady ${LOAD_SPEED_MPS} m/s, so the spring scale settles on one reading.`,
  'g = 9.81 m/s². The spring scale reads to 0.1 N and the rulers to 0.01 m.',
  'Efficiency = useful work (load’s potential energy) ÷ input work × 100%, over the whole lift.',
];

function ThreeD({
  params,
  motion,
  playing,
}: {
  params: PulleyLabParams;
  motion: MotionRef;
  playing: boolean;
}) {
  if (!isWebGLAvailable()) {
    return (
      <EmptyState title="3D is not available on this device" icon="monitor">
        Use the diagram view. It shows the same pulleys and run in 2D.
      </EmptyState>
    );
  }
  return (
    <div className="h-[min(60vh,26rem)] overflow-hidden rounded-md border border-rule">
      <ErrorBoundary area="the 3D view">
        <Suspense fallback={<LoadingState label="Loading 3D view…" />}>
          <Pulley3DView params={params} motion={motion} playing={playing} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default function PulleyLabPage() {
  const [params, setParams] = useState<PulleyLabParams>(DEFAULT_PULLEY_PARAMS);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const sim = usePulleyRun();
  const { trials, record } = useTrials('pulley', 'pulley');
  const playing = sim.state.status === 'running';
  const locked = sim.state.status === 'running' || sim.state.status === 'paused';
  // Show the set-up being run while a run is loaded; otherwise the chosen settings.
  const shown = sim.run && locked ? sim.run.params : params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumbs items={[{ label: 'Laboratory', to: '/lab' }, { label: 'Pulley system' }]} />
        <PageHeader
          eyebrow="Laboratory · Pulley system"
          title="Pulley system"
          description="Do more rope segments make lifting easier, more efficient, or both?"
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
                  icon: 'pulley',
                  content: (
                    <div className="paper-grid overflow-hidden rounded-md border border-rule">
                      <PulleyDiagram
                        params={shown}
                        motion={sim.motion}
                        playing={playing}
                        className="mx-auto max-h-[60vh] w-full max-w-xl"
                      />
                    </div>
                  ),
                },
                {
                  id: '3d',
                  label: '3D view',
                  icon: 'layers',
                  content: <ThreeD params={shown} motion={sim.motion} playing={playing} />,
                },
              ]}
            />
            <PulleyControls
              state={sim.state}
              hasRun={sim.run !== null}
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

          <PulleyMeasurements
            state={sim.state}
            run={sim.run}
            live={sim.live}
            params={params}
            onRecord={async () => {
              const r = sim.run;
              if (!r) return;
              await record({
                params: { ...r.params, ...PULLEY_GEOMETRY },
                readouts: r.measurement.readouts,
                valid: r.measurement.check.valid,
              });
            }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <PulleyVariables params={params} onChange={setParams} locked={locked} />
          <PulleyGuide trials={trials} />
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
          {assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          This is a model. It supports, and does not replace, the hands-on pulley experiment in
          class.
        </p>
      </Dialog>
    </div>
  );
}
