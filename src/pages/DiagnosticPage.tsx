import { useParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/components/StatePanels';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Panel';
import { baselineDiagnostic, postDiagnostic } from '@/content/assessments';
import { AssessmentScreen } from '@/features/assessment/AssessmentScreen';
import { useAttempts } from '@/hooks/useAttempts';

/** /assess/:kind: the baseline or post diagnostic (test mode, taken once). */
export default function DiagnosticPage() {
  const { kind } = useParams();
  const assessment =
    kind === 'baseline' ? baselineDiagnostic : kind === 'post' ? postDiagnostic : undefined;
  const data = useAttempts();
  if (!assessment) return <NotFoundState />;

  const baselineDone = data.attempts.some((a) => a.kind === 'baseline');
  const locked = assessment.kind === 'post' && !baselineDone;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Breadcrumbs items={[{ label: 'Assess', to: '/assess' }, { label: assessment.title }]} />
        <PageHeader
          eyebrow="Diagnostic"
          title={assessment.title}
          description="Answer every question as well as you can. You get your results after you submit."
        />
      </div>
      {data.status === 'loading' ? (
        <LoadingState />
      ) : data.status === 'error' ? (
        <ErrorState title="Your results could not be loaded" onRetry={data.retry} />
      ) : locked ? (
        <EmptyState
          icon="lock"
          title="Take the baseline diagnostic first"
          action={
            <ButtonLink to="/assess/baseline" variant="primary">
              Go to the baseline diagnostic
            </ButtonLink>
          }
        >
          The post diagnostic compares your thinking with the baseline, so the baseline comes first.
        </EmptyState>
      ) : (
        <AssessmentScreen
          key={assessment.id}
          assessment={assessment}
          allowRetake={false}
          exit={
            <ButtonLink to="/progress" variant="primary" iconRight="arrowRight">
              See your progress
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
