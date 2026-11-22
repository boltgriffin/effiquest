import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { AssessmentRunner } from '@/features/assessment/AssessmentRunner';

const diagnostics = [
  { id: 'baseline', title: 'Baseline diagnostic', when: 'Weeks 1-2, before the modules' },
  { id: 'post', title: 'Post diagnostic', when: 'Weeks 11-12, after the modules' },
];

export default function AssessPage() {
  const [running, setRunning] = useState(false);

  if (running) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <AssessmentRunner onExit={() => setRunning(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assess"
        title="Diagnostics"
        description="The same diagnostic is taken before and after the modules, so you can see how your thinking changed."
      />
      <Panel eyebrow="Scheduled" title="Diagnostics" bodyClassName="p-0 sm:p-0">
        <ul className="divide-y divide-rule">
          {diagnostics.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
            >
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-sm text-muted">{d.when}</p>
              </div>
              <Badge tone="warning">Items not yet supplied</Badge>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel eyebrow="Preview" title="Sample items">
        <p className="text-sm text-muted">
          Three sample items show how the assessment screen works. They are not scored or saved.
        </p>
        <Button variant="primary" icon="play" className="mt-4" onClick={() => setRunning(true)}>
          Try the sample items
        </Button>
      </Panel>
    </div>
  );
}
