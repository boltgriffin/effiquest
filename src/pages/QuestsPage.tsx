import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Progress';
import { getMisconception } from '@/content/misconceptions';
import { questProgress } from '@/content/progress';
import { quests } from '@/content/quests';
import { useProgress } from '@/hooks/useProgress';

export default function QuestsPage() {
  const { events } = useProgress();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Quests"
        title="Ideas to test"
        description="Each quest takes one common belief about machines and checks it against evidence."
      />
      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-2">
        {quests.map((q) => {
          const p = questProgress(events, q);
          return (
            <li key={q.id} className="bg-surface">
              <Link
                to={`/quests/${q.id}`}
                className="group flex h-full flex-col gap-3 p-5 hover:bg-surface-2"
              >
                <span className="flex items-center justify-between gap-3 font-mono text-xs tracking-wide text-muted uppercase">
                  <span>
                    {q.misconceptionId} · {getMisconception(q.misconceptionId).short}
                  </span>
                  {p.complete ? <Badge tone="success">Complete</Badge> : null}
                </span>
                <span className="font-display text-xl">{q.title}</span>
                <span className="text-sm text-muted">{q.question}</span>
                <ProgressBar
                  label={`${p.done} of ${p.total} stages`}
                  value={p.done}
                  max={p.total}
                  tone="brand"
                />
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-brand">
                  {p.complete ? 'Review quest' : p.done ? 'Continue quest' : 'Start quest'}
                  <Icon
                    name="arrowRight"
                    size={16}
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
