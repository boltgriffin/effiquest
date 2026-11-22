import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/Panel';
import { getMisconception } from '@/content/misconceptions';
import { modules } from '@/content/modules';
import { isModuleComplete } from '@/content/progress';
import { useProgress } from '@/hooks/useProgress';

export default function LearnPage() {
  const { events } = useProgress();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Learn"
        title="Modules"
        description="Each module targets specific misconceptions and links to a lab activity."
      />
      <ol className="divide-y divide-rule overflow-hidden rounded-md border border-rule bg-surface">
        {modules.map((m, i) => (
          <li key={m.id}>
            <Link
              to={`/learn/${m.id}`}
              className="group grid grid-cols-[auto_1fr_auto] items-start gap-4 p-4 hover:bg-surface-2 sm:p-5"
            >
              <span className="num pt-1 text-sm text-muted">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 font-display text-xl">
                  <Icon name={m.icon} size={20} className="text-brand" />
                  {m.title}
                  {isModuleComplete(events, m.id) ? <Badge tone="success">Completed</Badge> : null}
                </span>
                <span className="mt-1 block text-sm text-muted">{m.objective}</span>
                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {m.misconceptionIds.map((id) => (
                    <span key={id}>
                      <span className="num">{id}</span> · {getMisconception(id).short}
                    </span>
                  ))}
                </span>
              </span>
              <Icon
                name="chevronRight"
                size={20}
                className="mt-1 text-muted group-hover:text-ink"
              />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
