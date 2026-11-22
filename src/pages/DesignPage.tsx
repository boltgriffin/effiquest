import { useState, type ReactNode } from 'react';
import { iconNames } from '@/components/icons/glyphs';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, ErrorState, LoadingState, SuccessState } from '@/components/StatePanels';
import { Badge, SampleBadge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/Field';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { ProgressBar, StepIndicator } from '@/components/ui/Progress';
import { Readout } from '@/components/ui/Readout';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';

const swatches = [
  ['bg', 'Page'],
  ['surface', 'Surface'],
  ['surface-2', 'Inset'],
  ['ink', 'Ink'],
  ['muted', 'Muted'],
  ['rule', 'Rule'],
  ['rule-strong', 'Rule strong'],
  ['brand', 'Brand'],
  ['brand-soft', 'Brand soft'],
  ['input', 'Input / effort'],
  ['output', 'Output / load'],
  ['loss', 'Loss'],
  ['success', 'Success'],
  ['warning', 'Warning'],
  ['danger', 'Danger'],
  ['chart-1', 'Chart 1'],
  ['chart-2', 'Chart 2'],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel eyebrow="Component" title={title} bodyClassName="flex flex-col gap-4">
      {children}
    </Panel>
  );
}

/** Living reference of the design system; every control here works. */
export default function DesignPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [slider, setSlider] = useState(30);
  const [switchOn, setSwitchOn] = useState(true);
  const [seg, setSeg] = useState<'a' | 'b' | 'c'>('a');
  const [select, setSelect] = useState<'x' | 'y'>('x');
  const [step, setStep] = useState(1);
  const [field, setField] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Reference"
        title="Design system"
        description="Tokens and components used across EffiQuest. See docs/DESIGN_SYSTEM.md."
      />

      <Section title="Color tokens">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {swatches.map(([token, name]) => (
            <li key={token} className="text-sm">
              <span
                className="block h-12 rounded-sm border border-rule"
                style={{ background: `var(--${token})` }}
              />
              <span className="mt-1 block">{name}</span>
              <span className="num block text-xs text-muted">--{token}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <p className="font-display text-4xl">Display serif · page titles</p>
        <p className="font-display text-xl">Display serif · panel titles</p>
        <p>Body sans · 16 px, line height 1.5, for reading and controls.</p>
        <p className="num text-xl">Mono tabular · 132.08 J · 74.3 %</p>
        <p className="font-mono text-[0.72rem] tracking-[0.14em] text-muted uppercase">
          Eyebrow · section label
        </p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon="play">
            Primary
          </Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button size="sm">Small</Button>
          <IconButton icon="reset" label="Reset" variant="secondary" />
        </div>
      </Section>

      <Section title="Inputs and selection">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Input work"
            unit="J"
            type="number"
            value={field}
            onChange={(e) => setField(e.target.value)}
            hint="Enter a positive number."
          />
          <TextField
            label="With error"
            unit="N"
            type="number"
            defaultValue="-4"
            error="Force must be greater than 0 N."
          />
          <Select
            label="Select"
            value={select}
            onChange={setSelect}
            options={[
              { value: 'x', label: 'Option X' },
              { value: 'y', label: 'Option Y' },
            ]}
          />
          <Slider
            label="Slider"
            name="Slider"
            symbol="θ"
            value={slider}
            min={0}
            max={90}
            step={1}
            unit="°"
            onChange={setSlider}
          />
          <Switch
            label="Switch"
            checked={switchOn}
            onChange={setSwitchOn}
            description="Binary setting with immediate effect."
          />
          <SegmentedControl
            legend="Segmented control"
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'a', label: 'One' },
              { value: 'b', label: 'Two' },
              { value: 'c', label: 'Three' },
            ]}
          />
        </div>
      </Section>

      <Section title="Tabs, dialog and tooltip">
        <Tabs
          label="Example tabs"
          items={[
            {
              id: 'one',
              label: 'First',
              content: <p className="text-sm">Use arrow keys to move between tabs.</p>,
            },
            { id: 'two', label: 'Second', content: <p className="text-sm">Second panel.</p> },
          ]}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
          <Tooltip content="Tooltips add a hint; never essential information.">
            {(p) => (
              <Button variant="ghost" icon="help" {...p}>
                Hover or focus me
              </Button>
            )}
          </Tooltip>
        </div>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Example dialog"
          footer={
            <Button variant="primary" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          }
        >
          <p className="text-sm">
            Esc, the close button, or clicking outside closes it. Focus returns to the trigger.
          </p>
        </Dialog>
      </Section>

      <Section title="Progress">
        <ProgressBar label="Module progress" value={40} />
        <StepIndicator
          label="Example steps"
          current={step}
          onSelect={setStep}
          steps={[
            { id: 'a', label: 'Predict' },
            { id: 'b', label: 'Measure' },
            { id: 'c', label: 'Explain' },
          ]}
        />
      </Section>

      <Section title="Scientific measurements">
        <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
          <Readout
            symbol={
              <>
                F<sub>in</sub>
              </>
            }
            label="Input force"
            value={66.04}
            unit="N"
            tone="input"
            definition="Force applied by the learner."
          />
          <Readout
            symbol={
              <>
                F<sub>out</sub>
              </>
            }
            label="Load"
            value={98.1}
            unit="N"
            tone="output"
          />
          <Readout symbol="Q" label="Energy lost" value={33.98} unit="J" tone="loss" />
          <Readout symbol="η" label="Efficiency" value={null} unit="%" />
        </div>
        <p className="text-xs text-muted">
          Values above are examples. A dash means “not measured”.
        </p>
      </Section>

      <Section title="Badges and messages">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="brand">Brand</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          <SampleBadge />
        </div>
        <Callout tone="info" title="Info">
          Neutral guidance.
        </Callout>
        <Callout tone="success" title="Success">
          An action worked.
        </Callout>
        <Callout tone="warning" title="Warning">
          Something needs attention.
        </Callout>
        <Callout tone="danger" title="Error">
          Something failed.
        </Callout>
      </Section>

      <Section title="States">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState compact title="Empty">
            Nothing here yet.
          </EmptyState>
          <SuccessState title="Success">Saved.</SuccessState>
          <LoadingState label="Loading example…" />
          <ErrorState title="Error" message="Example error message." />
        </div>
      </Section>

      <Section title="Icons">
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-9">
          {iconNames.map((name) => (
            <li
              key={name}
              className="flex flex-col items-center gap-1 rounded-sm border border-rule py-3 text-xs text-muted"
            >
              <Icon name={name} size={24} className="text-ink" />
              {name}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
