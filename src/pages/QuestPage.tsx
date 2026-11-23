import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Icon, type IconName } from '@/components/icons/Icon';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NotFoundState,
  SuccessState,
} from '@/components/StatePanels';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { TextArea } from '@/components/ui/Field';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Progress';
import { getMisconception } from '@/content/misconceptions';
import { isStageComplete, questProgress, questStageRef, stageHref } from '@/content/progress';
import { findQuest, quests, type Quest, type QuestStage } from '@/content/quests';
import { useProgress } from '@/hooks/useProgress';
import { saveJournalEntry } from '@/services/storage/journal';
import { cx } from '@/utils/cx';

const stageIcon: Record<QuestStage['kind'], IconName> = {
  lesson: 'learn',
  lab: 'lab',
  check: 'assess',
  reflect: 'journal',
};
const stageKind: Record<QuestStage['kind'], string> = {
  lesson: 'Lesson',
  lab: 'Simulation and experiment',
  check: 'Knowledge check',
  reflect: 'Reflection',
};

export default function QuestPage() {
  const { questId } = useParams();
  const quest = findQuest(questId);
  if (!quest) return <NotFoundState />;
  return <QuestView key={quest.id} quest={quest} />;
}

function QuestView({ quest }: { quest: Quest }) {
  const progress = useProgress();
  const { hash } = useLocation();
  const m = getMisconception(quest.misconceptionId);
  const p = questProgress(progress.events, quest);
  const nextQuest = quests.find(
    (q) => q.id !== quest.id && !questProgress(progress.events, q).complete,
  );

  // Stage links to "#reflect" scroll to the reflection form once data has loaded.
  useEffect(() => {
    if (hash === '#reflect' && progress.status === 'ready') {
      document.getElementById('reflect')?.scrollIntoView({ block: 'start' });
    }
  }, [hash, progress.status]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumbs items={[{ label: 'Quests', to: '/quests' }, { label: quest.title }]} />
        <PageHeader
          eyebrow={`Quest · ${quest.misconceptionId}`}
          title={quest.title}
          description={quest.question}
        />
      </div>

      {progress.status === 'loading' ? <LoadingState label="Loading your progress…" /> : null}
      {progress.status === 'error' ? (
        <ErrorState title="Your progress could not be loaded" onRetry={progress.retry} />
      ) : null}

      {progress.status === 'ready' && p.complete ? (
        <div className="flex flex-col gap-3">
          <SuccessState title="Quest complete">
            You finished every stage of this quest: the lesson, the lab, the knowledge check and
            your answer to the quest question (saved in your journal).{' '}
            <Link to={`/quests/${quest.id}/check`} className="text-brand underline">
              Review your knowledge check
            </Link>
            .
          </SuccessState>
          {nextQuest ? (
            <ButtonLink
              to={`/quests/${nextQuest.id}`}
              variant="primary"
              iconRight="arrowRight"
              className="self-start"
            >
              Next quest: {nextQuest.title}
            </ButtonLink>
          ) : (
            <ButtonLink
              to="/progress"
              variant="primary"
              iconRight="arrowRight"
              className="self-start"
            >
              See your progress
            </ButtonLink>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel eyebrow="Route" title="Stages">
          <ProgressBar
            label={`${p.done} of ${p.total} stages done`}
            value={p.done}
            max={p.total}
            className="mb-5"
          />
          <ol className="relative flex flex-col">
            {quest.stages.map((stage, i) => {
              const done = isStageComplete(progress.events, quest, stage);
              const isNext = p.nextStage?.id === stage.id;
              return (
                <li key={stage.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < quest.stages.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-10 bottom-0 left-5 w-px bg-rule-strong"
                    />
                  ) : null}
                  <span
                    className={cx(
                      'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border',
                      done
                        ? 'border-success bg-success text-surface'
                        : isNext
                          ? 'border-brand bg-surface text-brand'
                          : 'border-rule-strong bg-surface text-muted',
                    )}
                  >
                    <Icon name={done ? 'check' : stageIcon[stage.kind]} size={18} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
                    <div>
                      <p className="font-mono text-xs tracking-wide text-muted uppercase">
                        Stage {i + 1} · {stageKind[stage.kind]}
                      </p>
                      <p className="font-medium">{stage.title}</p>
                      <p className={cx('text-sm', done ? 'text-success' : 'text-muted')}>
                        {done ? 'Done' : isNext ? 'Up next' : 'Not started'}
                      </p>
                    </div>
                    {stage.kind !== 'reflect' ? (
                      <Link
                        to={stageHref(quest, stage)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-brand hover:bg-brand-soft"
                      >
                        {done ? 'Review' : 'Open'} <Icon name="chevronRight" size={16} />
                        <span className="sr-only">: {stage.title}</span>
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>

        <aside className="flex flex-col gap-6">
          <Panel eyebrow="Mission" title={quest.question}>
            <p className="text-sm">
              <span className="font-medium">Learning objective</span>{' '}
              <span className="num text-muted">({quest.objective.source})</span>:{' '}
              {quest.objective.text}
            </p>
          </Panel>
          <Panel eyebrow="The idea being tested" title={m.short}>
            <p className="font-display text-lg italic">“{m.belief}”</p>
            <p className="mt-3 text-sm text-muted">
              By the end of the quest, decide whether your evidence supports or contradicts this
              idea.
            </p>
          </Panel>
        </aside>
      </div>

      {progress.status === 'ready' ? (
        <ReflectionForm
          quest={quest}
          done={isStageComplete(progress.events, quest, {
            id: 'reflect',
            kind: 'reflect',
            title: '',
          })}
          locked={quest.stages.some(
            (s) => s.kind !== 'reflect' && !isStageComplete(progress.events, quest, s),
          )}
          record={progress.record}
          ownerId={progress.ownerId}
        />
      ) : null}
    </div>
  );
}

const verdicts = [
  'My evidence supports this idea',
  'My evidence contradicts this idea',
  'My evidence is mixed',
] as const;

function ReflectionForm({
  quest,
  done,
  locked,
  record,
  ownerId,
}: {
  quest: Quest;
  done: boolean;
  /** Earlier stages are not finished yet: answer only after gathering evidence. */
  locked: boolean;
  record: ReturnType<typeof useProgress>['record'];
  ownerId: string;
}) {
  const [verdict, setVerdict] = useState<string | null>(null);
  const [why, setWhy] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const belief = getMisconception(quest.misconceptionId).belief;

  const submit = async () => {
    if (!verdict || !why.trim()) return;
    setState('saving');
    try {
      await saveJournalEntry(ownerId, {
        experimentId: `quest:${quest.id}`,
        beliefBefore: `${belief} (${verdict})`,
        findingAfter: why.trim(),
      });
      await record('quest_stage', questStageRef(quest.id, 'reflect'));
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <section id="reflect" aria-labelledby="reflect-title" className="scroll-mt-20">
      <Panel
        eyebrow="Final stage"
        title={<span id="reflect-title">Answer the quest question</span>}
      >
        {done ? (
          <SuccessState title="Answered">
            Your answer is saved in your journal on this device.
          </SuccessState>
        ) : locked ? (
          <EmptyState compact icon="lock" title="Finish the earlier stages first">
            Answer the question after the lesson and lab, so your answer is based on evidence.
          </EmptyState>
        ) : (
          <form
            className="flex max-w-2xl flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm">
                The idea: <span className="font-display italic">“{belief}”</span>
              </legend>
              {verdicts.map((v) => (
                <label
                  key={v}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-rule px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
                >
                  <input
                    type="radio"
                    name="verdict"
                    value={v}
                    checked={verdict === v}
                    onChange={() => setVerdict(v)}
                    className="size-4 accent-[var(--brand)]"
                  />
                  <span className="text-sm">{v}</span>
                </label>
              ))}
            </fieldset>
            <TextArea
              label="What evidence from the lesson or lab supports your answer?"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
            />
            <div>
              <Button
                type="submit"
                variant="primary"
                icon="check"
                disabled={!verdict || !why.trim() || state === 'saving'}
              >
                {state === 'saving' ? 'Saving…' : 'Submit answer'}
              </Button>
            </div>
            {state === 'error' ? (
              <Callout tone="danger" role="alert" title="Could not save">
                This browser is blocking local storage. Copy your answer before leaving.
              </Callout>
            ) : null}
          </form>
        )}
      </Panel>
    </section>
  );
}
