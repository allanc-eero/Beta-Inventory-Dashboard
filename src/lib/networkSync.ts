import { useDeviceStore } from '@/store/deviceStore';

/**
 * Reusable device sync — pulls live online status + tester info and applies it
 * to the device records. Source-pluggable: Insight (the eero User/Admin API, the
 * authoritative real-time source) by default, or Databricks for bulk warehouse
 * sweeps. Both adapters speak the same POST { op:'sync', serials } → { success,
 * statuses, testers, onlineCount, notFound } protocol, so the engine is identical.
 *
 * Callable from anywhere (the manual button, right after an upload, a scheduler)
 * because it drives the store via getState() rather than React hooks. Lifecycle
 * statuses (deactivated / in_repair / in_testing / pending_return) are never
 * overwritten — only network-driven online/not_online devices are synced.
 */
export type DeviceSyncSource = 'insight' | 'databricks';

// Default to Insight (real-time, authoritative, native once embedded in Insight).
// Set NEXT_PUBLIC_DEVICE_SYNC_SOURCE=databricks to use the warehouse instead.
export const DEVICE_SYNC_SOURCE: DeviceSyncSource =
  process.env.NEXT_PUBLIC_DEVICE_SYNC_SOURCE === 'databricks' ? 'databricks' : 'insight';

const SYNC_ENDPOINT: Record<DeviceSyncSource, string> = {
  insight: '/api/insight',
  databricks: '/api/databricks',
};

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

// Readiness probe for the active source (drives the connection badge).
export async function checkSyncSource(): Promise<{ ready: boolean; identity: string; source: DeviceSyncSource }> {
  try {
    const url = DEVICE_SYNC_SOURCE === 'insight' ? '/api/insight?op=status' : '/api/databricks';
    const d = await (await fetch(url)).json();
    return { ready: !!d.ready, identity: d.identity || '', source: DEVICE_SYNC_SOURCE };
  } catch {
    return { ready: false, identity: '', source: DEVICE_SYNC_SOURCE };
  }
}

export async function runDeviceSync(serials?: string[]): Promise<SyncOutcome> {
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
    const res = await fetch(SYNC_ENDPOINT[DEVICE_SYNC_SOURCE], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'sync', serials: list }),
    });
    const data = await res.json();
    if (!data.success) {
      // Never apply a failed lookup — it would wrongly mark everything offline.
      store.updateSyncMetadata({ syncInProgress: false });
      return { ...ZERO, success: false, error: data.error || 'Device sync failed' };
    }

    // 1) Online/offline status (authoritative). syncNetworkStatus also stamps
    //    lastFullSync and clears syncInProgress.
    const onlineSerials = (data.statuses || []).filter((s: any) => s.online).map((s: any) => s.serial);
    const statusChanges = store.syncNetworkStatus(onlineSerials);

    // 2) Tester info for matched devices (name/email/network/location — whatever
    //    the source provides; Insight gives network, Databricks gives more).
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
