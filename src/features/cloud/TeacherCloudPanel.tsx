import { useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/StatePanels';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog } from '@/components/ui/Dialog';
import { TextArea, TextField } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { env } from '@/config/env';
import { signInTeacher, signOut } from '@/services/backend/auth';
import { toBackendError } from '@/services/backend/client';
import {
  archiveClass,
  classRecords,
  createClass,
  listClasses,
  createLearnerAccounts,
  deleteLearnerAccount,
  resetLearnerPin,
  roster,
  type CloudClass,
  type IssuedPins,
  type LearnerCloudRecords,
  type RosterEntry,
} from '@/services/backend/teacher';
import {
  parseLearnerCodes,
  checkClassName,
  checkEmail,
  checkPassword,
  checkSchoolYear,
} from '@/services/backend/validation';
import { useCloudUser } from './useCloudUser';

/**
 * Teacher page → Online class. The teacher role is read from the server (granted by the
 * administrator), never from this device's teacher-tools switch.
 */
export function TeacherCloudPanel({
  onRecords,
}: {
  /** Receives the class's synced records, to show them in the class overview. */
  onRecords: (records: LearnerCloudRecords[], className: string) => Promise<void>;
}) {
  const { state, refresh } = useCloudUser();

  if (state.status === 'off') {
    return (
      <Panel eyebrow="Optional" title="Online class" actions={<Badge>Not set up</Badge>}>
        <p className="text-sm text-muted">
          {env.supabaseMisconfigured
            ? 'The Supabase settings were rejected (for example, a secret key was used instead of the anon key). See docs/BACKEND_AND_SECURITY.md.'
            : 'No class server is configured, so results are collected with files. To set one up, see docs/BACKEND_AND_SECURITY.md.'}
        </p>
      </Panel>
    );
  }

  return (
    <Panel eyebrow="Optional" title="Online class" bodyClassName="flex flex-col gap-4">
      {state.status === 'loading' ? (
        <LoadingState label="Checking your sign-in…" />
      ) : state.status === 'error' ? (
        <ErrorState
          title="The class server could not be reached"
          message={state.message}
          onRetry={refresh}
        />
      ) : !state.user || state.user.anonymous ? (
        <SignIn onSignedIn={refresh} />
      ) : !state.user.roles.includes('teacher') ? (
        <div className="flex flex-col gap-3">
          <Callout tone="warning" title="This account is not a teacher account">
            The administrator must give your account the teacher role before you can create classes
            or see learner results.
          </Callout>
          <div>
            <Button onClick={() => void signOut().then(refresh, refresh)}>Sign out</Button>
          </div>
        </div>
      ) : (
        <Classes onRecords={onRecords} onSignOut={() => void signOut().then(refresh, refresh)} />
      )}
    </Panel>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = checkEmail(email);
    const p = checkPassword(password);
    if (!e.ok || !p.ok) {
      return setErrors({
        ...(e.ok ? {} : { email: e.error }),
        ...(p.ok ? {} : { password: p.error }),
      });
    }
    setErrors({});
    setBusy(true);
    try {
      await signInTeacher(e.value, p.value);
      setPassword('');
      onSignedIn();
    } catch (err) {
      setErrors({ form: toBackendError(err).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="flex max-w-sm flex-col gap-3"
      onSubmit={(ev) => {
        ev.preventDefault();
        void submit();
      }}
    >
      <p className="text-sm text-muted">
        Teachers sign in with the account the administrator created.
      </p>
      <TextField
        label="Email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        error={errors.email}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(ev) => setPassword(ev.target.value)}
        error={errors.password}
      />
      {errors.form ? (
        <Callout tone="danger" role="alert" title="Not signed in">
          {errors.form}
        </Callout>
      ) : null}
      <div>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
    </form>
  );
}

type Load<T> =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

function Classes({
  onRecords,
  onSignOut,
}: {
  onRecords: (records: LearnerCloudRecords[], className: string) => Promise<void>;
  onSignOut: () => void;
}) {
  const [classes, setClasses] = useState<Load<CloudClass[]>>({ status: 'loading' });
  const [selected, setSelected] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    listClasses().then(
      (data) => !cancelled && setClasses({ status: 'ready', data }),
      (e: unknown) =>
        !cancelled && setClasses({ status: 'error', message: toBackendError(e).message }),
    );
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (classes.status === 'loading') return <LoadingState label="Loading your classes…" />;
  if (classes.status === 'error') {
    return (
      <ErrorState
        title="Your classes could not be loaded"
        message={classes.message}
        onRetry={reload}
      />
    );
  }
  const current = classes.data.find((c) => c.id === selected) ?? classes.data[0];

  return (
    <div className="flex flex-col gap-5">
      {classes.data.length === 0 ? (
        <EmptyState compact icon="class" title="No classes yet">
          Create a class, then give learners its class code.
        </EmptyState>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="Your classes">
          {classes.data.map((c) => (
            <li key={c.id}>
              <Button
                variant={c.id === current?.id ? 'primary' : 'secondary'}
                aria-pressed={c.id === current?.id}
                onClick={() => setSelected(c.id)}
              >
                {c.name}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {current ? (
        <ClassDetail key={current.id} cls={current} onRecords={onRecords} onArchived={reload} />
      ) : null}
      <CreateClass
        onCreated={(c) => {
          setSelected(c.id);
          reload();
        }}
      />
      <div className="border-t border-rule pt-4">
        <Button onClick={onSignOut}>Sign out</Button>
      </div>
    </div>
  );
}

function ClassDetail({
  cls,
  onRecords,
  onArchived,
}: {
  cls: CloudClass;
  onRecords: (records: LearnerCloudRecords[], className: string) => Promise<void>;
  onArchived: () => void;
}) {
  const [learners, setLearners] = useState<Load<RosterEntry[]>>({ status: 'loading' });
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  /** PINs are shown once, right after they are issued, then forgotten. */
  const [slips, setSlips] = useState<IssuedPins | null>(null);
  const [toDelete, setToDelete] = useState<RosterEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    roster(cls.id).then(
      (data) => !cancelled && setLearners({ status: 'ready', data }),
      (e: unknown) =>
        !cancelled && setLearners({ status: 'error', message: toBackendError(e).message }),
    );
    return () => {
      cancelled = true;
    };
  }, [cls.id, version]);

  const act = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage({ ok: true, text: await fn() });
    } catch (e) {
      setMessage({ ok: false, text: toBackendError(e).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-md border border-rule p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg">
          {cls.name}
          {cls.school_year ? (
            <span className="text-sm text-muted"> · {cls.school_year}</span>
          ) : null}
        </h3>
        <p className="text-sm">
          Class code{' '}
          <span className="num rounded-sm bg-surface-2 px-2 py-1 text-base tracking-widest">
            {cls.join_code}
          </span>
        </p>
      </div>

      {learners.status === 'loading' ? (
        <LoadingState label="Loading learners…" />
      ) : learners.status === 'error' ? (
        <ErrorState
          title="Learners could not be loaded"
          message={learners.message}
          onRetry={() => setVersion((v) => v + 1)}
        />
      ) : learners.data.length === 0 ? (
        <p className="text-sm text-muted">No learners yet. Add their learner codes below.</p>
      ) : (
        <ul
          className="divide-y divide-rule border-y border-rule"
          aria-label={`Learners in ${cls.name}`}
        >
          {learners.data.map((l) => (
            <li
              key={l.learner_id}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <span className="num">{l.learner_code}</span>
              <span className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      const pin = await resetLearnerPin(cls.id, l.learner_id);
                      setSlips({ created: [{ learnerCode: l.learner_code, pin }], failed: [] });
                      return `New PIN for ${l.learner_code} below. The old PIN no longer works.`;
                    })
                  }
                >
                  New PIN<span className="sr-only"> for {l.learner_code}</span>
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setToDelete(l)}>
                  Remove<span className="sr-only"> {l.learner_code}</span>
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <AddLearners
        disabled={busy}
        onAdd={(codes) =>
          act(async () => {
            const issued = await createLearnerAccounts(cls.id, codes);
            setSlips(issued);
            setVersion((v) => v + 1);
            return `${issued.created.length} learner account${issued.created.length === 1 ? '' : 's'} created${issued.failed.length ? `, ${issued.failed.length} not created` : ''}.`;
          })
        }
      />

      {slips ? (
        <PinSlips
          joinCode={cls.join_code}
          className={cls.name}
          slips={slips}
          onDone={() => setSlips(null)}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon="download"
          disabled={busy || learners.status !== 'ready' || learners.data.length === 0}
          onClick={() =>
            void act(async () => {
              const records = await classRecords(cls.id);
              await onRecords(records, cls.name);
              return `Loaded results for ${records.length} learner${records.length === 1 ? '' : 's'} into the class overview below.`;
            })
          }
        >
          Load results into the overview
        </Button>
        <Button
          disabled={busy}
          onClick={() =>
            void act(async () => {
              await archiveClass(cls.id);
              onArchived();
              return `${cls.name} was archived. You can no longer add learners to it or see its results.`;
            })
          }
        >
          Archive class
        </Button>
      </div>
      <div aria-live="polite">
        {message ? (
          <Callout tone={message.ok ? 'success' : 'danger'} role={message.ok ? 'status' : 'alert'}>
            {message.text}
          </Callout>
        ) : null}
      </div>

      <Dialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={`Remove ${toDelete?.learner_code ?? ''}?`}
        footer={
          <>
            <Button onClick={() => setToDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                const l = toDelete;
                setToDelete(null);
                if (!l) return;
                void act(async () => {
                  await deleteLearnerAccount(cls.id, l.learner_id);
                  setVersion((v) => v + 1);
                  return `Removed ${l.learner_code} and their online results.`;
                });
              }}
            >
              Remove learner
            </Button>
          </>
        }
      >
        <p className="text-sm">
          The learner&apos;s online account and the results they sent are deleted from the server.
          Work saved on their own device is not affected. You can add the code again later; it gets
          a new PIN.
        </p>
      </Dialog>
    </div>
  );
}

function AddLearners({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (codes: string[]) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseLearnerCodes(text);
        if (!parsed.ok) return setError(parsed.error);
        setError(undefined);
        void onAdd(parsed.value).then(() => setText(''));
      }}
    >
      <TextArea
        label="Add learners"
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={error}
        hint="Learner codes only (no names), one per line or separated by commas, e.g. G11A-01, G11A-02."
        className="min-h-20"
      />
      <div>
        <Button type="submit" disabled={disabled}>
          Create accounts and PINs
        </Button>
      </div>
    </form>
  );
}

/** One-time display of new PINs, laid out as slips to print and cut. */
function PinSlips({
  joinCode,
  className,
  slips,
  onDone,
}: {
  joinCode: string;
  className: string;
  slips: IssuedPins;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-dashed border-rule-strong p-4">
      <Callout tone="warning" title="Print or copy these PINs now">
        They are shown only once and are not stored anywhere readable. If a PIN is lost, give the
        learner a new one.
      </Callout>
      {slips.failed.length ? (
        <Callout tone="danger" title="Not created">
          {slips.failed.map((f) => `${f.learnerCode}: ${f.reason}`).join(' ')}
        </Callout>
      ) : null}
      <ul className="pin-slips grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="PIN slips">
        {slips.created.map((s) => (
          <li key={s.learnerCode} className="rounded-sm border border-rule p-3 text-sm">
            <p className="font-medium">EffiQuest online class · {className}</p>
            <p>
              Class code <span className="num">{joinCode}</span>
            </p>
            <p>
              Learner code <span className="num">{s.learnerCode}</span>
            </p>
            <p>
              PIN <span className="num text-base tracking-widest">{s.pin}</span>
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button icon="download" onClick={() => window.print()}>
          Print slips
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Done, hide the PINs
        </Button>
      </div>
    </div>
  );
}

function CreateClass({ onCreated }: { onCreated: (c: CloudClass) => void }) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [errors, setErrors] = useState<{ name?: string; year?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = checkClassName(name);
    const y = checkSchoolYear(year);
    if (!n.ok || !y.ok) {
      return setErrors({ ...(n.ok ? {} : { name: n.error }), ...(y.ok ? {} : { year: y.error }) });
    }
    setErrors({});
    setBusy(true);
    try {
      const c = await createClass(n.value, year);
      setName('');
      setYear('');
      onCreated(c);
    } catch (e) {
      setErrors({ form: toBackendError(e).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h3 className="font-display text-base">New class</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Class name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          hint="For example G11 STEM A. No learner names."
        />
        <TextField
          label="School year (optional)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          error={errors.year}
          placeholder="2026-2027"
        />
      </div>
      {errors.form ? (
        <Callout tone="danger" role="alert" title="Class not created">
          {errors.form}
        </Callout>
      ) : null}
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create class'}
        </Button>
      </div>
    </form>
  );
}
