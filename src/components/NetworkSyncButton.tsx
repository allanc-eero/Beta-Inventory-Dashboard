'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Tag } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { timeAgo } from '@/constants';

// ─── Databricks Sync (one button: online status + tester info) ────────────────
// A single click pulls BOTH real device liveness and current tester info from
// Databricks (one API call, op:sync) and applies them to the device records:
//   • status  → online if alive in Databricks, else not_online
//   • tester  → assignedTo / assignedEmail / network / location (network owner)
// Lifecycle states (deactivated/in_repair/in_testing/pending_return) are left
// untouched. Auto-runs daily (when last sync >24h and dashboard is opened).

interface SyncResult {
  checked: number;
  statusChanges: number;
  testerUpdates: number;
  online: number;
  notFound: number;
}

// (relative time provided by shared timeAgo helper)

export default function NetworkSyncButton() {
  const { devices, syncNetworkStatus, updateDevice, getDeviceBySerial, syncMetadata, updateSyncMetadata, isSyncStale } = useDeviceStore();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Databricks connection status (for the badge + disabling the button).
  const [ready, setReady] = useState<boolean | null>(null);
  const [identity, setIdentity] = useState<string>('');

  const checkConn = useCallback(async () => {
    try {
      const d = await (await fetch('/api/databricks')).json();
      setReady(!!d.ready);
      setIdentity(d.identity || '');
    } catch {
      setReady(false);
    }
  }, []);
  useEffect(() => { checkConn(); }, [checkConn]);

  // Devices whose status is network-driven (exclude deactivated + lifecycle states).
  const checkableDevices = devices.filter(
    (d) => !d.deactivated && !['in_repair', 'in_testing', 'pending_return'].includes(d.status)
  );
  const stale = isSyncStale();

  const handleSync = useCallback(async () => {
    if (syncMetadata.syncInProgress) return;
    setSyncing(true);
    setError('');
    setResult(null);
    updateSyncMetadata({ syncInProgress: true });

    try {
      const serials = checkableDevices.map((d) => d.serialNumber).filter(Boolean);
      if (serials.length === 0) { updateSyncMetadata({ syncInProgress: false }); setSyncing(false); return; }

      const res = await fetch('/api/databricks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'sync', serials }),
      });
      const data = await res.json();

      if (!data.success) {
        // Never apply a failed lookup — would wrongly mark everything offline.
        setError(data.error || 'Databricks sync failed.');
        updateSyncMetadata({ syncInProgress: false });
        return;
      }

      // 1) Apply online/offline status (authoritative).
      const onlineSerials = (data.statuses || []).filter((s: any) => s.online).map((s: any) => s.serial);
      const statusChanges = syncNetworkStatus(onlineSerials);

      // 2) Apply tester info to matched devices.
      let testerUpdates = 0;
      (data.testers || []).forEach((t: any) => {
        if (!t.serial) return;
        const device = getDeviceBySerial(t.serial);
        if (!device) return;
        const updates: Record<string, string> = {};
        if (t.name && t.name !== device.assignedTo) updates.assignedTo = t.name;
        if (t.email && t.email !== device.assignedEmail) updates.assignedEmail = t.email;
        if (t.network && t.network !== device.network) updates.network = t.network;
        if (t.location && t.location !== device.location) updates.location = t.location;
        // Country: CSV is the source of truth. Only fill from Databricks when the
        // device has no country yet — never overwrite a value you uploaded.
        if (t.country && !device.country) updates.country = t.country;
        if (Object.keys(updates).length > 0) { updateDevice(device.id, updates as any); testerUpdates++; }
      });

      setResult({
        checked: serials.length,
        statusChanges,
        testerUpdates,
        online: data.onlineCount ?? onlineSerials.length,
        notFound: (data.notFound || []).length,
      });
    } catch (e: any) {
      setError(e?.message || 'Sync failed — will retry on next attempt');
      updateSyncMetadata({ syncInProgress: false });
    } finally {
      setSyncing(false);
    }
  }, [checkableDevices, syncMetadata.syncInProgress, syncNetworkStatus, updateDevice, getDeviceBySerial, updateSyncMetadata]);

  // Auto-sync once per page load if stale (>24h). Runs daily.
  useEffect(() => {
    if (stale && !autoTriggered && ready && checkableDevices.length > 0) {
      setAutoTriggered(true);
      handleSync();
    }
  }, [stale, autoTriggered, ready, checkableDevices.length, handleSync]);

  return (
    <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-[var(--ui-text-text-primary)]">Databricks Sync</h4>
            {ready === true && <Tag color="green" size="regular">Connected</Tag>}
            {ready === false && <Tag color="orange" size="regular">Not connected</Tag>}
            {stale && ready && !syncing && <Tag color="orange" size="regular">Stale</Tag>}
          </div>
          <p className="text-xs text-[var(--ui-text-text-tertiary)] mt-0.5">
            One click pulls real online status <em>and</em> current tester info (name, email, network) from Databricks. Online = online, everything else = not online. Auto-syncs every 24h.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="default"
            label="↻ Re-check"
            onClick={checkConn}
            disabled={syncing}
          />
          <Button
            type="primary"
            label={syncing ? 'Syncing…' : `Sync Now (${checkableDevices.length} devices)`}
            onClick={handleSync}
            loading={syncing}
            disabled={syncing || !ready || checkableDevices.length === 0}
          />
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--ui-text-text-placeholder)]">
        <span>Last synced: {timeAgo(syncMetadata.lastFullSync)}</span>
        {syncMetadata.lastSyncOnlineCount > 0 && <span>·  {syncMetadata.lastSyncOnlineCount} online at last check</span>}
        {ready && identity && <span>·  {identity}</span>}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-3 p-2 bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] rounded-lg text-xs text-[var(--ui-support-text-icon-support-info)]">
          Checked {result.checked} device(s) — <span className="font-semibold">{result.online} online</span>,
          {' '}{result.statusChanges} status change(s), {result.testerUpdates} tester record(s) updated.
          {result.notFound > 0 && <span className="block mt-1 text-[var(--ui-support-text-icon-support-info)]">{result.notFound} serial(s) had no tester match in Databricks.</span>}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-2 bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-lg text-xs text-[var(--ui-support-text-support-error)]">{error}</div>
      )}
    </div>
  );
}
