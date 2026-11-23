import { useCallback, useEffect, useState } from 'react';
import { listAttempts, listDrafts, listResponsesFor } from '@/services/storage/attempts';
import { onProgressChange } from '@/services/storage/progress';
import { useOwnerId } from '@/store/learnerStore';
import type { AssessmentDraft, Attempt, AttemptResponse } from '@/types';

export interface AttemptsData {
  attempts: Attempt[];
  responses: Record<string, AttemptResponse[]>;
  drafts: AssessmentDraft[];
}

const empty: AttemptsData = { attempts: [], responses: {}, drafts: [] };

/** The current learner's submitted attempts (with responses) and unsubmitted drafts. */
export function useAttempts() {
  const ownerId = useOwnerId();
  const [state, setState] = useState<{
    status: 'loading' | 'ready' | 'error';
    data: AttemptsData;
  }>({ status: 'loading', data: empty });
  const [version, setVersion] = useState(0);

  useEffect(() => onProgressChange(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [attempts, drafts] = await Promise.all([listAttempts(ownerId), listDrafts(ownerId)]);
      const responses = await listResponsesFor(attempts.map((a) => a.id));
      return { attempts, responses, drafts };
    })().then(
      (data) => !cancelled && setState({ status: 'ready', data }),
      () => !cancelled && setState({ status: 'error', data: empty }),
    );
    return () => {
      cancelled = true;
    };
  }, [ownerId, version]);

  const retry = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state.data, status: state.status, ownerId, retry };
}
