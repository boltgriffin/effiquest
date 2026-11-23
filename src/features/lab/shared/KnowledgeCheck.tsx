import { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { cx } from '@/utils/cx';
import { knowledgeScore } from './knowledge';
import type { KnowledgeItem } from './types';

/**
 * Formative knowledge check: unlike the diagnostic, each answer gets immediate feedback with an
 * explanation, and learners may try again. Nothing is saved.
 */
export function KnowledgeCheck({
  items,
  labId,
}: {
  items: readonly KnowledgeItem[];
  labId: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const score = knowledgeScore(items, answers);

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, n) => {
        const chosen = answers[item.id];
        const correct = chosen === item.correctId;
        return (
          <fieldset key={item.id} className="flex flex-col gap-2">
            <legend className="mb-2 font-medium">
              {n + 1}. {item.question}
            </legend>
            {item.options.map((o) => {
              const isChosen = chosen === o.id;
              return (
                <label
                  key={o.id}
                  className={cx(
                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
                    isChosen && correct && 'border-success bg-success/10',
                    isChosen && !correct && 'border-danger bg-danger/10',
                    !isChosen && 'border-rule',
                  )}
                >
                  <input
                    type="radio"
                    name={`${labId}-${item.id}`}
                    value={o.id}
                    checked={isChosen}
                    onChange={() => setAnswers((a) => ({ ...a, [item.id]: o.id }))}
                    className="size-4 accent-[var(--brand)]"
                  />
                  <span className="flex-1">{o.label}</span>
                  {isChosen ? (
                    <Icon
                      name={correct ? 'check' : 'close'}
                      size={18}
                      className={correct ? 'text-success' : 'text-danger'}
                    />
                  ) : null}
                </label>
              );
            })}
            {chosen !== undefined ? (
              <p role="status" className={cx('text-sm', correct ? 'text-success' : 'text-danger')}>
                <span className="font-medium">{correct ? 'Correct.' : 'Not quite.'}</span>{' '}
                <span className="text-ink">{item.explanation}</span>
              </p>
            ) : null}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
        <p aria-live="polite" className="num text-sm">
          {score.correct} of {score.total} correct
          {score.answered < score.total ? ` (${score.total - score.answered} unanswered)` : ''}
        </p>
        <Button
          size="sm"
          icon="reset"
          onClick={() => setAnswers({})}
          disabled={score.answered === 0}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
