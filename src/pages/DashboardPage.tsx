import { Link, Navigate } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, ErrorState, LoadingState, SuccessState } from '@/components/StatePanels';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Progress';
import { modules } from '@/content/modules';
import {
  currentQuest,
  isLabComplete,
  isModuleComplete,
  questProgress,
  recentActivity,
  relativeTime,
  stageHref,
  summarize,
} from '@/content/progress';
import { labs, plannedLabs, quests } from '@/content/quests';
import { InclineDiagram } from '@/features/lab/InclineDiagram';
import { useProgress } from '@/hooks/useProgress';
import { useLearnerStore } from '@/store/learnerStore';
import { useUiStore } from '@/store/uiStore';
import type { ProgressEvent } from '@/types';

export default function DashboardPage() {
  const seenWelcome = useUiStore((s) => s.seenWelcome);
  const learnerCode = useLearnerStore((s) => s.learnerCode);
  const progress = useProgress();
  if (!seenWelcome) return <Navigate to="/welcome" replace />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={learnerCode ? `Learner ${learnerCode}` : 'Dashboard'}
        title="Your laboratory"
        description="Continue where you left off, or open the lab to test an idea."
      />

      {!learnerCode ? (
        <Callout tone="warning" title="Add your learner code">
          Your teacher gives you a code so your results can be collected. Your work is saved on this
          device either way.{' '}
          <Link
            to="/settings#learner"
            className="font-medium text-brand underline underline-offset-2"
          >
            Add it in Settings
          </Link>
        </Callout>
      ) : null}

      {progress.status === 'loading' ? <LoadingState label="Loading your progress…" /> : null}
      {progress.status === 'error' ? (
        <ErrorState
          title="Your progress could not be loaded"
          message="This browser may be blocking local storage. Lessons and the lab still work."
          onRetry={progress.retry}
        />
      ) : null}
      {progress.status === 'ready' ? <DashboardBody events={progress.events} /> : null}
    </div>
  );
}

function DashboardBody({ events }: { events: ProgressEvent[] }) {
  const current = currentQuest(events);
  const summary = summarize(events);
  const activity = recentActivity(events);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        {/* Current learning activity */}
        {current ? (
          <Panel eyebrow={events.length ? 'Continue' : 'Start here'} title={current.quest.title}>
            <p className="text-muted">{current.quest.question}</p>
            <ProgressBar
              className="mt-4"
              label={`Stage ${current.done + 1} of ${current.total}`}
              value={current.done}
              max={current.total}
            />
            {current.nextStage ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <ButtonLink
                  to={stageHref(current.quest, current.nextStage)}
                  variant="primary"
                  iconRight="arrowRight"
                >
                  {current.nextStage.title}
                </ButtonLink>
                <Link
                  to={`/quests/${current.quest.id}`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  See all stages
                </Link>
              </div>
            ) : null}
          </Panel>
        ) : (
          <SuccessState title="Every quest is complete">
            Well done. Review your results on the{' '}
            <Link to="/progress" className="text-brand underline">
              Progress
            </Link>{' '}
            page.
          </SuccessState>
        )}

        {/* Simulation access, kept prominent */}
        <Panel
          eyebrow="Laboratory"
          title="Experiments"
          bodyClassName="grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          {/* Mouse shortcut only: the lab list beside it is the accessible way in. */}
          <Link
            to="/lab"
            aria-hidden="true"
            tabIndex={-1}
            className="paper-grid block overflow-hidden rounded-md border border-rule hover:border-brand"
          >
            <InclineDiagram angleDeg={25} friction={0.25} massKg={10} className="w-full" />
          </Link>
          <div className="flex flex-col gap-3">
            <ul className="divide-y divide-rule border-y border-rule text-sm">
              {labs.map((l) => (
                <li key={l.id}>
                  <Link to={l.to} className="flex min-h-11 items-center gap-2 hover:text-brand">
                    <Icon name={l.icon} size={18} className="text-brand" />
                    <span className="flex-1 font-medium">{l.title}</span>
                    {isLabComplete(events, l.id) ? (
                      <Badge tone="success">Done</Badge>
                    ) : (
                      <Badge tone="brand">Open</Badge>
                    )}
                  </Link>
                </li>
              ))}
              {plannedLabs.map((name) => (
                <li key={name} className="flex min-h-11 items-center gap-2 text-muted">
                  <Icon name="lock" size={18} />
                  <span className="flex-1">{name}</span>
                  <span className="text-xs">Coming next</span>
                </li>
              ))}
            </ul>
            <ButtonLink to="/lab" variant="primary" icon="lab">
              Open the lab
            </ButtonLink>
          </div>
        </Panel>

        {/* Available lessons */}
        <Panel eyebrow="Modules" title="Lessons" bodyClassName="p-0 sm:p-0">
          <ul className="divide-y divide-rule">
            {modules.map((m) => {
              const done = isModuleComplete(events, m.id);
              return (
                <li key={m.id}>
                  <Link
                    to={`/learn/${m.id}`}
                    className="group flex items-center gap-4 px-4 py-3 hover:bg-surface-2 sm:px-5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-rule text-brand">
                      <Icon name={done ? 'check' : m.icon} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{m.title}</span>
                      <span className="block truncate text-sm text-muted">{m.objective}</span>
                    </span>
                    <span className="hidden text-sm text-muted sm:inline">
                      {done ? 'Completed' : 'Not started'}
                    </span>
                    <Icon
                      name="chevronRight"
                      size={18}
                      className="text-muted group-hover:text-ink"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col gap-6">
        {/* Learning progress summary */}
        <Panel
          eyebrow="Summary"
          title="Your progress"
          actions={
            <Link to="/progress" className="text-sm font-medium text-brand hover:underline">
              Details
            </Link>
          }
          bodyClassName="flex flex-col gap-4"
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

        {/* Quest progress */}
        <Panel eyebrow="Quests" title="Ideas to test" bodyClassName="p-0 sm:p-0">
          <ul className="divide-y divide-rule">
            {quests.map((q) => {
              const p = questProgress(events, q);
              return (
                <li key={q.id}>
                  <Link
                    to={`/quests/${q.id}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-2 sm:px-5"
                  >
                    <Icon
                      name={p.complete ? 'check' : 'quest'}
                      size={18}
                      className={p.complete ? 'text-success' : 'text-muted'}
                    />
                    <span className="flex-1">{q.title}</span>
                    <span className="num text-xs text-muted">
                      {p.done}/{p.total}
                      <span className="sr-only"> stages done</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Recent activity */}
        <Panel eyebrow="Recent" title="Activity">
          {activity.length ? (
            <ol className="flex flex-col gap-3 text-sm">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                  />
                  <span className="min-w-0 flex-1">
                    <Link to={a.to} className="hover:text-brand hover:underline">
                      {a.text}
                    </Link>
                    <span className="block text-xs text-muted">
                      <time dateTime={a.at}>{relativeTime(a.at)}</time>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState compact icon="clock" title="Nothing yet">
              Completed modules, labs and quest answers will appear here.
            </EmptyState>
          )}
        </Panel>
      </div>
    </div>
  );
}
