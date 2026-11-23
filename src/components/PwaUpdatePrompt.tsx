import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';

/** How long the one-time "ready to work offline" message stays before hiding itself. */
const OFFLINE_READY_MS = 8000;

/**
 * Registers the service worker. An available update waits for the learner's choice, so nobody
 * is reloaded mid-activity. The one-time "ready offline" message hides itself, so it never sits
 * on top of page controls (it is placed above the phone tab bar and inside the safe area).
 */
export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateSW = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSW.current = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
  }, []);

  useEffect(() => {
    if (!offlineReady || needRefresh) return;
    const t = setTimeout(() => setOfflineReady(false), OFFLINE_READY_MS);
    return () => clearTimeout(t);
  }, [offlineReady, needRefresh]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-md border border-rule-strong bg-surface px-3 py-2 shadow-pop">
        <Icon name={needRefresh ? 'reset' : 'offline'} size={18} className="shrink-0 text-brand" />
        <p className="flex-1 text-sm">
          {needRefresh
            ? 'A new version of EffiQuest is available.'
            : 'EffiQuest is ready to work offline.'}
        </p>
        {needRefresh ? (
          <Button variant="primary" onClick={() => void updateSW.current?.(true)}>
            Update
          </Button>
        ) : null}
        <Button
          variant="ghost"
          onClick={() => {
            setNeedRefresh(false);
            setOfflineReady(false);
          }}
        >
          {needRefresh ? 'Later' : 'Dismiss'}
        </Button>
      </div>
    </div>
  );
}
