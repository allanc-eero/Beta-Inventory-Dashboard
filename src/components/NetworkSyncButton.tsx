'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Tag } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { runDatabricksSync } from '@/lib/networkSync';
import { timeAgo } from '@/constants';

// ─── Databricks Sync (one button: online status + tester info) ────────────────
// A single click pulls BOTH real device liveness and current tester info from
// Databricks (one API call, op:sync) and applies them to the device records:
//   • status  → online if alive in Databricks, else not_online
//   • tester  → assignedTo / assignedEmail / network / location (network owner)
// Lifecycle states (deactivated/in_repair/in_testing/pending_return) are left
// untouched. Auto-runs weekly (when last sync >7d and the dashboard is opened)
// and right after a serial-sheet upload. Core sync logic lives in lib/networkSync.

interface SyncResult {
  checked: number;
  statusChanges: number;
  testerUpdates: number;
  online: number;
  notFound: number;
}

// (relative time provided by shared timeAgo helper)

export default function NetworkSyncButton() {
  const { devices, syncMetadata, isSyncStale } = useDeviceStore();
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
    setSyncing(true);
    setError('');
    setResult(null);
    const outcome = await runDatabricksSync();
    if (!outcome.success) {
      if (outcome.error && outcome.error !== 'A sync is already in progress') setError(outcome.error);
    } else {
      setResult({
        checked: outcome.checked,
        statusChanges: outcome.statusChanges,
        testerUpdates: outcome.testerUpdates,
        online: outcome.online,
        notFound: outcome.notFound,
      });
    }
    setSyncing(false);
  }, []);

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
            One click pulls real online status <em>and</em> current tester info (name, email, network) from Databricks. Online = online, everything else = not online. Auto-syncs weekly and right after an upload.
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
