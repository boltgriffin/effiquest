import { useState, type ReactNode } from 'react';
import { ErrorState, LoadingState } from '@/components/StatePanels';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Panel } from '@/components/ui/Panel';
import { useAttempts } from '@/hooks/useAttempts';
import type { Assessment } from '@/types';
import { AssessmentRunner } from './AssessmentRunner';
import { attemptsFor, restoreAttempt } from './history';
import { ResultsSummary } from './ResultsSummary';

/**
 * Shows the latest results if the learner has submitted this assessment before, otherwise runs
 * it. Practice checks can be retaken (each retake is a new attempt; earlier ones are kept).
 * Diagnostics are taken once (`allowRetake` false).
 */
export function AssessmentScreen({
  assessment,
  allowRetake,
  exit,
}: {
  assessment: Assessment;
  allowRetake: boolean;
  /** Link(s) shown with the results, e.g. back to the quest. */
  exit: ReactNode;
}) {
  const data = useAttempts();
  const [retaking, setRetaking] = useState(0);

  if (data.status === 'loading') return <LoadingState label="Loading your results…" />;
  if (data.status === 'error') {
    return <ErrorState title="Your results could not be loaded" onRetry={data.retry} />;
  }

  const actions = (
    <>
      {allowRetake ? (
        <Button icon="reset" onClick={() => setRetaking((n) => n + 1)}>
          Try again
        </Button>
      ) : null}
      {exit}
    </>
  );

  const latest = attemptsFor(data.attempts, assessment.id)[0];
  // No attempt yet, or a new one was started on this screen.
  if (!latest || retaking > 0) {
    return (
      <AssessmentRunner
        key={`${assessment.id}-${retaking}`}
        assessment={assessment}
        ownerId={data.ownerId}
        resultActions={actions}
      />
    );
  }

  const restored = restoreAttempt(assessment, latest, data.responses[latest.id] ?? []);
  if (!restored) {
    return (
      <Panel eyebrow="Results" title={assessment.title}>
        <p className="num text-4xl">
          {latest.score}
          <span className="text-xl text-muted"> / {latest.maxScore}</span>
        </p>
        <Callout tone="info" className="mt-4">
          The questions have been updated since you answered them, so only your score is shown.
        </Callout>
        <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
      </Panel>
    );
  }
  return (
    <ResultsSummary
      assessment={assessment}
      result={restored}
      submittedAt={latest.submittedAt}
      actions={actions}
    />
  );
}
