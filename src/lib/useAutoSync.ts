'use client';

import { useEffect } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { runDeviceSync, checkSyncSource } from '@/lib/networkSync';

// ─── Auto device sync ─────────────────────────────────────────────────────────
// Fires one background runDeviceSync() per page load when the last full sync is
// stale (isSyncStale → weekly cadence) and the source isn't rate-limited. Mounted
// once at the app root so it runs regardless of tab or role (the manual button
// in NetworkSyncButton is editor-only and tab-scoped).

// Module-level guard: survives React strict-mode double-invoke and remounts, so
// the auto-sync fires at most once per page load.
let autoSyncAttempted = false;

const isCheckable = (d: { deactivated?: boolean; status: string }) =>
  !d.deactivated && !['in_repair', 'in_testing', 'pending_return'].includes(d.status);

export function useAutoSync() {
  // Re-evaluate once seeded/persisted devices are available.
  const checkableCount = useDeviceStore((s) => s.devices.filter(isCheckable).length);

  useEffect(() => {
    if (autoSyncAttempted || checkableCount === 0) return;
    const { isSyncStale, isRateLimited } = useDeviceStore.getState();
    if (!isSyncStale() || isRateLimited()) return;
    autoSyncAttempted = true;
    (async () => {
      const conn = await checkSyncSource();
      if (!conn.ready) { autoSyncAttempted = false; return; } // retry on a later change
      await runDeviceSync();
    })();
  }, [checkableCount]);
}

// Render-nothing wrapper so the hook can be mounted inside the logged-in branch.
export function AutoSync() {
  useAutoSync();
  return null;
}
