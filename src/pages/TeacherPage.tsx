import { useCallback, useEffect, useId, useState } from 'react';
import { EmptyState, ErrorState, LoadingState, UnauthorizedState } from '@/components/StatePanels';
import { SampleBadge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog } from '@/components/ui/Dialog';
import { PageHeader, Panel } from '@/components/ui/Panel';
import { Readout } from '@/components/ui/Readout';
import { buttonClass } from '@/components/ui/styles';
import { Switch } from '@/components/ui/Switch';
import { misconceptions } from '@/content/misconceptions';
import { modules } from '@/content/modules';
import { recentActivity, relativeTime } from '@/content/progress';
import { labs, quests } from '@/content/quests';
import {
  classCsv,
  downloadText,
  parseLearnerExport,
  toLearnerRow,
  type LearnerRow,
} from '@/features/teacher/exportFormat';
import { sampleClass } from '@/features/teacher/sampleClass';
import {
  clearClassImports,
  listClassImports,
  removeClassImport,
  saveClassImport,
} from '@/services/storage/classImports';
import { useLearnerStore } from '@/store/learnerStore';
import type { LearnerExport } from '@/types';
import { cx } from '@/utils/cx';

type Load =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; files: LearnerExport[] };

export default function TeacherPage() {
  const teacherMode = useLearnerStore((s) => s.teacherMode);
  if (!teacherMode) {
    return (
      <UnauthorizedState
        title="Teacher tools are off on this device"
        action={
          <ButtonLink to="/settings" variant="primary" icon="settings">
            Turn them on in Settings
          </ButtonLink>
        }
      >
        The class overview is for the teacher's own device. Learners do not need it.
      </UnauthorizedState>
    );
  }
  return <ClassOverview />;
}

function ClassOverview() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [sample, setSample] = useState(false);
  const [importReport, setImportReport] = useState<
    Array<{ name: string; ok: boolean; message: string }>
  >([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputId = useId();

  const refresh = useCallback(() => {
    listClassImports().then(
      (rows) => setLoad({ status: 'ready', files: rows.map((r) => r.data) }),
      () => setLoad({ status: 'error' }),
    );
  }, []);

  useEffect(refresh, [refresh]);

  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const report: typeof importReport = [];
    for (const file of Array.from(files)) {
      const parsed = parseLearnerExport(await file.text());
      if (parsed.ok) {
        try {
          await saveClassImport(parsed.data);
          report.push({
            name: file.name,
            ok: true,
            message: `Imported learner ${parsed.data.learnerCode}.`,
          });
        } catch {
          report.push({
            name: file.name,
            ok: false,
            message: 'Could not be saved on this device.',
          });
        }
      } else {
        report.push({ name: file.name, ok: false, message: parsed.error });
      }
    }
    setImportReport(report);
    refresh();
  };

  if (load.status === 'loading') return <LoadingState label="Loading class results…" />;
  if (load.status === 'error') {
    return (
      <ErrorState
        title="Class results could not be loaded"
        message="This browser is blocking local storage."
        onRetry={() => {
          setLoad({ status: 'loading' });
          refresh();
        }}
      />
    );
  }

  const files = sample ? sampleClass() : load.files;
  const rows = files.map(toLearnerRow);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Teacher"
        title="Class overview"
        description="Import the results files learners download from their devices, then export the class CSV."
        actions={
          <>
            {sample ? <SampleBadge>Sample class</SampleBadge> : null}
            <label
              htmlFor={fileInputId}
              className={cx(
                buttonClass('primary', 'md'),
                'cursor-pointer has-[:focus-visible]:outline-2',
                sample && 'pointer-events-none opacity-50',
              )}
            >
              <input
                id={fileInputId}
                type="file"
                accept=".json,application/json"
                multiple
                disabled={sample}
                className="sr-only"
                onChange={(e) => {
                  void importFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              Import results files
            </label>
            <Button
              icon="download"
              disabled={sample || rows.length === 0}
              onClick={() =>
                downloadText(
                  `effiquest-class-${new Date().toISOString().slice(0, 10)}.csv`,
                  classCsv(rows),
                  'text/csv',
                )
              }
            >
              Download class CSV
            </Button>
          </>
        }
      />

      <Switch
        label="Preview with a sample class"
        checked={sample}
        onChange={setSample}
        description="Shows four invented learners so you can see the layout. Import and export are off while the preview is on."
      />

      {importReport.length ? (
        <div aria-live="polite" className="flex flex-col gap-2">
          {importReport.map((r, i) => (
            <Callout key={`${r.name}-${i}`} tone={r.ok ? 'success' : 'danger'} title={r.name}>
              {r.message}
            </Callout>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState icon="class" title="No learner results yet">
          Ask each learner to open Settings, save their learner code and choose “Download my
          results”. Then import the files here. You can select many files at once.
        </EmptyState>
      ) : (
        <>
          <Overview rows={rows} />
          <LearnerTable
            rows={rows}
            sample={sample}
            onRemove={async (code) => {
              await removeClassImport(code);
              refresh();
            }}
          />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AssessmentOverview rows={rows} />
            <ActivityMonitor files={files} />
          </div>
          {!sample ? (
            <div>
              <Button variant="danger" icon="trash" onClick={() => setConfirmClear(true)}>
                Remove all imported results
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Remove all imported results?"
        footer={
          <>
            <Button onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={async () => {
                await clearClassImports();
                setConfirmClear(false);
                setImportReport([]);
                refresh();
              }}
            >
              Remove all
            </Button>
          </>
        }
      >
        <p className="text-sm">
          This removes the imported files from this device only. Learners keep their own data, and
          you can import their files again.
        </p>
      </Dialog>
    </div>
  );
}

const avg = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

function Overview({ rows }: { rows: LearnerRow[] }) {
  return (
    <Panel eyebrow="Class" title="Overview">
      <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
        <Readout symbol={null} label="Learners" value={rows.length} unit="" digits={0} />
        <Readout
          symbol={null}
          label={`Avg. modules (of ${modules.length})`}
          value={avg(rows.map((r) => r.modulesDone))}
          unit=""
          digits={1}
        />
        <Readout
          symbol={null}
          label={`Avg. labs (of ${labs.length})`}
          value={avg(rows.map((r) => r.labsDone))}
          unit=""
          digits={1}
        />
        <Readout
          symbol={null}
          label={`Avg. quests (of ${quests.length})`}
          value={avg(rows.map((r) => r.questsDone))}
          unit=""
          digits={1}
        />
      </div>
    </Panel>
  );
}

function LearnerTable({
  rows,
  sample,
  onRemove,
}: {
  rows: LearnerRow[];
  sample: boolean;
  onRemove: (code: string) => void;
}) {
  return (
    <Panel
      eyebrow="Learners"
      title="Progress by learner"
      bodyClassName="overflow-x-auto p-0 sm:p-0"
    >
      <table className="w-full min-w-[36rem] text-sm">
        <caption className="sr-only">Progress for each learner</caption>
        <thead>
          <tr className="border-b border-rule text-left text-muted">
            <th scope="col" className="px-4 py-2 font-medium sm:px-5">
              Learner code
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              Modules
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              Labs
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              Quests
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              Last activity
            </th>
            <th scope="col" className="px-4 py-2 sm:px-5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((r) => (
            <tr key={r.learnerCode}>
              <th scope="row" className="num px-4 py-2 text-left font-normal sm:px-5">
                {r.learnerCode}
              </th>
              <td className="num px-2 py-2 text-right">
                {r.modulesDone}/{modules.length}
              </td>
              <td className="num px-2 py-2 text-right">
                {r.labsDone}/{labs.length}
              </td>
              <td className="num px-2 py-2 text-right">
                {r.questsDone}/{quests.length}
              </td>
              <td className="px-2 py-2 text-muted">
                {r.lastActivity ? relativeTime(r.lastActivity) : 'No activity yet'}
              </td>
              <td className="px-4 py-1 text-right sm:px-5">
                {!sample ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="trash"
                    onClick={() => onRemove(r.learnerCode)}
                  >
                    <span className="sr-only">Remove {r.learnerCode}</span>
                    <span aria-hidden="true">Remove</span>
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function AssessmentOverview({ rows }: { rows: LearnerRow[] }) {
  const data = misconceptions.map((m) => {
    const b = avg(rows.map((r) => r.baseline[m.id]).filter((v): v is number => v !== undefined));
    const p = avg(rows.map((r) => r.post[m.id]).filter((v): v is number => v !== undefined));
    return { m, b, p };
  });
  const any = data.some((d) => d.b !== null || d.p !== null);
  return (
    <Panel eyebrow="Diagnostics" title="Assessment overview">
      {any ? (
        <table className="w-full text-sm">
          <caption className="sr-only">Average diagnostic score per misconception</caption>
          <thead>
            <tr className="border-b border-rule text-left text-muted">
              <th scope="col" className="py-2 font-medium">
                Misconception
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Baseline
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Post
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {data.map(({ m, b, p }) => (
              <tr key={m.id}>
                <th scope="row" className="py-2 text-left font-normal">
                  <span className="num text-muted">{m.id}</span> {m.short}
                </th>
                <td className="num py-2 text-right">{b === null ? '—' : `${b.toFixed(0)}%`}</td>
                <td className="num py-2 text-right">{p === null ? '—' : `${p.toFixed(0)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState compact icon="assess" title="No diagnostic results yet">
          Baseline and post scores appear here once the diagnostic is available and learners' files
          include it.
        </EmptyState>
      )}
    </Panel>
  );
}

function ActivityMonitor({ files }: { files: LearnerExport[] }) {
  const items = files
    .flatMap((f) =>
      recentActivity(f.progressEvents, 50).map((a) => ({ ...a, code: f.learnerCode })),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);
  return (
    <Panel eyebrow="Monitoring" title="Recent activity">
      {items.length ? (
        <ol className="flex flex-col gap-3 text-sm">
          {items.map((a) => (
            <li key={`${a.code}-${a.id}`} className="flex gap-3">
              <span className="num w-20 shrink-0 text-muted">{a.code}</span>
              <span className="min-w-0 flex-1">
                {a.text}
                <span className="block text-xs text-muted">
                  <time dateTime={a.at}>{relativeTime(a.at)}</time>
                </span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState compact icon="clock" title="No activity in the imported files" />
      )}
    </Panel>
  );
}
