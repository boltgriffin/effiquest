import { useState } from 'react';
import { ItemView } from '@/components/assessment/ItemView';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { getMisconception } from '@/content/misconceptions';
import type { AssessmentItem, ItemResponse } from '@/types';
import { checkItem, correctAnswerText, PRACTICE_MAX_TRIES } from './scoring';

/**
 * One practice question inside a lesson: check, one more try, then the answer and explanation.
 * Same marking and retry rule as the quest knowledge checks; nothing is recorded.
 */
export function PracticeItem({ item }: { item: AssessmentItem }) {
  const [response, setResponse] = useState<ItemResponse | undefined>(undefined);
  const [tries, setTries] = useState(0);
  const [checked, setChecked] = useState<string | null>(null);

  const result = checkItem(item, response);
  const current = JSON.stringify(response ?? null);
  const lastCheck = checked === null ? null : checkItem(item, JSON.parse(checked) as ItemResponse);
  const settled = Boolean(lastCheck?.correct) || tries >= PRACTICE_MAX_TRIES;
  // A changed answer hides the "not quite" message until it is checked again.
  const showFeedback = lastCheck !== null && (settled || checked === current);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-rule bg-surface-2/40 p-4">
      <p className="font-mono text-xs tracking-wide text-muted uppercase">
        Check your understanding
      </p>
      <ItemView
        item={item}
        response={response}
        onChange={setResponse}
        disabled={settled}
        showAnswer={settled}
        inputError={result.inputError}
      />
      <div aria-live="polite" aria-atomic="true">
        {showFeedback && lastCheck ? (
          lastCheck.correct ? (
            <Callout tone="success" title={tries === 1 ? 'Correct' : 'Correct this time'}>
              {item.kind !== 'reflection' ? item.explanation : null}
            </Callout>
          ) : settled ? (
            <Callout tone="danger" title="Not correct">
              <p>
                Correct answer: <strong>{correctAnswerText(item)}</strong>
              </p>
              {item.kind !== 'reflection' ? <p>{item.explanation}</p> : null}
            </Callout>
          ) : (
            <Callout tone="warning" title="Not quite">
              {lastCheck.revealed ? (
                <p>
                  This answer matches a common idea: “{getMisconception(lastCheck.revealed).belief}”
                </p>
              ) : null}
              <p>Look again and try once more.</p>
            </Callout>
          )
        ) : null}
      </div>
      {!settled ? (
        <div>
          <Button
            variant="primary"
            icon="check"
            disabled={!result.answered || Boolean(result.inputError)}
            onClick={() => {
              setTries((t) => t + 1);
              setChecked(current);
            }}
          >
            {tries > 0 && checked === current ? 'Check again' : 'Check answer'}
          </Button>
        </div>
      ) : (
        <div>
          <Button
            variant="ghost"
            icon="reset"
            onClick={() => {
              setResponse(undefined);
              setTries(0);
              setChecked(null);
            }}
          >
            Try this question again
          </Button>
        </div>
      )}
    </div>
  );
}
