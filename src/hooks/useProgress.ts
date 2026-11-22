import { useCallback, useEffect, useState } from 'react';
import { listProgress, onProgressChange, recordProgress } from '@/services/storage/progress';
import { useOwnerId } from '@/store/learnerStore';
import type { ProgressEvent, ProgressEventKind } from '@/types';

export type ProgressState =
  | { status: 'loading'; events: ProgressEvent[] }
  | { status: 'ready'; events: ProgressEvent[] }
  | { status: 'error'; events: ProgressEvent[] };

/** Current learner's progress events from IndexedDB, refreshed after every recorded event. */
export function useProgress() {
  const ownerId = useOwnerId();
  const [state, setState] = useState<ProgressState>({ status: 'loading', events: [] });
  const [version, setVersion] = useState(0);

  useEffect(() => onProgressChange(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    listProgress(ownerId).then(
      (events) => !cancelled && setState({ status: 'ready', events }),
      () => !cancelled && setState({ status: 'error', events: [] }),
    );
    return () => {
      cancelled = true;
    };
  }, [ownerId, version]);

  const record = useCallback(
    (kind: ProgressEventKind, refId: string) => recordProgress(ownerId, kind, refId),
    [ownerId],
  );
  const retry = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, ownerId, record, retry };
}
