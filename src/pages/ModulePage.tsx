import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EquationCard } from '@/components/EquationCard';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, NotFoundState, SuccessState } from '@/components/StatePanels';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { Tabs } from '@/components/ui/Tabs';
import { getMisconception } from '@/content/misconceptions';
import { findLesson } from '@/content/lessons';
import { findModule, modules, type ModuleOutline } from '@/content/modules';
import { isLessonOpened, isModuleComplete } from '@/content/progress';
import { quests } from '@/content/quests';
import { PracticeItem } from '@/features/assessment/PracticeItem';
import { LessonView } from '@/features/lessons/LessonView';
import { useProgress } from '@/hooks/useProgress';

export default function ModulePage() {
  const { moduleId } = useParams();
  const mod = findModule(moduleId);
  if (!mod) return <NotFoundState />;
  return <ModuleView key={mod.id} mod={mod} />;
}

function ModuleView({ mod }: { mod: ModuleOutline }) {
  const progress = useProgress();
  const [saveError, setSaveError] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const done = isModuleComplete(progress.events, mod.id);
  const lesson = findLesson(mod.id);
  const index = modules.findIndex((m) => m.id === mod.id);
  const next = modules[index + 1];
  const relatedQuest = quests.find((q) =>
    q.stages.some((s) => s.kind === 'lesson' && s.moduleId === mod.id),
  );

  // "Lessons opened" indicator: one event the first time a learner opens each module.
  const recorded = useRef(false);
  const { status, events, record } = progress;
  useEffect(() => {
    if (status !== 'ready' || recorded.current) return;
    recorded.current = true;
    if (!isLessonOpened(events, mod.id)) void record('lesson_opened', mod.id).catch(() => {});
  }, [status, events, record, mod.id]);

  const complete = async () => {
    setSaveError(false);
    try {
      await progress.record('lesson_completed', mod.id);
      setJustCompleted(true);
    } catch {
      setSaveError(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumbs items={[{ label: 'Learn', to: '/learn' }, { label: mod.title }]} />
        <PageHeader
          eyebrow={`Module ${index + 1} · ${mod.source}`}
          title={mod.title}
          description={mod.objective}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Tabs
          label="Module sections"
          items={[
            {
              id: 'lesson',
              label: 'Lesson',
              icon: 'learn',
              content: lesson ? (
                <LessonView
                  lesson={lesson}
                  renderCheck={(item) => <PracticeItem key={item.id} item={item} />}
                />
              ) : (
                <EmptyState icon="learn" title="Lesson in preparation">
                  The lesson text is being drafted from the concept note's objectives. The key
                  equations are ready now.
                </EmptyState>
              ),
            },
            {
              id: 'video',
              label: 'Video',
              icon: 'video',
              content: (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-md border border-dashed border-rule-strong bg-surface-2 p-6 text-center text-muted">
                  <Icon name="video" size={32} />
                  <p className="font-medium text-ink">No video yet</p>
                  <p className="max-w-sm text-sm">
                    Short flipped-learning videos will come from the teacher and will be saved for
                    offline viewing.
                  </p>
                </div>
              ),
            },
            {
              id: 'equations',
              label: 'Key equations',
              icon: 'sigma',
              content: (
                <div className="grid gap-5 sm:grid-cols-2">
                  {mod.equations.map((eq) => (
                    <EquationCard key={eq.id} equation={eq} />
                  ))}
                </div>
              ),
            },
          ]}
        />

        <aside className="flex flex-col gap-6">
          <Panel eyebrow="Status" title={done ? 'Module complete' : 'When you have finished'}>
            {progress.status === 'loading' ? (
              <p className="text-sm text-muted">Checking your progress…</p>
            ) : done ? (
              <div className="flex flex-col gap-3" aria-live="polite">
                <SuccessState
                  title={justCompleted ? 'Module marked complete' : 'You completed this module'}
                >
                  It now counts in your progress
                  {relatedQuest ? (
                    <>
                      {' '}
                      and in the quest{' '}
                      <Link to={`/quests/${relatedQuest.id}`} className="text-brand underline">
                        {relatedQuest.title}
                      </Link>
                    </>
                  ) : null}
                  .
                </SuccessState>
                {next ? (
                  <ButtonLink to={`/learn/${next.id}`} iconRight="arrowRight">
                    Next: {next.title}
                  </ButtonLink>
                ) : (
                  <ButtonLink to="/quests" iconRight="arrowRight">
                    Go to quests
                  </ButtonLink>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  Read the lesson and review the key equations, then mark the module complete.
                </p>
                <Button
                  variant="primary"
                  icon="check"
                  onClick={() => void complete()}
                  disabled={progress.status === 'error'}
                >
                  Mark module complete
                </Button>
                {saveError || progress.status === 'error' ? (
                  <Callout tone="danger" role="alert" title="Progress cannot be saved">
                    This browser is blocking local storage, for example in a private window.
                  </Callout>
                ) : null}
              </div>
            )}
          </Panel>

          <Panel eyebrow="Targets" title="Ideas this module tests">
            <ul className="flex flex-col gap-3 text-sm">
              {mod.misconceptionIds.map((id) => {
                const m = getMisconception(id);
                return (
                  <li key={id}>
                    <p className="font-medium">
                      <span className="num text-muted">{id}</span> {m.short}
                    </p>
                    <p className="text-muted">“{m.belief}”</p>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <ButtonLink to="/lab" variant="secondary" icon="lab">
            Try it in the lab
          </ButtonLink>
        </aside>
      </div>
    </div>
  );
}
