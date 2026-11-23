import { useCallback, useEffect, useState } from 'react';
import { currentUser, onAuthChange, type CloudUser } from '@/services/backend/auth';
import { backendConfigured, toBackendError } from '@/services/backend/client';

export type CloudUserState =
  | { status: 'off' }
  | { status: 'loading' }
  | { status: 'ready'; user: CloudUser | null }
  | { status: 'error'; message: string };

/** The signed-in online-class user (with roles read from the server), kept up to date. */
export function useCloudUser() {
  const configured = backendConfigured();
  const [state, setState] = useState<CloudUserState>(
    configured ? { status: 'loading' } : { status: 'off' },
  );
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!configured) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    onAuthChange(refresh).then(
      (u) => (cancelled ? u() : (unsubscribe = u)),
      () => {},
    );
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [configured, refresh]);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    currentUser().then(
      (user) => !cancelled && setState({ status: 'ready', user }),
      (e: unknown) =>
        !cancelled && setState({ status: 'error', message: toBackendError(e).message }),
    );
    return () => {
      cancelled = true;
    };
  }, [configured, version]);

  return { state, refresh };
}
