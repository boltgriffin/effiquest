import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/** Registers the service worker and asks before applying an update so a learner is never reloaded mid-activity. */
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

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg md:bottom-4"
    >
      <p className="flex-1 text-sm">
        {needRefresh ? 'A new version is available.' : 'EffiQuest is ready to work offline.'}
      </p>
      {needRefresh ? (
        <button
          type="button"
          className="min-h-11 rounded-lg bg-brand px-4 font-medium text-brand-contrast"
          onClick={() => void updateSW.current?.(true)}
        >
          Update
        </button>
      ) : null}
      <button
        type="button"
        className="min-h-11 rounded-lg border border-border px-4"
        onClick={() => {
          setNeedRefresh(false);
          setOfflineReady(false);
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
