import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '@/components/StatePanels';
import { SampleBadge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import { findAssessment } from '@/content/assessments';
import { misconceptions } from '@/content/misconceptions';
import { summarize } from '@/content/progress';
import { quests } from '@/content/quests';
import { diagnosticPercents } from '@/features/assessment/history';
import { PrePostChart, type PrePostRow } from '@/features/progress/PrePostChart';
import { useAttempts } from '@/hooks/useAttempts';
import { useProgress } from '@/hooks/useProgress';

// Invented numbers for layout review only; shown with a "Sample data" badge.
const SAMPLE_BASELINE = [35, 28, 40, 22, 45, 30];
const SAMPLE_POST = [70, 64, 72, 58, 75, 66];

const sampleRows: PrePostRow[] = misconceptions.map((m, i) => ({
  id: m.id,
  label: m.short,
  baseline: SAMPLE_BASELINE[i] ?? 0,
  post: SAMPLE_POST[i] ?? 0,
}));

const attemptLink = (assessmentId: string): string => {
  const q = quests.find((x) =>
    x.stages.some((s) => s.kind === 'check' && s.assessmentId === assessmentId),
  );
  if (q) return `/quests/${q.id}/check`;
  return assessmentId === 'diagnostic-post' ? '/assess/post' : '/assess/baseline';
};

export default function ProgressPage() {
  const [sample, setSample] = useState(false);
  const progress = useProgress();
  const data = useAttempts();
  const summary = summarize(progress.events);

  const baseline = diagnosticPercents(data.attempts, data.responses, 'baseline');
  const post = diagnosticPercents(data.attempts, data.responses, 'post');
  const realRows: PrePostRow[] | null = baseline
    ? misconceptions.flatMap((m) => {
        const b = baseline[m.id];
        if (b === undefined) return [];
        return [{ id: m.id, label: m.short, baseline: b, post: post?.[m.id] ?? null }];
      })
    : null;
  const rows = sample ? sampleRows : realRows;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Progress"
        title="How your thinking has changed"
        description="Your work so far, and your results per idea from the baseline diagnostic to the post diagnostic."
        actions={sample ? <SampleBadge>Sample data</SampleBadge> : null}
      />

      {progress.status === 'error' || data.status === 'error' ? (
        <ErrorState
          title="Your progress could not be loaded"
          onRetry={() => {
            progress.retry();
            data.retry();
          }}
        />
      ) : null}

      <Panel
        eyebrow="Activity"
        title="Work completed"
        bodyClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <ProgressBar
          label={`Lessons opened ${summary.lessonsOpened} of ${summary.modulesTotal}`}
          value={summary.lessonsOpened}
          max={summary.modulesTotal}
        />
        <ProgressBar
          label={`Modules completed ${summary.modulesDone} of ${summary.modulesTotal}`}
          value={summary.modulesDone}
          max={summary.modulesTotal}
        />
        <ProgressBar
          label={`Labs completed ${summary.labsDone} of ${summary.labsTotal}`}
          value={summary.labsDone}
          max={summary.labsTotal}
        />
        <ProgressBar
          label={`Knowledge checks ${summary.checksDone} of ${summary.checksTotal}`}
          value={summary.checksDone}
          max={summary.checksTotal}
        />
        <ProgressBar
          label={`Quests completed ${summary.questsDone} of ${summary.questsTotal}`}
          value={summary.questsDone}
          max={summary.questsTotal}
        />
        <p className="self-end text-sm text-muted">
          Time spent is not recorded: it cannot be measured reliably offline and does not show
          learning.
        </p>
      </Panel>

      <h2 className="font-display text-2xl">Diagnostics</h2>
      <Switch
        label="Preview with sample data"
        checked={sample}
        onChange={setSample}
        description="Shows invented numbers so you can review the layout. They are not your results."
      />

      {data.status === 'loading' && !sample ? (
        <LoadingState label="Loading your results…" />
      ) : rows ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel eyebrow="Diagnostics" title={post || sample ? 'Baseline vs post' : 'Baseline'}>
            <PrePostChart rows={rows} />
            {!sample && !post ? (
              <p className="mt-3 text-sm text-muted">
                The post diagnostic (weeks 11-12) will appear next to your baseline.
              </p>
            ) : null}
          </Panel>
          <Panel
            eyebrow={post || sample ? 'Post diagnostic' : 'Baseline diagnostic'}
            title="Understanding by idea"
            bodyClassName="flex flex-col gap-4"
          >
            {rows.map((r) => (
              <ProgressBar
                key={r.id}
                label={`${r.id} · ${r.label}`}
                value={r.post ?? r.baseline}
                tone="chart-2"
              />
            ))}
          </Panel>
        </div>
      ) : (
        <EmptyState
          icon="progress"
          title="No diagnostic results yet"
          action={
            <ButtonLink to="/assess" variant="primary">
              Go to diagnostics
            </ButtonLink>
          }
        >
          Your results appear here after you take the baseline diagnostic.
        </EmptyState>
      )}

      <Panel eyebrow="Record" title="Assessment attempts" bodyClassName="p-0 sm:p-0">
        {data.attempts.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted sm:px-5">No attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Your submitted assessments, newest first</caption>
              <thead>
                <tr className="border-b border-rule text-left text-muted">
                  <th scope="col" className="px-4 py-2 font-medium sm:px-5">
                    Assessment
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    Score
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {[...data.attempts].reverse().map((a) => (
                  <tr key={a.id}>
                    <th scope="row" className="px-4 py-2 text-left font-normal sm:px-5">
                      <Link to={attemptLink(a.assessmentId)} className="text-brand underline">
                        {findAssessment(a.assessmentId)?.title ?? a.assessmentId}
                      </Link>
                    </th>
                    <td className="num px-2 py-2 text-right">
                      {a.score} / {a.maxScore}
                    </td>
                    <td className="px-4 py-2 text-right text-muted sm:px-5">
                      {new Date(a.submittedAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
