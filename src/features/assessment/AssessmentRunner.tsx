import { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { SampleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { TextField } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/Progress';
import { getMisconception } from '@/content/misconceptions';
import { cx } from '@/utils/cx';
import { sampleItems } from './sampleItems';
import { scoreAll } from './score';

/** One item per screen; no feedback until the end (a diagnostic measures, it does not teach). */
export function AssessmentRunner({ onExit }: { onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const item = sampleItems[index];
  const total = sampleItems.length;

  if (submitted) {
    const { results, score, max } = scoreAll(sampleItems, responses);
    return (
      <Panel eyebrow="Sample items" title="Results" actions={<SampleBadge>Not saved</SampleBadge>}>
        <p className="num text-4xl">
          {score}
          <span className="text-xl text-muted"> / {max}</span>
        </p>
        <ol className="mt-4 divide-y divide-rule border-y border-rule">
          {results.map((r, i) => (
            <li key={r.itemId} className="flex gap-3 py-3 text-sm">
              <Icon
                name={r.correct ? 'check' : 'close'}
                className={cx('mt-0.5 shrink-0', r.correct ? 'text-success' : 'text-danger')}
                label={r.correct ? 'Correct' : 'Incorrect'}
              />
              <div>
                <p>
                  Item {i + 1}: {r.correct ? 'correct' : r.answered ? 'incorrect' : 'not answered'}
                </p>
                {r.revealed ? (
                  <p className="text-muted">
                    This answer matches the idea: “{getMisconception(r.revealed).belief}”
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            icon="reset"
            onClick={() => {
              setResponses({});
              setIndex(0);
              setSubmitted(false);
            }}
          >
            Try again
          </Button>
          <Button onClick={onExit}>Back to diagnostics</Button>
        </div>
      </Panel>
    );
  }

  if (!item) return null;
  const response = responses[item.id] ?? '';
  const setResponse = (value: string) => setResponses((r) => ({ ...r, [item.id]: value }));
  const last = index === total - 1;

  return (
    <Panel
      eyebrow={`Item ${index + 1} of ${total}`}
      title="Sample assessment"
      actions={<SampleBadge>Layout sample</SampleBadge>}
      bodyClassName="flex flex-col gap-5"
    >
      <ProgressBar
        label="Answered"
        value={Object.values(responses).filter((v) => v.trim()).length}
        max={total}
      />
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (last) setSubmitted(true);
          else setIndex((i) => i + 1);
        }}
      >
        {item.type === 'mcq' ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 font-display text-xl leading-snug">{item.stem}</legend>
            {item.options.map((o, i) => (
              <label
                key={o.id}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-rule px-3 py-2 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
              >
                <input
                  type="radio"
                  name={item.id}
                  value={o.id}
                  checked={response === o.id}
                  onChange={() => setResponse(o.id)}
                  className="size-4 accent-[var(--brand)]"
                />
                <span className="num w-5 text-sm text-muted">{String.fromCharCode(65 + i)}</span>
                <span className="text-[0.95rem]">{o.label}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="flex flex-col gap-4">
            <p id={`${item.id}-stem`} className="font-display text-xl leading-snug">
              {item.stem}
            </p>
            <div className="max-w-56">
              <TextField
                label="Your answer"
                unit={item.unit}
                type="number"
                inputMode="decimal"
                step="any"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                aria-describedby={`${item.id}-stem`}
              />
            </div>
          </div>
        )}
        <div className="flex justify-between gap-2 border-t border-rule pt-4">
          <Button icon="chevronLeft" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Previous
          </Button>
          <Button type="submit" variant="primary" iconRight={last ? 'check' : 'chevronRight'}>
            {last ? 'Submit answers' : 'Next item'}
          </Button>
        </div>
      </form>
      <Callout tone="info">
        These three items only demonstrate the assessment screen. The real baseline and post
        diagnostics will be supplied by the teacher.
      </Callout>
    </Panel>
  );
}
