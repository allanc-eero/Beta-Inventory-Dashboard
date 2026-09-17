import { useDeviceStore } from '@/store/deviceStore';

/**
 * Reusable Databricks device sync — pulls live online status + current tester
 * info and applies it to the device records. Callable from anywhere (the manual
 * button, right after an upload, or a scheduled trigger) because it drives the
 * store via getState() rather than React hooks.
 *
 * Lifecycle statuses (deactivated / in_repair / in_testing / pending_return) are
 * never overwritten — only network-driven online/not_online devices are synced.
 */
export interface SyncOutcome {
  success: boolean;
  error?: string;
  checked: number;
  statusChanges: number;
  testerUpdates: number;
  online: number;
  notFound: number;
}

const ZERO: SyncOutcome = { success: true, checked: 0, statusChanges: 0, testerUpdates: 0, online: 0, notFound: 0 };

export async function runDatabricksSync(serials?: string[]): Promise<SyncOutcome> {
  const store = useDeviceStore.getState();
  if (store.syncMetadata.syncInProgress) return { ...ZERO, success: false, error: 'A sync is already in progress' };

  // Only network-driven devices; skip deactivated + lifecycle states.
  const checkable = store.devices.filter(
    (d) => !d.deactivated && !['in_repair', 'in_testing', 'pending_return'].includes(d.status)
  );
  const list = (serials && serials.length ? serials : checkable.map((d) => d.serialNumber)).filter(Boolean);
  if (list.length === 0) return ZERO;

  store.updateSyncMetadata({ syncInProgress: true });
  try {
    const res = await fetch('/api/databricks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'sync', serials: list }),
    });
    const data = await res.json();
    if (!data.success) {
      // Never apply a failed lookup — it would wrongly mark everything offline.
      store.updateSyncMetadata({ syncInProgress: false });
      return { ...ZERO, success: false, error: data.error || 'Databricks sync failed' };
    }

    // 1) Online/offline status (authoritative). syncNetworkStatus also stamps
    //    lastFullSync and clears syncInProgress.
    const onlineSerials = (data.statuses || []).filter((s: any) => s.online).map((s: any) => s.serial);
    const statusChanges = store.syncNetworkStatus(onlineSerials);

    // 2) Tester info for matched devices.
    let testerUpdates = 0;
    (data.testers || []).forEach((t: any) => {
      if (!t.serial) return;
      const device = store.getDeviceBySerial(t.serial);
      if (!device) return;
      const updates: Record<string, string> = {};
      if (t.name && t.name !== device.assignedTo) updates.assignedTo = t.name;
      if (t.email && t.email !== device.assignedEmail) updates.assignedEmail = t.email;
      if (t.network && t.network !== device.network) updates.network = t.network;
      if (t.location && t.location !== device.location) updates.location = t.location;
      // Country: uploaded CSV is source of truth — only fill when empty.
      if (t.country && !device.country) updates.country = t.country;
      if (Object.keys(updates).length > 0) { store.updateDevice(device.id, updates as any); testerUpdates++; }
    });

    return {
      success: true,
      checked: list.length,
      statusChanges,
      testerUpdates,
      online: data.onlineCount ?? onlineSerials.length,
      notFound: (data.notFound || []).length,
    };
  } catch (e: any) {
    store.updateSyncMetadata({ syncInProgress: false });
    return { ...ZERO, success: false, error: e?.message || 'Sync failed' };
  }
}
