import { lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EmptyState, LoadingState } from '@/components/StatePanels';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { PageHeader } from '@/components/ui/Panel';
import { Tabs } from '@/components/ui/Tabs';
import { ExperimentPanel } from '@/features/lab/ExperimentPanel';
import { InclineDiagram } from '@/features/lab/InclineDiagram';
import type { MotionRef } from '@/features/lab/motion';
import {
  DEFAULT_PARAMS,
  PULL_SPEED_MPS,
  RAMP_LENGTH_M,
  type InclineParams,
} from '@/features/lab/params';
import { ResultsPanel } from '@/features/lab/ResultsPanel';
import { useInclineRun } from '@/features/lab/useInclineRun';
import { isWebGLAvailable } from '@/utils/webgl';

// Three.js/R3F load only when the 3D tab opens, keeping the app shell small (docs N2).
const Incline3DView = lazy(() => import('@/features/lab/Incline3DView'));

const assumptions = [
  `The ramp surface is ${RAMP_LENGTH_M} m long; changing the angle changes its height.`,
  'Rigid block and ramp; constant g = 9.81 m/s².',
  'One kinetic friction coefficient μ for the whole surface. Static friction (the extra push needed to start) is not modelled.',
  `The block starts and ends at rest and is pulled parallel to the slope at a steady ${PULL_SPEED_MPS} m/s, so the spring scale settles on one reading.`,
  'The spring scale reads to 0.1 N and the ruler to 0.01 m, like classroom instruments.',
  'Efficiency is calculated from the work in the run: η = W_out ÷ W_in × 100%. It is never set directly.',
];

function ThreeDView({
  params,
  motion,
  playing,
}: {
  params: InclineParams;
  motion: MotionRef;
  playing: boolean;
}) {
  if (!isWebGLAvailable()) {
    return (
      <EmptyState title="3D is not available on this device" icon="monitor">
        Use the diagram view. It shows the same set-up and run in 2D.
      </EmptyState>
    );
  }
  return (
    <div className="h-80 overflow-hidden rounded-md border border-rule sm:h-96">
      <ErrorBoundary area="the 3D view">
        <Suspense fallback={<LoadingState label="Loading 3D view…" />}>
          <Incline3DView params={params} motion={motion} playing={playing} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default function InclineLabPage() {
  const [params, setParams] = useState<InclineParams>(DEFAULT_PARAMS);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const { state: run, motion, run: start } = useInclineRun();
  const playing = run.status === 'running';

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: 'Laboratory', to: '/lab' }, { label: 'Inclined plane' }]} />
      <PageHeader
        eyebrow="Laboratory · Inclined plane"
        title="Inclined plane"
        description="Does a gentler ramp make lifting easier, more efficient, or both?"
        actions={
          <Button size="sm" icon="info" onClick={() => setShowAssumptions(true)}>
            Model assumptions
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section
          aria-label="Apparatus"
          className="min-w-0 rounded-md border border-rule bg-surface p-4 sm:p-5"
        >
          <Tabs
            label="Apparatus view"
            items={[
              {
                id: 'diagram',
                label: 'Diagram',
                icon: 'incline',
                content: (
                  <figure>
                    <div className="paper-grid overflow-hidden rounded-md border border-rule">
                      <InclineDiagram
                        {...params}
                        motion={motion}
                        playing={playing}
                        className="mx-auto w-full max-w-2xl"
                      />
                    </div>
                    <figcaption className="mt-2 text-xs text-muted">
                      Ramp geometry follows your settings. Arrow lengths are illustrative, not to
                      scale.
                    </figcaption>
                  </figure>
                ),
              },
              {
                id: '3d',
                label: '3D view',
                icon: 'layers',
                content: <ThreeDView params={params} motion={motion} playing={playing} />,
              },
            ]}
          />
        </section>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="lg:sticky lg:top-6">
            <ExperimentPanel
              params={params}
              onParamsChange={setParams}
              run={run}
              onRun={() => start(params)}
            />
          </div>
        </div>

        <ResultsPanel run={run} params={params} />
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
          This is a model. It supports, and does not replace, the hands-on experiment in class.
        </p>
      </Dialog>
    </div>
  );
}
