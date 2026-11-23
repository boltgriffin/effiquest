import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Slider } from '@/components/ui/Slider';
import type { LabParams, VariableSpec } from './types';

interface VariablesPanelProps<P extends LabParams> {
  title: string;
  params: P;
  defaults: P;
  variables: ReadonlyArray<VariableSpec<P>>;
  onChange: (params: P) => void;
  /** Settings are locked while a run is playing or paused. */
  locked: boolean;
}

/**
 * The variables a learner may change, from the machine definition. Effort is never here:
 * it is measured. Every change is announced so the learner knows to run again.
 */
export function VariablesPanel<P extends LabParams>({
  title,
  params,
  defaults,
  variables,
  onChange,
  locked,
}: VariablesPanelProps<P>) {
  const [message, setMessage] = useState<string | null>(null);

  const update = (next: P, what: string) => {
    onChange(next);
    setMessage(`${what}. Press Start to measure this set-up.`);
  };

  return (
    <Panel eyebrow="Variables" title={title} bodyClassName="flex flex-col gap-5">
      {locked ? (
        <p className="text-sm text-muted">
          Settings are locked during a run. Wait for it to finish, or press Reset.
        </p>
      ) : null}
      <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-60">
        {variables.map((v) =>
          v.kind === 'slider' ? (
            <Slider
              key={v.key}
              label={v.label}
              name={v.name}
              symbol={v.symbol}
              value={params[v.key] ?? v.min}
              min={v.min}
              max={v.max}
              step={v.step}
              digits={v.digits ?? 0}
              unit={v.unit}
              hint={v.hint?.(params)}
              onChange={(value) =>
                update(
                  { ...params, [v.key]: value },
                  `${v.label} ${value.toFixed(v.digits ?? 0)}${v.unit ? ` ${v.unit}` : ''}`,
                )
              }
            />
          ) : (
            <div key={v.key}>
              <SegmentedControl
                legend={v.legend}
                value={String(params[v.key])}
                options={v.options.map((o) => ({ value: String(o.value), label: o.label }))}
                onChange={(value) => {
                  const next = { ...params, [v.key]: Number(value) };
                  update(next, v.describe ? v.describe(next) : `${v.legend} ${value}`);
                }}
              />
              {v.describe ? <p className="mt-1 text-sm text-muted">{v.describe(params)}</p> : null}
            </div>
          ),
        )}
        <div>
          <Button
            size="sm"
            icon="reset"
            onClick={() => update(defaults, 'Default settings restored')}
          >
            Restore default settings
          </Button>
        </div>
      </fieldset>
      <p aria-live="polite" className="text-sm text-brand">
        {message}
      </p>
    </Panel>
  );
}
