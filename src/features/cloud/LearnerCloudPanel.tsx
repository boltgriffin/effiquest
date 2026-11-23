import { useEffect, useState } from 'react';
import { ErrorState, LoadingState, SuccessState } from '@/components/StatePanels';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { env } from '@/config/env';
import { signOut } from '@/services/backend/auth';
import { toBackendError } from '@/services/backend/client';
import {
  deleteMyCloudData,
  joinClass,
  myClass,
  syncLearnerData,
  type LearnerClass,
  type SyncReport,
} from '@/services/backend/learner';
import { checkJoinCode } from '@/services/backend/validation';
import { useCloudUser } from './useCloudUser';

/**
 * Settings → Online class (learner). Joining uses the teacher's class code and this device's
 * learner code; no email, no password, no name. Work always stays on the device first.
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
        ) : !learnerCode ? (
          <p className="text-sm text-muted">Save your learner code above first.</p>
        ) : state.user?.roles.includes('learner') ? (
          <Joined learnerCode={learnerCode} onChanged={refresh} />
        ) : (
          <JoinForm learnerCode={learnerCode} onJoined={refresh} />
        )}
      </Panel>
    </section>
  );
}

function JoinForm({ learnerCode, onJoined }: { learnerCode: string; onJoined: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const c = checkJoinCode(code);
    if (!c.ok) return setError(c.error);
    setError(undefined);
    setBusy(true);
    try {
      await joinClass(c.value, learnerCode);
      onJoined();
    } catch (e) {
      setError(toBackendError(e).message);
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
        Join your teacher&apos;s class to send your results online as learner{' '}
        <span className="num text-ink">{learnerCode}</span>. Only your learner code, quest progress
        and assessment results are sent. Your journal and lab trials stay on this device.
      </p>
      <div className="max-w-56">
        <TextField
          label="Class code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          error={error}
          hint="8 letters and digits from your teacher."
        />
      </div>
      <div>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Joining…' : 'Join class'}
        </Button>
      </div>
    </form>
  );
}

function Joined({ learnerCode, onChanged }: { learnerCode: string; onChanged: () => void }) {
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
        <p className="text-sm text-muted">
          Your teacher removed you from the class. Ask for the code to join again.
        </p>
      )}

      {mismatch ? (
        <Callout tone="warning" title="Different learner code">
          This device joined the class as {cls.learnerCode}, but the learner code above is now{' '}
          {learnerCode}. Sign out of the online class before another learner uses it.
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
        Signing out keeps your online results; you join again with the class code. Your work on this
        device is never deleted by either button.
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
                deleteMyCloudData(learnerCode).then(onChanged, (e: unknown) =>
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
