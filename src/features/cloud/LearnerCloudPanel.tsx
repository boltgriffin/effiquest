import { useEffect, useState } from 'react';
import { ErrorState, LoadingState, SuccessState } from '@/components/StatePanels';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { env } from '@/config/env';
import { signInLearner, signOut } from '@/services/backend/auth';
import { toBackendError } from '@/services/backend/client';
import {
  deleteMyCloudData,
  myClass,
  syncLearnerData,
  type LearnerClass,
  type SyncReport,
} from '@/services/backend/learner';
import { checkJoinCode, checkLearnerCode, checkPin } from '@/services/backend/validation';
import { useLearnerStore } from '@/store/learnerStore';
import { useCloudUser } from './useCloudUser';

/**
 * Settings → Online class (learner). Learners sign in with the class code, their learner code and
 * the PIN on the slip from their teacher (decision D-20): no email, no name. Work is always saved
 * on the device first; on a shared computer, sign out when finished.
 */
export function LearnerCloudPanel({ learnerCode }: { learnerCode: string | null }) {
  const { state, refresh } = useCloudUser();

  return (
    <section id="online-class" className="scroll-mt-20">
      <Panel
        eyebrow="Optional"
        title="Online class"
        actions={state.status === 'off' ? <Badge>Not set up</Badge> : null}
        bodyClassName="flex flex-col gap-4"
      >
        {state.status === 'off' ? (
          <p className="text-sm text-muted">
            {env.supabaseMisconfigured
              ? 'The online class settings for this app are not valid, so it stays off. Tell your teacher.'
              : 'This copy of EffiQuest works on this device only. Your teacher collects results with the results file above.'}
          </p>
        ) : state.status === 'loading' ? (
          <LoadingState label="Checking the online class…" />
        ) : state.status === 'error' ? (
          <ErrorState
            title="The online class could not be reached"
            message={state.message}
            onRetry={refresh}
          />
        ) : state.user?.roles.includes('learner') ? (
          <Joined learnerCode={learnerCode} onChanged={refresh} />
        ) : state.user ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              A teacher account is signed in on this device. Sign out before a learner signs in.
            </p>
            <div>
              <Button onClick={() => void signOut().then(refresh, refresh)}>Sign out</Button>
            </div>
          </div>
        ) : (
          <SignInForm learnerCode={learnerCode} onSignedIn={refresh} />
        )}
      </Panel>
    </section>
  );
}

function SignInForm({
  learnerCode,
  onSignedIn,
}: {
  learnerCode: string | null;
  onSignedIn: () => void;
}) {
  const setLearnerCode = useLearnerStore((s) => s.setLearnerCode);
  const [classCode, setClassCode] = useState('');
  const [code, setCode] = useState(learnerCode ?? '');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<{
    classCode?: string;
    code?: string;
    pin?: string;
    form?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const j = checkJoinCode(classCode);
    const c = checkLearnerCode(code);
    const p = checkPin(pin);
    if (!j.ok || !c.ok || !p.ok) {
      return setErrors({
        ...(j.ok ? {} : { classCode: j.error }),
        ...(c.ok ? {} : { code: c.error }),
        ...(p.ok ? {} : { pin: p.error }),
      });
    }
    setErrors({});
    setBusy(true);
    try {
      await signInLearner(j.value, c.value, p.value);
      setPin('');
      // Keep this device's work under the same learner code as the online account.
      if (learnerCode !== c.value) setLearnerCode(c.value);
      onSignedIn();
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
      <p className="text-sm text-muted">
        Use the slip from your teacher. Only your learner code, quest progress and assessment
        results are sent. Your journal and lab trials stay on this device.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField
          label="Class code on your slip"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          error={errors.classCode}
        />
        <TextField
          label="Learner code on your slip"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          error={errors.code}
        />
        <TextField
          label="PIN on your slip"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoComplete="current-password"
          autoCapitalize="characters"
          spellCheck={false}
          error={errors.pin}
        />
      </div>
      {errors.form ? (
        <Callout tone="danger" role="alert" title="Not signed in">
          {errors.form} Forgot your PIN? Your teacher can give you a new one.
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

function Joined({ learnerCode, onChanged }: { learnerCode: string | null; onChanged: () => void }) {
  const [cls, setCls] = useState<LearnerClass | null | undefined>(undefined);
  const [sync, setSync] = useState<
    | { status: 'idle' }
    | { status: 'busy' }
    | { status: 'done'; report: SyncReport }
    | { status: 'error'; message: string }
  >({ status: 'idle' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    myClass().then(
      (c) => !cancelled && setCls(c),
      () => !cancelled && setCls(null),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const runSync = async () => {
    setSync({ status: 'busy' });
    try {
      if (!learnerCode) return;
      setSync({ status: 'done', report: await syncLearnerData(learnerCode) });
    } catch (e) {
      setSync({ status: 'error', message: toBackendError(e).message });
    }
  };

  const mismatch = cls && cls.learnerCode !== learnerCode;

  return (
    <div className="flex flex-col gap-4">
      {cls === undefined ? (
        <LoadingState label="Loading your class…" />
      ) : cls ? (
        <p className="text-sm">
          Joined <span className="font-medium">{cls.className}</span> as learner{' '}
          <span className="num">{cls.learnerCode}</span>.
        </p>
      ) : (
        <p className="text-sm text-muted">You are not in a class any more. Ask your teacher.</p>
      )}

      {mismatch ? (
        <Callout tone="warning" title="Different learner code">
          You are signed in online as {cls.learnerCode}, but this device&apos;s learner code is{' '}
          {learnerCode ?? 'not set'}. Sign out of the online class, then sign in as the right
          learner.
        </Callout>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            icon="upload"
            disabled={sync.status === 'busy' || !cls}
            onClick={() => void runSync()}
          >
            {sync.status === 'busy' ? 'Sending…' : 'Send my results now'}
          </Button>
        </div>
      )}

      <div aria-live="polite">
        {sync.status === 'done' ? (
          <SuccessState title="Results sent">
            {sync.report.attemptsSent} new assessment{sync.report.attemptsSent === 1 ? '' : 's'} and{' '}
            {sync.report.eventsSent} progress record{sync.report.eventsSent === 1 ? '' : 's'} sent.
            {sync.report.rejected.length
              ? ` ${sync.report.rejected.length} could not be accepted: ${sync.report.rejected
                  .map((r) => r.reason)
                  .join(' ')}`
              : ''}
          </SuccessState>
        ) : sync.status === 'error' ? (
          <Callout tone="danger" role="alert" title="Not sent">
            {sync.message}
          </Callout>
        ) : null}
        {actionError ? (
          <Callout tone="danger" role="alert" title="That did not work">
            {actionError}
          </Callout>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-rule pt-4">
        <Button
          onClick={() => {
            setActionError(null);
            signOut().then(onChanged, (e: unknown) => setActionError(toBackendError(e).message));
          }}
        >
          Sign out of the online class
        </Button>
        <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
          Delete my online data
        </Button>
      </div>
      <p className="text-xs text-muted">
        On a shared computer, always sign out when you finish. Signing out keeps your online
        results. Your work on this device is never deleted by either button.
      </p>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your online data?"
        footer={
          <>
            <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmDelete(false);
                setActionError(null);
                deleteMyCloudData(learnerCode ?? '').then(onChanged, (e: unknown) =>
                  setActionError(toBackendError(e).message),
                );
              }}
            >
              Delete online data
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Your results, progress and class membership are removed from the class server. Your
          teacher will no longer see them. Everything saved on this device stays.
        </p>
      </Dialog>
    </div>
  );
}
