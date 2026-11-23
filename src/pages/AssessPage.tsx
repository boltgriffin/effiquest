import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '@/components/StatePanels';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { baselineDiagnostic, postDiagnostic } from '@/content/assessments';
import { quests } from '@/content/quests';
import { attemptsFor } from '@/features/assessment/history';
import { useAttempts } from '@/hooks/useAttempts';
import type { Assessment } from '@/types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });

const diagnostics: Array<{ a: Assessment; to: string; when: string }> = [
  { a: baselineDiagnostic, to: '/assess/baseline', when: 'Weeks 1-2, before the modules' },
  { a: postDiagnostic, to: '/assess/post', when: 'Weeks 11-12, after the modules' },
];

const checks = quests.flatMap((q) =>
  q.stages.flatMap((s) => (s.kind === 'check' ? [{ quest: q, assessmentId: s.assessmentId }] : [])),
);

export default function AssessPage() {
  const data = useAttempts();
  const baselineDone = data.attempts.some((a) => a.kind === 'baseline');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assess"
        title="Diagnostics and knowledge checks"
        description="The same diagnostic is taken before and after the modules, so you can see how your thinking changed."
      />
      <Callout tone="warning" title="Draft questions">
        All questions were drafted from the concept note&apos;s objectives and are waiting for the
        teacher&apos;s review. They may change before the classroom pilot.
      </Callout>

      {data.status === 'loading' ? <LoadingState label="Loading your results…" /> : null}
      {data.status === 'error' ? (
        <ErrorState title="Your results could not be loaded" onRetry={data.retry} />
      ) : null}

      {data.status === 'ready' ? (
        <>
          <Panel eyebrow="Test · taken once" title="Diagnostics" bodyClassName="p-0 sm:p-0">
            <ul className="divide-y divide-rule">
              {diagnostics.map(({ a, to, when }) => {
                const done = attemptsFor(data.attempts, a.id)[0];
                const draft = data.drafts.find((d) => d.assessmentId === a.id);
                const locked = a.kind === 'post' && !baselineDone;
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
                  >
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted">
                        {when} · {a.items.length} questions
                      </p>
                      {done ? (
                        <p className="text-sm">
                          Submitted {formatDate(done.submittedAt)} ·{' '}
                          <span className="num">
                            {done.score} / {done.maxScore}
                          </span>{' '}
                          points
                        </p>
                      ) : null}
                    </div>
                    {done ? (
                      <ButtonLink to={to} iconRight="chevronRight">
                        See results<span className="sr-only">: {a.title}</span>
                      </ButtonLink>
                    ) : locked ? (
                      <Badge>After the baseline</Badge>
                    ) : (
                      <ButtonLink to={to} variant="primary" iconRight="chevronRight">
                        {draft ? 'Continue' : 'Start'}
                        <span className="sr-only">: {a.title}</span>
                      </ButtonLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel eyebrow="Practice" title="Knowledge checks" bodyClassName="p-0 sm:p-0">
            <ul className="divide-y divide-rule">
              {checks.map(({ quest, assessmentId }) => {
                const all = attemptsFor(data.attempts, assessmentId);
                const latest = all[0];
                return (
                  <li
                    key={assessmentId}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
                  >
                    <div>
                      <p className="font-medium">{quest.title}</p>
                      <p className="text-sm text-muted">
                        {latest
                          ? `Latest: ${latest.score} of ${latest.maxScore} correct first time · ${all.length} attempt${all.length === 1 ? '' : 's'}`
                          : 'Not tried yet'}
                      </p>
                    </div>
                    <Link
                      to={`/quests/${quest.id}/check`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-brand hover:bg-brand-soft"
                    >
                      {latest ? 'Review' : 'Open'}
                      <span className="sr-only">: knowledge check for {quest.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
