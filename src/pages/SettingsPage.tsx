import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SuccessState } from '@/components/StatePanels';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { TextField } from '@/components/ui/Field';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { buildLearnerExport, downloadText } from '@/features/teacher/exportFormat';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { listProgress } from '@/services/storage/progress';
import { normalizeLearnerCode, useLearnerStore } from '@/store/learnerStore';
import { useUiStore, type QualityTier, type ThemePreference } from '@/store/uiStore';

const qualityOptions: Array<{ value: QualityTier; label: string }> = [
  { value: 'auto', label: 'Automatic' },
  { value: 'low', label: 'Low (faster on older devices)' },
  { value: 'high', label: 'High (sharper)' },
];

const themeOptions = [
  { value: 'system', label: 'System', icon: 'monitor' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
] as const satisfies ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: 'monitor' | 'sun' | 'moon';
}>;

export default function SettingsPage() {
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { quality, setQuality, theme, setTheme, setSeenWelcome } = useUiStore();
  const teacherMode = useLearnerStore((s) => s.teacherMode);
  const setTeacherMode = useLearnerStore((s) => s.setTeacherMode);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader eyebrow="Settings" title="Settings" />

      <LearnerPanel />

      <Panel eyebrow="Display" title="Appearance" bodyClassName="flex flex-col gap-6">
        <SegmentedControl legend="Theme" value={theme} options={themeOptions} onChange={setTheme} />
        <Select
          label="3D quality"
          value={quality}
          options={qualityOptions}
          onChange={setQuality}
          hint="Lower quality keeps the 3D view smooth on older phones and computers."
        />
      </Panel>

      <Panel eyebrow="Teacher" title="Teacher tools" bodyClassName="flex flex-col gap-4">
        <Switch
          label="Show teacher tools on this device"
          checked={teacherMode}
          onChange={setTeacherMode}
          description="Adds the class overview, where you import learners' results files and export the class CSV. Use it on the teacher's own device."
        />
        <p className="text-sm text-muted">
          There are no accounts, so this switch is not a password. It only shows or hides the tools;
          learners' data reaches this device only when files are imported.
        </p>
        {teacherMode ? (
          <ButtonLink to="/teacher" icon="class" className="self-start">
            Open class overview
          </ButtonLink>
        ) : null}
      </Panel>

      <Panel eyebrow="Device" title="Connection and data">
        <p aria-live="polite" className="text-sm">
          Connection: <span className="font-medium">{online ? 'online' : 'offline'}</span>. The app
          keeps working offline after the first visit.
        </p>
        <p className="mt-2 text-sm text-muted">Your work is stored in this browser only.</p>
      </Panel>

      <Panel eyebrow="Other" title="About">
        <div className="flex flex-wrap gap-2">
          <Button
            icon="home"
            onClick={() => {
              setSeenWelcome(false);
              navigate('/welcome');
            }}
          >
            Show the welcome screen
          </Button>
          <ButtonLink to="/design" icon="layers">
            Design system reference
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}

function LearnerPanel() {
  const learnerCode = useLearnerStore((s) => s.learnerCode);
  const setLearnerCode = useLearnerStore((s) => s.setLearnerCode);
  const [draft, setDraft] = useState(learnerCode ?? '');
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState(false);

  const save = () => {
    const code = normalizeLearnerCode(draft);
    if (!code) {
      setError('Use 3 to 16 letters, numbers or hyphens, exactly as your teacher gave it.');
      return;
    }
    setError(undefined);
    setLearnerCode(code);
    setDraft(code);
    setMessage(
      learnerCode && learnerCode !== code
        ? `Switched to learner ${code}. Work done under ${learnerCode} stays on this device.`
        : `Learner code ${code} saved.`,
    );
  };

  const exportResults = async () => {
    if (!learnerCode) return;
    setExportError(false);
    try {
      const events = await listProgress(learnerCode);
      const file = buildLearnerExport(learnerCode, events);
      downloadText(
        `effiquest-results-${learnerCode}.json`,
        JSON.stringify(file, null, 2),
        'application/json',
      );
    } catch {
      setExportError(true);
    }
  };

  return (
    <section id="learner" className="scroll-mt-20">
      <Panel eyebrow="Learner" title="Learner code" bodyClassName="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Your teacher gives each learner a code (no real names). On a shared computer, enter your
          own code before you start; each code keeps its own progress.
        </p>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="w-56">
            <TextField
              label="Learner code"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setMessage(null);
              }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              error={error}
            />
          </div>
          <Button type="submit" variant="primary" icon="user">
            {learnerCode ? 'Switch learner' : 'Save code'}
          </Button>
        </form>
        <div aria-live="polite">{message ? <SuccessState title={message} /> : null}</div>
        <div className="border-t border-rule pt-4">
          <p className="text-sm font-medium">Results file for your teacher</p>
          <p className="mt-1 text-sm text-muted">
            Downloads your progress as a small file. Give it to your teacher (for example by USB or
            message) so it can be added to the class results.
          </p>
          <Button
            icon="download"
            className="mt-3"
            disabled={!learnerCode}
            onClick={() => void exportResults()}
            aria-describedby={!learnerCode ? 'export-needs-code' : undefined}
          >
            Download my results
          </Button>
          {!learnerCode ? (
            <p id="export-needs-code" className="mt-2 text-sm text-muted">
              Save your learner code first.
            </p>
          ) : null}
          {exportError ? (
            <Callout tone="danger" role="alert" title="Could not create the file" className="mt-3">
              Local storage is not available in this browser.
            </Callout>
          ) : null}
        </div>
      </Panel>
    </section>
  );
}
