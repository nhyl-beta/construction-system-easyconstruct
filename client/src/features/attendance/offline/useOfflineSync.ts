// client/src/features/attendance/offline/useOfflineSync.ts — NEW (E1)
import { useCallback, useEffect, useRef, useState } from "react";
import { listPendingCount, syncPendingAttendance } from "./queue";

async function registerBackgroundSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    // Background Sync is Chrome/Android-only — iOS Safari has no 'sync'
    // property on ServiceWorkerRegistration at all, so this is purely a
    // best-effort enhancement layered on top of the `online` event below,
    // never the only way a queued entry gets synced.
    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(
        "attendance-sync",
      );
    }
  } catch {
    // Registration failing (unsupported browser, insecure context in dev)
    // just means Background Sync isn't available — the online-event path
    // still works.
  }
}

export function useOfflineAttendanceSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const refreshPendingCount = useCallback(() => {
    void listPendingCount().then(setPendingCount);
  }, []);

  const runSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);
    setLastSyncError(null);
    try {
      const result = await syncPendingAttendance();
      if (result.failed > 0) setLastSyncError(`${result.failed} entr${result.failed === 1 ? "y" : "ies"} failed to sync — will retry`);
    } finally {
      setSyncing(false);
      syncingRef.current = false;
      refreshPendingCount();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
    void registerBackgroundSync();

    const handleOnline = () => {
      setIsOnline(true);
      void runSync();
    };
    const handleOffline = () => setIsOnline(false);
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "attendance-sync-requested") void runSync();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener?.("message", handleSwMessage);

    if (navigator.onLine) void runSync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener?.("message", handleSwMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, pendingCount, syncing, lastSyncError, retrySync: runSync, refreshPendingCount };
}
