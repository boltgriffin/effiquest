import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Panel';
import { isLabComplete } from '@/content/progress';
import { labs, plannedLabs } from '@/content/quests';
import { InclineDiagram } from '@/features/lab/InclineDiagram';
import { DEFAULT_PULLEY_PARAMS } from '@/features/lab/pulley/params';
import { PulleyDiagram } from '@/features/lab/pulley/PulleyDiagram';
import { useProgress } from '@/hooks/useProgress';

const previews = {
  incline: <InclineDiagram angleDeg={25} friction={0.25} massKg={10} className="w-full" />,
  pulley: <PulleyDiagram params={{ ...DEFAULT_PULLEY_PARAMS, segments: 3 }} className="w-full" />,
};

export default function LabIndexPage() {
  const { events } = useProgress();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Laboratory"
        title="Laboratory"
        description="Choose a machine. Each lab measures input and output work so you can find its efficiency."
      />
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {labs.map((l) => (
          <li key={l.id}>
            <Link
              to={l.to}
              className="group flex h-full flex-col overflow-hidden rounded-md border border-rule bg-surface hover:border-brand"
            >
              <span className="paper-grid block border-b border-rule" aria-hidden="true">
                {previews[l.id]}
              </span>
              <span className="flex flex-1 flex-col gap-2 p-5">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-display text-xl">
                    <Icon name={l.icon} size={20} className="text-brand" />
                    {l.title}
                  </span>
                  {isLabComplete(events, l.id) ? <Badge tone="success">Done</Badge> : null}
                </span>
                <span className="text-sm text-muted">{l.question}</span>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-brand">
                  Open lab <Icon name="arrowRight" size={16} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section aria-labelledby="coming-next">
        <h2 id="coming-next" className="font-display text-xl">
          Coming next
        </h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
          {plannedLabs.map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 rounded-md border border-dashed border-rule-strong px-3 py-2"
            >
              <Icon name="lock" size={16} />
              {p}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
