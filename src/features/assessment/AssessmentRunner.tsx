import { useEffect, useRef, type ReactNode } from 'react';
import { ItemView } from '@/components/assessment/ItemView';
import { Icon } from '@/components/icons/Icon';
import { LoadingState } from '@/components/StatePanels';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Progress';
import { getMisconception } from '@/content/misconceptions';
import type { Assessment, AssessmentItem, ItemResponse } from '@/types';
import { cx } from '@/utils/cx';
import { ResultsSummary } from './ResultsSummary';
import { checkItem, correctAnswerText, isAnswered, PRACTICE_MAX_TRIES } from './scoring';
import { useAssessmentSession, type PracticeFeedback } from './useAssessmentSession';

export function DraftBadge() {
  return <Badge tone="sample">Draft items · teacher review</Badge>;
}

/**
 * Runs one attempt, one item per screen.
 * - test mode (diagnostics): no feedback until submission; a review screen lists unanswered items.
 * - practice mode (knowledge checks): "Check answer" gives feedback; a wrong answer may be tried
 *   again once, then the answer and explanation are shown.
 */
export function AssessmentRunner({
  assessment,
  ownerId,
  resultActions,
}: {
  assessment: Assessment;
  ownerId: string;
  /** Buttons under the results (e.g. back to the quest, try again). */
  resultActions?: ReactNode;
}) {
  const session = useAssessmentSession(assessment, ownerId);
  const { state } = session;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const index = state.status === 'loading' ? -1 : state.draft.index;

  // Move focus to the new question (or the results) so keyboard and screen-reader users follow.
  const first = useRef(true);
  useEffect(() => {
    if (index < 0) return;
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index, state.status]);

  if (state.status === 'loading') return <LoadingState label="Loading your answers…" />;

  if (state.status === 'submitted') {
    return (
      <ResultsSummary
        assessment={assessment}
        result={state.result}
        submittedAt={state.attempt.submittedAt}
        actions={resultActions}
        headingRef={headingRef}
      />
    );
  }

  const { draft } = state;
  const items = assessment.items;
  const total = items.length;
  const answered = items.filter((i) => isAnswered(i, draft.responses[i.id])).length;
  const practice = assessment.mode === 'practice';
  const submitting = state.status === 'submitting';

  const saveNote = session.saveError ? (
    <Callout tone="danger" role="alert" title="Answers cannot be saved">
      This browser is blocking storage on this device (for example in a private window). Do not
      close this page until you submit.
    </Callout>
  ) : null;

  const resumedNote =
    state.status === 'working' && state.resumed ? (
      <p className="text-sm text-muted" role="status">
        Welcome back: your earlier answers were kept.
      </p>
    ) : null;

  // Review screen (test mode) before submitting.
  if (draft.index >= total) {
    const missing = items
      .map((item, n) => ({ item, n, a: isAnswered(item, draft.responses[item.id]) }))
      .filter((x) => !x.a);
    const unreadable = items
      .map((item, n) => ({ item, n, c: checkItem(item, draft.responses[item.id]) }))
      .filter((x) => x.c.inputError);
    return (
      <Panel eyebrow="Review" title={assessment.title} actions={<DraftBadge />}>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl">
          Check your answers before you submit
        </h2>
        <ProgressBar
          className="mt-4"
          label={`${answered} of ${total} answered`}
          value={answered}
          max={total}
        />
        <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item, n) => {
            const a = isAnswered(item, draft.responses[item.id]);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => session.goTo(n)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-md border border-rule px-3 text-left text-sm hover:bg-surface-2"
                >
                  <Icon
                    name={a ? 'check' : 'alert'}
                    size={16}
                    className={a ? 'text-success' : 'text-warning'}
                  />
                  <span>
                    Question {n + 1}: {a ? 'answered' : 'no answer'}
                  </span>
                  <span className="sr-only">(go to question)</span>
                </button>
              </li>
            );
          })}
        </ol>
        {missing.length ? (
          <Callout tone="warning" className="mt-4" title={`${missing.length} without an answer`}>
            You can still submit. Questions without an answer score 0.
          </Callout>
        ) : null}
        {unreadable.length ? (
          <Callout tone="warning" className="mt-4" title="Some numbers cannot be read">
            Question{unreadable.length > 1 ? 's' : ''} {unreadable.map((x) => x.n + 1).join(', ')}:{' '}
            type the number only.
          </Callout>
        ) : null}
        <p className="mt-4 text-sm text-muted">
          {assessment.kind === 'quest_check'
            ? 'After you submit you will see your results.'
            : 'You can submit this diagnostic once. After you submit, the answers cannot be changed.'}
        </p>
        <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-rule pt-4">
          <Button icon="chevronLeft" onClick={() => session.goTo(total - 1)}>
            Back to questions
          </Button>
          <Button
            variant="primary"
            icon="check"
            disabled={submitting}
            onClick={() => void session.submit()}
          >
            {submitting ? 'Submitting…' : 'Submit answers'}
          </Button>
        </div>
        <div className="mt-4">{saveNote}</div>
      </Panel>
    );
  }

  const item = items[draft.index];
  if (!item) return null;
  const response = draft.responses[item.id];
  const check = checkItem(item, response);
  const feedback = practice ? session.feedbackFor(draft, item.id) : null;
  const settled = Boolean(feedback?.settled);
  const last = draft.index === total - 1;
  // Test mode: show an unreadable number straight away; practice: only after "Check answer".
  const inputError = check.inputError;

  return (
    <Panel
      eyebrow={`Question ${draft.index + 1} of ${total}`}
      title={assessment.title}
      actions={<DraftBadge />}
      bodyClassName="flex flex-col gap-5"
    >
      {resumedNote}
      <ProgressBar label={`${answered} of ${total} answered`} value={answered} max={total} />
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        Question {draft.index + 1} of {total}
      </h2>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (practice && !settled) session.check(item.id);
          else session.goTo(draft.index + 1);
        }}
      >
        <ItemView
          key={item.id}
          item={item}
          response={response}
          onChange={(r: ItemResponse) => session.setResponse(item.id, r)}
          disabled={settled || submitting}
          showAnswer={settled}
          inputError={inputError}
        />

        <div aria-live="polite" aria-atomic="true">
          {feedback ? <Feedback item={item} feedback={feedback} revealed={check.revealed} /> : null}
        </div>

        <div className="flex flex-wrap justify-between gap-2 border-t border-rule pt-4">
          <Button
            icon="chevronLeft"
            disabled={draft.index === 0}
            onClick={() => session.goTo(draft.index - 1)}
          >
            Previous
          </Button>
          {practice && !settled ? (
            <Button
              type="submit"
              variant="primary"
              icon="check"
              disabled={!check.answered || Boolean(inputError)}
            >
              {feedback && !feedback.correct ? 'Check again' : 'Check answer'}
            </Button>
          ) : practice && last ? (
            <Button
              variant="primary"
              icon="check"
              disabled={submitting}
              onClick={() => void session.submit()}
            >
              {submitting ? 'Saving…' : 'See my results'}
            </Button>
          ) : (
            <Button type="submit" variant="primary" iconRight="chevronRight">
              {last ? 'Review answers' : practice ? 'Next question' : 'Next'}
            </Button>
          )}
        </div>
      </form>
      {saveNote}
    </Panel>
  );
}

function Feedback({
  item,
  feedback,
  revealed,
}: {
  item: AssessmentItem;
  feedback: PracticeFeedback;
  revealed: ReturnType<typeof checkItem>['revealed'];
}) {
  if (feedback.correct) {
    return (
      <Callout tone="success" title={feedback.tries === 1 ? 'Correct' : 'Correct this time'}>
        {item.explanation}
      </Callout>
    );
  }
  const triesLeft = PRACTICE_MAX_TRIES - feedback.tries;
  return (
    <Callout
      tone={feedback.settled ? 'danger' : 'warning'}
      title={feedback.settled ? 'Not correct' : 'Not quite'}
    >
      <div className={cx('flex flex-col gap-1')}>
        {revealed ? (
          <p>This answer matches a common idea: “{getMisconception(revealed).belief}”</p>
        ) : null}
        {item.kind === 'matching' && !feedback.settled ? (
          <p>Some matches are not right yet.</p>
        ) : null}
        {feedback.settled ? (
          <>
            <p>
              Correct answer: <strong>{correctAnswerText(item)}</strong>
            </p>
            <p>{item.explanation}</p>
          </>
        ) : (
          <p>
            Look at your answer again and try once more ({triesLeft}{' '}
            {triesLeft === 1 ? 'try' : 'tries'} left).
          </p>
        )}
      </div>
    </Callout>
  );
}
