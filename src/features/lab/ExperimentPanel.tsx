import { useState, type ReactNode } from 'react';
import { SuccessState } from '@/components/StatePanels';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { TextArea, TextField } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { StepIndicator, type Step } from '@/components/ui/Progress';
import { Slider } from '@/components/ui/Slider';
import { efficiency } from '@/edu-calc';
import { Link } from 'react-router-dom';
import { useProgress } from '@/hooks/useProgress';
import { saveJournalEntry } from '@/services/storage/journal';
import { formatQuantity } from '@/utils/format';
import { DEFAULT_PARAMS, type InclineParams } from './params';
import type { RunState } from './useInclineRun';

const steps: Step[] = [
  { id: 'predict', label: 'Predict' },
  { id: 'setup', label: 'Set up' },
  { id: 'measure', label: 'Measure' },
  { id: 'calculate', label: 'Calculate' },
  { id: 'explain', label: 'Explain' },
];

const predictions = [
  'Efficiency increases',
  'Efficiency decreases',
  'Efficiency stays the same',
  'I am not sure',
] as const;

interface ExperimentPanelProps {
  params: InclineParams;
  onParamsChange: (params: InclineParams) => void;
  run: RunState;
  onRun: () => void;
}

/** Experiment instructions: a five-step protocol (predict, set up, measure, calculate, explain). */
export function ExperimentPanel({ params, onParamsChange, run, onRun }: ExperimentPanelProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const bodies: Record<string, ReactNode> = {
    predict: <PredictStep />,
    setup: <SetupStep params={params} onChange={onParamsChange} />,
    measure: <MeasureStep run={run} onRun={onRun} />,
    calculate: <CalculateStep />,
    explain: <ExplainStep />,
  };

  return (
    <Panel
      eyebrow={`Step ${step + 1} of ${steps.length}`}
      title="Experiment"
      bodyClassName="flex flex-col gap-5"
    >
      <StepIndicator
        compact
        label="Experiment steps"
        steps={steps}
        current={step}
        onSelect={setStep}
      />
      <div className="border-t border-rule pt-4">{current ? bodies[current.id] : null}</div>
      <div className="flex justify-between gap-2 border-t border-rule pt-4">
        <Button icon="chevronLeft" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button
          variant="primary"
          iconRight="chevronRight"
          disabled={step === steps.length - 1}
          onClick={() => setStep((s) => s + 1)}
        >
          Next step
        </Button>
      </div>
    </Panel>
  );
}

function StepTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-lg">{children}</h3>;
}

function PredictStep() {
  const [choice, setChoice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3">
        <StepTitle>Make a prediction</StepTitle>
        <span className="mt-1 block text-sm text-muted">
          If the ramp gets steeper and the friction stays the same, what happens to the ramp's
          efficiency?
        </span>
      </legend>
      {predictions.map((p) => (
        <label
          key={p}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-rule px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:disabled]:cursor-default has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
        >
          <input
            type="radio"
            name="prediction"
            value={p}
            checked={choice === p}
            disabled={locked}
            onChange={() => setChoice(p)}
            className="size-4 accent-[var(--brand)]"
          />
          <span className="text-sm">{p}</span>
        </label>
      ))}
      {locked ? (
        <SuccessState title="Prediction recorded">
          You predicted: “{choice}”. You will compare it with your measurements in the Explain step.
        </SuccessState>
      ) : (
        <div>
          <Button
            variant="primary"
            icon="target"
            disabled={!choice}
            onClick={() => setLocked(true)}
          >
            Lock in prediction
          </Button>
        </div>
      )}
    </fieldset>
  );
}

function SetupStep({
  params,
  onChange,
}: {
  params: InclineParams;
  onChange: (p: InclineParams) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepTitle>Set up the ramp</StepTitle>
      <Slider
        label="Ramp angle"
        name="Ramp angle"
        symbol="θ"
        value={params.angleDeg}
        min={5}
        max={60}
        step={1}
        unit="°"
        onChange={(angleDeg) => onChange({ ...params, angleDeg })}
      />
      <Slider
        label="Friction coefficient"
        name="Friction coefficient"
        symbol="μ"
        value={params.friction}
        min={0}
        max={0.8}
        step={0.01}
        digits={2}
        onChange={(friction) => onChange({ ...params, friction })}
        hint="0 means no friction. Larger values mean a rougher surface."
      />
      <Slider
        label="Load mass"
        name="Load mass"
        symbol="m"
        value={params.massKg}
        min={1}
        max={50}
        step={1}
        unit="kg"
        onChange={(massKg) => onChange({ ...params, massKg })}
      />
      <div>
        <Button size="sm" icon="reset" onClick={() => onChange(DEFAULT_PARAMS)}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

function MeasureStep({ run, onRun }: { run: RunState; onRun: () => void }) {
  const running = run.status === 'running';
  const m = run.status === 'done' ? run.measurement : null;
  return (
    <div className="flex flex-col gap-4">
      <StepTitle>Run and measure</StepTitle>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted">
        <li>Press Run. The block is pulled up the whole ramp at a slow, steady speed.</li>
        <li>Read the spring scale (effort force) and the ruler (distance and height).</li>
        <li>Record the trial in Measurements, change one setting, and run again.</li>
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon="play" disabled={running} onClick={onRun}>
          {running ? 'Running…' : m ? 'Run again' : 'Run'}
        </Button>
        <p aria-live="polite" className="num text-sm">
          {m ? (
            <>
              Scale: {formatQuantity(m.scaleN, 1)} N · pulled {formatQuantity(m.effortDistanceM, 2)}{' '}
              m · rose {formatQuantity(m.heightM, 2)} m
            </>
          ) : null}
        </p>
      </div>
      {run.status === 'invalid' ? (
        <Callout tone="danger" role="alert" title="This set-up cannot be run">
          {run.errors.join(' ')}
        </Callout>
      ) : null}
    </div>
  );
}

function CalculateStep() {
  const [win, setWin] = useState('');
  const [wout, setWout] = useState('');
  const [eta, setEta] = useState('');
  const [feedback, setFeedback] = useState<ReactNode>(null);

  const check = () => {
    if (win === '' || wout === '') {
      setFeedback(<Callout tone="danger" role="alert" title="Enter both work values first." />);
      return;
    }
    // The learner's own numbers, so the basis is "measured".
    const r = efficiency({ usefulWorkJ: Number(wout), inputWorkJ: Number(win) });
    if (!r.ok) {
      setFeedback(
        <Callout tone="danger" role="alert" title={r.errors.map((e) => e.message).join(' ')} />,
      );
      return;
    }
    const learner = Number(eta);
    const close = eta !== '' && Number.isFinite(learner) && Math.abs(learner - r.value) <= 0.5;
    setFeedback(
      <Callout
        tone={close ? 'success' : 'warning'}
        role="status"
        title={close ? 'Your efficiency is correct.' : 'Not quite. Check the working below.'}
      >
        <span className="num block">{r.substitution}</span>
        <span className="mt-1 block">{r.explanation}</span>
      </Callout>,
    );
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        check();
      }}
    >
      <StepTitle>Calculate efficiency</StepTitle>
      <p className="text-sm text-muted">
        Use your readings from step 3: W<sub>in</sub> = F<sub>in</sub> × d<sub>in</sub> and W
        <sub>out</sub> = F<sub>out</sub> × d<sub>out</sub>. The lab checks your arithmetic; it never
        sets efficiency for you.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Input work"
          unit="J"
          type="number"
          inputMode="decimal"
          step="any"
          value={win}
          onChange={(e) => setWin(e.target.value)}
        />
        <TextField
          label="Useful (output) work"
          unit="J"
          type="number"
          inputMode="decimal"
          step="any"
          value={wout}
          onChange={(e) => setWout(e.target.value)}
        />
      </div>
      <TextField
        label="Your efficiency"
        unit="%"
        type="number"
        inputMode="decimal"
        step="any"
        value={eta}
        onChange={(e) => setEta(e.target.value)}
        hint="Round to one decimal place."
      />
      <div>
        <Button type="submit" variant="primary" icon="calculator">
          Check my answer
        </Button>
      </div>
      <div aria-live="polite">{feedback}</div>
    </form>
  );
}

function ExplainStep() {
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { ownerId, record } = useProgress();

  const save = async () => {
    setState('saving');
    try {
      await saveJournalEntry(ownerId, {
        experimentId: 'incline',
        beliefBefore: before,
        findingAfter: after,
      });
      // Saving the explanation completes the lab activity (quest "lab" stages use this).
      await record('activity_completed', 'incline');
      setState('saved');
    } catch {
      setState('error');
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <StepTitle>Explain what you found</StepTitle>
      <TextArea
        label="What did you believe before the experiment?"
        value={before}
        onChange={(e) => {
          setBefore(e.target.value);
          setState('idle');
        }}
      />
      <TextArea
        label="What did your measurements show?"
        value={after}
        onChange={(e) => {
          setAfter(e.target.value);
          setState('idle');
        }}
      />
      <div>
        <Button
          type="submit"
          variant="primary"
          icon="journal"
          disabled={!before.trim() || !after.trim() || state === 'saving'}
        >
          {state === 'saving' ? 'Saving…' : 'Save to journal'}
        </Button>
      </div>
      <div aria-live="polite">
        {state === 'saved' ? (
          <SuccessState title="Lab activity complete">
            Your explanation is saved in your journal on this device, and the activity now counts in
            your quests.{' '}
            <Link to="/" className="text-brand underline">
              Back to the dashboard
            </Link>
          </SuccessState>
        ) : null}
        {state === 'error' ? (
          <Callout tone="danger" role="alert" title="Could not save">
            This browser blocked local storage (for example, a private window). Copy your text
            before leaving.
          </Callout>
        ) : null}
      </div>
    </form>
  );
}
