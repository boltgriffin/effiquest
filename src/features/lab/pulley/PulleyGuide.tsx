import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SuccessState } from '@/components/StatePanels';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { TextArea } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { StepIndicator, type Step } from '@/components/ui/Progress';
import { useProgress } from '@/hooks/useProgress';
import { saveJournalEntry } from '@/services/storage/journal';
import type { SimTrial } from '@/types';
import { formatQuantity } from '@/utils/format';
import { segmentTrend } from './analysis';

const steps: Step[] = [
  { id: 'objective', label: 'Objective' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'observe', label: 'Observe' },
  { id: 'results', label: 'Results' },
  { id: 'reflect', label: 'Reflect' },
];

const predictions = [
  'Efficiency increases',
  'Efficiency decreases',
  'Efficiency stays the same',
] as const;

const reflectionQuestions = [
  'When you added more supporting rope segments, what happened to the effort you needed? What happened to the efficiency?',
  'Your data show that some input work was not useful. Where did that energy go?',
  'A worker says: “The 4-segment pulley is the best because it needs the least effort.” Use your data to agree or disagree.',
];

function H({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-lg">{children}</h3>;
}

/** Guided activity for the pulley lab (activity text drafted for teacher review, decision D-10). */
export function PulleyGuide({ trials }: { trials: SimTrial[] }) {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const current = steps[step]?.id;

  return (
    <Panel
      eyebrow={`Step ${step + 1} of ${steps.length}`}
      title="Experiment guide"
      bodyClassName="flex flex-col gap-5"
    >
      <StepIndicator compact label="Guide steps" steps={steps} current={step} onSelect={setStep} />
      <div className="border-t border-rule pt-4 text-sm">
        {current === 'objective' ? (
          <div className="flex flex-col gap-3">
            <H>Learning objective</H>
            <p>
              Find out how the number of supporting rope segments changes the effort you need and
              the efficiency of a pulley system, and tell mechanical advantage apart from
              efficiency.
            </p>
            <p className="text-muted">
              Linked to the concept note: differentiate mechanical advantage from efficiency
              (SRC-O2) and measure input and output work to calculate efficiency (SRC-O5).
            </p>
          </div>
        ) : null}

        {current === 'equipment' ? (
          <div className="flex flex-col gap-3">
            <H>Equipment (simulated)</H>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>Fixed pulleys hanging from a ceiling beam</li>
              <li>Movable pulley block (for 2-4 segments), which rises with the load</li>
              <li>Rope (does not stretch, does not slip)</li>
              <li>Load of adjustable mass</li>
              <li>Spring scale on the free end of the rope (reads to 0.1 N)</li>
              <li>Rulers for rope pulled and height raised (read to 0.01 m)</li>
            </ul>
          </div>
        ) : null}

        {current === 'instructions' ? (
          <div className="flex flex-col gap-3">
            <H>Instructions</H>
            <ol className="flex list-decimal flex-col gap-1 pl-5">
              <li>Choose the number of supporting rope segments in Variables.</li>
              <li>
                Press Start. The rope is pulled at a slow, steady speed until the load has risen 1
                m.
              </li>
              <li>
                Watch the spring scale and the two rulers while it runs. Use Pause to look closely.
              </li>
              <li>When the run is complete, read the results and press Record trial.</li>
              <li>
                Change only the number of segments, then run and record again. Repeat for 1, 2, 3
                and 4.
              </li>
            </ol>
            <Callout tone="info" title="Variables">
              Independent: supporting segments. Keep the same: load mass, block mass, bearing
              friction. Measured: effort, distances, work. Calculated: AMA, VR, efficiency.
            </Callout>
          </div>
        ) : null}

        {current === 'observe' ? (
          <div className="flex flex-col gap-3">
            <H>Predict and observe</H>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2">
                If you use more supporting segments, what happens to the efficiency?
              </legend>
              {predictions.map((p) => (
                <label
                  key={p}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-rule px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
                >
                  <input
                    type="radio"
                    name="pulley-prediction"
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
              hint="For example: how far did the rope move compared with the load?"
            />
          </div>
        ) : null}

        {current === 'results' ? <ResultsStep trials={trials} /> : null}

        {current === 'reflect' ? <ReflectStep prediction={prediction} notes={notes} /> : null}
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

function ResultsStep({ trials }: { trials: SimTrial[] }) {
  const trend = segmentTrend(trials);
  return (
    <div className="flex flex-col gap-3">
      <H>Results</H>
      {trials.length === 0 ? (
        <p className="text-muted">No trials recorded yet. Run the pulley and press Record trial.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[22rem]">
            <caption className="sr-only">Your recorded pulley trials</caption>
            <thead>
              <tr className="border-b border-rule text-left text-muted">
                <th scope="col" className="py-1.5 font-medium">
                  n
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  F<sub>in</sub> (N)
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  AMA
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  VR
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  η (%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {trials.map((t) => (
                <tr key={t.id}>
                  <th scope="row" className="py-1.5 text-left font-normal">
                    {t.params.segments}
                  </th>
                  <td className="py-1.5 text-right">{formatQuantity(t.readouts.inputForceN, 1)}</td>
                  <td className="py-1.5 text-right">{formatQuantity(t.readouts.actualMA, 2)}</td>
                  <td className="py-1.5 text-right">{formatQuantity(t.readouts.idealMA, 0)}</td>
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
        <Callout tone={trend.showsTradeOff ? 'success' : 'info'} title="What your data show">
          {trend.sentence}
          {trend.showsTradeOff
            ? ' More mechanical advantage did not mean less wasted energy.'
            : null}
        </Callout>
      ) : trials.length > 0 ? (
        <p className="text-muted">
          Record trials with at least two different numbers of segments to compare them.
        </p>
      ) : null}
    </div>
  );
}

function ReflectStep({ prediction, notes }: { prediction: string | null; notes: string }) {
  const { ownerId, record } = useProgress();
  const [answers, setAnswers] = useState(['', '', '']);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const complete = answers.every((a) => a.trim());

  const save = async () => {
    setState('saving');
    try {
      await saveJournalEntry(ownerId, {
        experimentId: 'pulley',
        beliefBefore: prediction ? `Prediction: ${prediction}.` : 'No prediction recorded.',
        findingAfter: [
          notes.trim() ? `Observations: ${notes.trim()}` : '',
          ...reflectionQuestions.map((q, i) => `${q}\n${answers[i]?.trim()}`),
        ]
          .filter(Boolean)
          .join('\n\n'),
      });
      await record('activity_completed', 'pulley');
      setState('saved');
    } catch {
      setState('error');
    }
  };

  if (state === 'saved') {
    return (
      <SuccessState title="Pulley lab complete">
        Your answers are saved in your journal on this device, and the lab now counts in your
        progress.{' '}
        <Link to="/lab" className="text-brand underline">
          Choose another lab
        </Link>
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
      {reflectionQuestions.map((q, i) => (
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
