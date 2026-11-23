import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Progress';
import { getMisconception } from '@/content/misconceptions';
import { modules } from '@/content/modules';
import { quests } from '@/content/quests';
import type { Assessment, MisconceptionId } from '@/types';
import { cx } from '@/utils/cx';
import { correctAnswerText, responseText, type AttemptScore, type IdeaScore } from './scoring';

const bandLabel: Record<IdeaScore['band'], string> = {
  strength: 'Strength',
  developing: 'Developing',
  'needs-work': 'Keep working',
};
const bandTone = { strength: 'success', developing: 'warning', 'needs-work': 'danger' } as const;

/** Where to revisit an idea: its quest if there is one, else a module that targets it. */
function revisitLink(id: MisconceptionId): { to: string; label: string } | null {
  const q = quests.find((x) => x.misconceptionId === id);
  if (q) return { to: `/quests/${q.id}`, label: `Quest: ${q.title}` };
  const m = modules.find((x) => x.misconceptionIds.includes(id));
  return m ? { to: `/learn/${m.id}`, label: `Module: ${m.title}` } : null;
}

export function ResultsSummary({
  assessment,
  result,
  submittedAt,
  actions,
  headingRef,
}: {
  assessment: Assessment;
  result: AttemptScore;
  submittedAt: string;
  actions?: ReactNode;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  const practice = assessment.mode === 'practice';
  const strengths = result.ideas.filter((i) => i.band === 'strength');
  const improve = result.ideas
    .filter((i) => i.band !== 'strength')
    .sort((a, b) => a.percent - b.percent);
  const reflections = result.items.filter((r) => r.item.kind === 'reflection');

  return (
    <div className="flex flex-col gap-6">
      <Panel eyebrow="Results" title={assessment.title}>
        <h2 ref={headingRef} tabIndex={-1} className="sr-only">
          Results: {assessment.title}
        </h2>
        <div role="status" className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="num text-4xl">
            {result.score}
            <span className="text-xl text-muted"> / {result.maxScore}</span>
          </p>
          <p className="pb-1 text-sm text-muted">
            {practice ? 'points for answers correct on the first try' : 'points'} ·{' '}
            <span className="num">{result.percent}%</span>
          </p>
        </div>
        <p className="mt-2 text-sm text-muted">
          Submitted{' '}
          {new Date(submittedAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          . Saved on this device.
        </p>
        {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
      </Panel>

      <Panel eyebrow="By idea" title="Strengths and areas to improve">
        <ul className="flex flex-col gap-4">
          {result.ideas.map((i) => (
            <li key={i.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  <span className="num text-muted">{i.id}</span> {getMisconception(i.id).short}
                </span>
                <Badge tone={bandTone[i.band]}>{bandLabel[i.band]}</Badge>
              </div>
              <ProgressBar
                label={`${i.points} of ${i.maxPoints} points`}
                value={i.points}
                max={i.maxPoints}
              />
            </li>
          ))}
        </ul>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-display text-base">Strengths</h3>
            {strengths.length ? (
              <ul className="mt-1 list-disc pl-5 text-sm">
                {strengths.map((i) => (
                  <li key={i.id}>{getMisconception(i.id).short}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">None yet: every idea has room to grow.</p>
            )}
          </div>
          <div>
            <h3 className="font-display text-base">Areas to improve</h3>
            {improve.length ? (
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {improve.map((i) => {
                  const link = revisitLink(i.id);
                  return (
                    <li key={i.id}>
                      {getMisconception(i.id).short}
                      {link ? (
                        <>
                          {' · '}
                          <Link to={link.to} className="text-brand underline">
                            {link.label}
                          </Link>
                        </>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">None: well done.</p>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">
          Strength: 75% or more of the points for that idea. Keep working: below 50%. These cut-offs
          are a draft for the teacher to confirm.
        </p>
      </Panel>

      {assessment.revealAnswers ? (
        <Panel eyebrow="Review" title="Your answers">
          <ol className="flex flex-col divide-y divide-rule">
            {result.items.map((r, n) =>
              r.item.kind === 'reflection' ? null : (
                <li key={r.item.id} className="flex gap-3 py-4 first:pt-0">
                  <Icon
                    name={r.check.correct ? 'check' : 'close'}
                    className={cx(
                      'mt-1 shrink-0',
                      r.check.correct ? 'text-success' : 'text-danger',
                    )}
                    label={r.check.correct ? 'Correct' : 'Not correct'}
                  />
                  <div className="flex min-w-0 flex-col gap-1 text-sm">
                    <p className="font-medium">
                      {n + 1}. {r.item.prompt}
                    </p>
                    <p>
                      <span className="text-muted">Your answer: </span>
                      {responseText(r.item, r.response)}
                    </p>
                    {!r.check.correct ? (
                      <p>
                        <span className="text-muted">Correct answer: </span>
                        {correctAnswerText(r.item)}
                      </p>
                    ) : null}
                    {r.check.revealed ? (
                      <p className="text-muted">
                        This answer matches the idea: “{getMisconception(r.check.revealed).belief}”
                      </p>
                    ) : null}
                    <p className="text-muted">{r.item.explanation}</p>
                    <p className="num text-xs text-muted">
                      {r.points} / {r.check.maxPoints} point{r.check.maxPoints === 1 ? '' : 's'}
                      {practice && r.tries > 1 ? ` · ${r.tries} tries` : ''}
                    </p>
                  </div>
                </li>
              ),
            )}
          </ol>
        </Panel>
      ) : (
        <Callout tone="info" title="Why the answers are not shown">
          You will take the same diagnostic again at the end of the quarter, so the answers stay
          hidden until then. Your teacher can talk them through with you.
        </Callout>
      )}

      {reflections.map((r) => (
        <Panel key={r.item.id} eyebrow="Your reflection (not marked)" title={r.item.prompt}>
          <p className="text-sm whitespace-pre-wrap">{responseText(r.item, r.response)}</p>
        </Panel>
      ))}
    </div>
  );
}
