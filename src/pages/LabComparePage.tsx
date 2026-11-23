import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/StatePanels';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Callout } from '@/components/ui/Callout';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { labs } from '@/content/quests';
import { compareMachines } from '@/features/lab/shared/compare';
import { listTrials } from '@/services/storage/trials';
import { useOwnerId } from '@/store/learnerStore';
import type { SimTrial } from '@/types';
import { formatQuantity } from '@/utils/format';

type Load =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; byLab: Record<string, SimTrial[]> };

/** Compare the learner's own results across machines (SRC-O2, SRC-O3). */
export default function LabComparePage() {
  const ownerId = useOwnerId();
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all(labs.map(async (l) => [l.id, await listTrials(ownerId, l.id)] as const)).then(
      (entries) => !cancelled && setLoad({ status: 'ready', byLab: Object.fromEntries(entries) }),
      () => !cancelled && setLoad({ status: 'error' }),
    );
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumbs items={[{ label: 'Laboratory', to: '/lab' }, { label: 'Compare machines' }]} />
        <PageHeader
          eyebrow="Laboratory"
          title="Compare machines"
          description="Your latest recorded trial from each lab, side by side. Which machine makes the job easiest? Which wastes the least energy?"
        />
      </div>
      {load.status === 'loading' ? <LoadingState label="Loading your trials…" /> : null}
      {load.status === 'error' ? (
        <ErrorState
          title="Your trials could not be loaded"
          message="This browser is blocking local storage."
        />
      ) : null}
      {load.status === 'ready' ? <CompareBody byLab={load.byLab} /> : null}
    </div>
  );
}

function CompareBody({ byLab }: { byLab: Record<string, SimTrial[]> }) {
  const c = compareMachines(
    labs.map((l) => ({ labId: l.id, title: l.title })),
    byLab,
  );
  const any = c.rows.some((r) => r.trial);
  if (!any) {
    return (
      <EmptyState icon="lab" title="No trials recorded yet">
        Run at least two different labs and press Record trial in each, then come back here.
      </EmptyState>
    );
  }
  return (
    <>
      <Panel
        eyebrow="Your data"
        title="Latest trial per machine"
        bodyClassName="overflow-x-auto p-0 sm:p-0"
      >
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">Latest valid trial for each machine</caption>
          <thead>
            <tr className="border-b border-rule text-left text-muted">
              <th scope="col" className="px-4 py-2 font-medium sm:px-5">
                Machine
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                F<sub>in</sub> (N)
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                F<sub>out</sub> (N)
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                IMA
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                AMA
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">
                η (%)
              </th>
            </tr>
          </thead>
          <tbody className="num divide-y divide-rule">
            {c.rows.map((r) => {
              const info = labs.find((l) => l.id === r.labId);
              return (
                <tr key={r.labId}>
                  <th scope="row" className="px-4 py-2 text-left font-normal sm:px-5">
                    <Link
                      to={info?.to ?? '/lab'}
                      className="inline-flex items-center gap-2 font-sans hover:text-brand hover:underline"
                    >
                      {info ? <Icon name={info.icon} size={16} className="text-brand" /> : null}
                      {r.title}
                    </Link>
                  </th>
                  {r.trial ? (
                    <>
                      <td className="px-2 py-2 text-right">
                        {formatQuantity(r.trial.readouts.inputForceN, 1)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {formatQuantity(r.trial.readouts.outputForceN, 1)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {formatQuantity(r.trial.readouts.idealMA, 2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {formatQuantity(r.trial.readouts.actualMA, 2)}
                      </td>
                      <td className="px-4 py-2 text-right sm:px-5">
                        {formatQuantity(r.trial.readouts.efficiencyPercent, 1)}
                      </td>
                    </>
                  ) : (
                    <td colSpan={5} className="px-4 py-2 text-right font-sans text-muted sm:px-5">
                      No trial recorded
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      {c.sentence ? (
        <Callout tone="info" title="What your data show">
          {c.sentence}
        </Callout>
      ) : (
        <p className="text-sm text-muted">Record trials in at least two labs to compare them.</p>
      )}
      <Callout tone="info" title="Think about it">
        The set-ups were not the same (different loads and frictions), so this is not a fair test of
        the machines themselves. It shows that mechanical advantage and efficiency are separate
        measurements. Compound machines (SRC-O3) combine several of these, and their overall
        efficiency is the product of each part’s efficiency.
      </Callout>
    </>
  );
}
