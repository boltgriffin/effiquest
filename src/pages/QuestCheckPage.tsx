import { useParams } from 'react-router-dom';
import { NotFoundState } from '@/components/StatePanels';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Panel';
import { findAssessment } from '@/content/assessments';
import { findQuest } from '@/content/quests';
import { AssessmentScreen } from '@/features/assessment/AssessmentScreen';

/** /quests/:questId/check: the quest's knowledge check (practice: feedback and retries). */
export default function QuestCheckPage() {
  const { questId } = useParams();
  const quest = findQuest(questId);
  const stage = quest?.stages.find((s) => s.kind === 'check');
  const assessment = stage?.kind === 'check' ? findAssessment(stage.assessmentId) : undefined;
  if (!quest || !assessment) return <NotFoundState />;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Quests', to: '/quests' },
            { label: quest.title, to: `/quests/${quest.id}` },
            { label: 'Knowledge check' },
          ]}
        />
        <PageHeader
          eyebrow={`Quest · ${quest.misconceptionId} · Knowledge check`}
          title={assessment.title}
          description="Practice: you get feedback after each answer and can try a wrong answer once more."
        />
      </div>
      <AssessmentScreen
        key={assessment.id}
        assessment={assessment}
        allowRetake
        exit={
          <ButtonLink to={`/quests/${quest.id}`} variant="primary" iconRight="arrowRight">
            Back to the quest
          </ButtonLink>
        }
      />
    </div>
  );
}
