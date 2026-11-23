import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EquationCard } from '@/components/EquationCard';
import { SuccessState } from '@/components/StatePanels';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { TextArea, TextField } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { StepIndicator, type Step } from '@/components/ui/Progress';
import { efficiency } from '@/edu-calc';
import { useProgress } from '@/hooks/useProgress';
import { saveJournalEntry } from '@/services/storage/journal';
import type { SimTrial } from '@/types';
import { formatQuantity } from '@/utils/format';
import { compareTrials } from './analysis';
import { KnowledgeCheck } from './KnowledgeCheck';
import type { LabParams, MachineDefinition } from './types';

const steps: Step[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'observe', label: 'Predict' },
  { id: 'calculate', label: 'Calculate' },
  { id: 'results', label: 'Results' },
  { id: 'check', label: 'Check' },
  { id: 'reflect', label: 'Reflect' },
];

function H({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-lg">{children}</h3>;
}

/**
 * The guided activity, identical in structure for every machine; the content comes from the
 * machine definition (drafted for teacher review, decision D-10).
 */
export function ExperimentGuide<P extends LabParams>({
  def,
  trials,
}: {
  def: MachineDefinition<P>;
  trials: SimTrial[];
}) {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const g = def.guide;
  const current = steps[step]?.id;

  return (
    <Panel
      eyebrow={`Step ${step + 1} of ${steps.length}`}
      title="Experiment guide"
      bodyClassName="flex flex-col gap-5"
    >
      <StepIndicator compact label="Guide steps" steps={steps} current={step} onSelect={setStep} />
      <div className="border-t border-rule pt-4 text-sm">
        {current === 'overview' ? (
          <div className="flex flex-col gap-3">
            <H>Learning objective</H>
            <p>{g.objective}</p>
            <p className="text-muted">{g.sourceNote}</p>
            <H>How this machine works</H>
            <p>{g.purpose}</p>
            <H>Parts</H>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {g.parts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <H>Relevant equations</H>
            <div className="grid gap-4">
              {def.equations.map((e) => (
                <EquationCard key={e.id} equation={e} />
              ))}
            </div>
          </div>
        ) : null}

        {current === 'instructions' ? (
          <div className="flex flex-col gap-3">
            <H>Instructions</H>
            <ol className="flex list-decimal flex-col gap-1 pl-5">
              {g.instructions.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ol>
            <Callout tone="info" title="Variables">
              {g.variablesNote}
            </Callout>
          </div>
        ) : null}

        {current === 'observe' ? (
          <div className="flex flex-col gap-3">
            <H>Predict and observe</H>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2">{g.prediction.question}</legend>
              {g.prediction.options.map((p) => (
                <label
                  key={p}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-rule px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
                >
                  <input
                    type="radio"
                    name={`${def.id}-prediction`}
                    value={p}
                    checked={prediction === p}
                    onChange={() => setPrediction(p)}
                    className="size-4 accent-[var(--brand)]"
                  />
                  {p}
                </label>
              ))}
            </fieldset>
            <TextArea
              label="Observations during the runs"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              hint={g.observePrompt}
            />
          </div>
        ) : null}

        {current === 'calculate' ? <CalculateStep /> : null}
        {current === 'results' ? <ResultsStep def={def} trials={trials} /> : null}
        {current === 'check' ? (
          <div className="flex flex-col gap-3">
            <H>Knowledge check</H>
            <KnowledgeCheck items={g.knowledge} labId={def.id} />
          </div>
        ) : null}
        {current === 'reflect' ? (
          <ReflectStep def={def} prediction={prediction} notes={notes} />
        ) : null}
      </div>
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
      <H>Calculate efficiency</H>
      <p className="text-muted">
        Use your readings: W<sub>in</sub> = F<sub>in</sub> × d<sub>in</sub> (steady effort) and W
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

function ResultsStep<P extends LabParams>({
  def,
  trials,
}: {
  def: MachineDefinition<P>;
  trials: SimTrial[];
}) {
  const trend = compareTrials(trials, def.trend);
  return (
    <div className="flex flex-col gap-3">
      <H>Results</H>
      {trials.length === 0 ? (
        <p className="text-muted">
          No trials recorded yet. Run the machine and press Record trial.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[24rem]">
            <caption className="sr-only">Your recorded trials</caption>
            <thead>
              <tr className="border-b border-rule text-left text-muted">
                <th scope="col" className="py-1.5 font-medium">
                  #
                </th>
                {def.trialColumns.map((c) => (
                  <th key={c.key} scope="col" className="py-1.5 text-right font-medium">
                    {c.label}
                  </th>
                ))}
                <th scope="col" className="py-1.5 text-right font-medium">
                  F<sub>in</sub> (N)
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  IMA
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  AMA
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  η (%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {trials.map((t, i) => (
                <tr key={t.id}>
                  <th scope="row" className="py-1.5 text-left font-normal text-muted">
                    {i + 1}
                  </th>
                  {def.trialColumns.map((c) => (
                    <td key={c.key} className="py-1.5 text-right">
                      {formatQuantity(t.params[c.key] ?? Number.NaN, c.digits)}
                    </td>
                  ))}
                  <td className="py-1.5 text-right">{formatQuantity(t.readouts.inputForceN, 1)}</td>
                  <td className="py-1.5 text-right">{formatQuantity(t.readouts.idealMA, 2)}</td>
                  <td className="py-1.5 text-right">{formatQuantity(t.readouts.actualMA, 2)}</td>
                  <td className="py-1.5 text-right">
                    {t.valid ? formatQuantity(t.readouts.efficiencyPercent, 1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {trend ? (
        <Callout
          tone={trend.showsTradeOff && trend.fairTest ? 'success' : 'info'}
          title="What your data show"
        >
          {trend.sentence}
          {trend.showsTradeOff && trend.fairTest
            ? ' Mechanical advantage and efficiency moved in opposite directions: making the job easier did not mean less wasted energy.'
            : null}
        </Callout>
      ) : trials.length > 0 ? (
        <p className="text-muted">
          Record trials with at least two different values of the {def.trend.label} to compare them.
        </p>
      ) : null}
    </div>
  );
}

function ReflectStep<P extends LabParams>({
  def,
  prediction,
  notes,
}: {
  def: MachineDefinition<P>;
  prediction: string | null;
  notes: string;
}) {
  const { ownerId, record } = useProgress();
  const questions = def.guide.reflection;
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const complete = answers.every((a) => a.trim());

  const save = async () => {
    setState('saving');
    try {
      await saveJournalEntry(ownerId, {
        experimentId: def.id,
        beliefBefore: prediction ? `Prediction: ${prediction}.` : 'No prediction recorded.',
        findingAfter: [
          notes.trim() ? `Observations: ${notes.trim()}` : '',
          ...questions.map((q, i) => `${q}\n${answers[i]?.trim() ?? ''}`),
        ]
          .filter(Boolean)
          .join('\n\n'),
      });
      await record('activity_completed', def.id);
      setState('saved');
    } catch {
      setState('error');
    }
  };

  if (state === 'saved') {
    return (
      <SuccessState title={`${def.title} lab complete`}>
        Your answers are saved in your journal on this device, and the lab now counts in your
        progress.{' '}
        <Link to="/lab" className="text-brand underline">
          Choose another lab
        </Link>
        {' or '}
        <Link to="/lab/compare" className="text-brand underline">
          compare machines
        </Link>
        .
      </SuccessState>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <H>Reflection questions</H>
      {questions.map((q, i) => (
        <TextArea
          key={q}
          label={`${i + 1}. ${q}`}
          value={answers[i] ?? ''}
          onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
        />
      ))}
      <div>
        <Button
          type="submit"
          variant="primary"
          icon="journal"
          disabled={!complete || state === 'saving'}
        >
          {state === 'saving' ? 'Saving…' : 'Save and complete the lab'}
        </Button>
      </div>
      {state === 'error' ? (
        <Callout tone="danger" role="alert" title="Could not save">
          This browser is blocking local storage. Copy your answers before leaving.
        </Callout>
      ) : null}
    </form>
  );
}
