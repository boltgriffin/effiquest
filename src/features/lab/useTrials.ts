import { useCallback, useEffect, useState } from 'react';
import { ENGINE_VERSION } from '@/physics-core';
import { listTrials, onTrialsChange, saveTrial } from '@/services/storage/trials';
import { useOwnerId } from '@/store/learnerStore';
import type { MachineId, SimReadouts, SimTrial } from '@/types';

export interface TrialInput {
  params: Record<string, number>;
  readouts: SimReadouts;
  valid: boolean;
}

/** The current learner's recorded trials for one experiment, stored on this device. */
export function useTrials(experimentId: string, machine: MachineId) {
  const ownerId = useOwnerId();
  const [trials, setTrials] = useState<SimTrial[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [version, setVersion] = useState(0);

  useEffect(() => onTrialsChange(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    listTrials(ownerId, experimentId).then(
      (t) => {
        if (cancelled) return;
        setTrials(t);
        setStatus('ready');
      },
      () => !cancelled && setStatus('error'),
    );
    return () => {
      cancelled = true;
    };
  }, [ownerId, experimentId, version]);

  const record = useCallback(
    (t: TrialInput) =>
      saveTrial({
        id: crypto.randomUUID(),
        ownerId,
        experimentId,
        machine,
        params: t.params,
        readouts: t.readouts,
        engineVersion: ENGINE_VERSION,
        seed: 0,
        valid: t.valid,
        recordedAt: new Date().toISOString(),
      }),
    [ownerId, experimentId, machine],
  );

  return { trials, status, record };
}
