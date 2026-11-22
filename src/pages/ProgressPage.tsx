import { useState } from 'react';
import { EmptyState } from '@/components/StatePanels';
import { SampleBadge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import { misconceptions } from '@/content/misconceptions';
import { summarize } from '@/content/progress';
import { PrePostChart, type PrePostRow } from '@/features/progress/PrePostChart';
import { useProgress } from '@/hooks/useProgress';

// Invented numbers for layout review only; shown with a "Sample data" badge.
const SAMPLE_BASELINE = [35, 28, 40, 22, 45, 30];
const SAMPLE_POST = [70, 64, 72, 58, 75, 66];

const sampleRows: PrePostRow[] = misconceptions.map((m, i) => ({
  id: m.id,
  label: m.short,
  baseline: SAMPLE_BASELINE[i] ?? 0,
  post: SAMPLE_POST[i] ?? 0,
}));

export default function ProgressPage() {
  const [sample, setSample] = useState(false);
  const progress = useProgress();
  const summary = summarize(progress.events);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Progress"
        title="How your thinking has changed"
        description="Results per misconception, from the baseline diagnostic to the post diagnostic."
        actions={sample ? <SampleBadge>Sample data</SampleBadge> : null}
      />
      <Panel
        eyebrow="Activity"
        title="Work completed"
        bodyClassName="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <ProgressBar
          label={`Modules ${summary.modulesDone} of ${summary.modulesTotal}`}
          value={summary.modulesDone}
          max={summary.modulesTotal}
        />
        <ProgressBar
          label={`Labs ${summary.labsDone} of ${summary.labsTotal}`}
          value={summary.labsDone}
          max={summary.labsTotal}
        />
        <ProgressBar
          label={`Quests ${summary.questsDone} of ${summary.questsTotal}`}
          value={summary.questsDone}
          max={summary.questsTotal}
        />
      </Panel>
      <h2 className="font-display text-2xl">Diagnostics</h2>
      <Switch
        label="Preview with sample data"
        checked={sample}
        onChange={setSample}
        description="Shows invented numbers so you can review the layout. They are not your results."
      />

      {sample ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel eyebrow="Diagnostics" title="Baseline vs post">
            <PrePostChart rows={sampleRows} />
          </Panel>
          <Panel
            eyebrow="Post diagnostic"
            title="Understanding by idea"
            bodyClassName="flex flex-col gap-4"
          >
            {sampleRows.map((r) => (
              <ProgressBar
                key={r.id}
                label={`${r.id} · ${r.label}`}
                value={r.post}
                tone="chart-2"
              />
            ))}
          </Panel>
        </div>
      ) : (
        <EmptyState
          icon="progress"
          title="No diagnostic results yet"
          action={
            <ButtonLink to="/assess" variant="primary">
              Go to diagnostics
            </ButtonLink>
          }
        >
          Your results appear here after you take the baseline diagnostic.
        </EmptyState>
      )}
    </div>
  );
}
