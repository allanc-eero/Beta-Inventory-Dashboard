'use client';

import { useState, useEffect } from 'react';
import { useDeviceStore } from '@/store/deviceStore';

const SYNC_COOLDOWN_MS = 60 * 1000; // 1 minute minimum between syncs
const SYNC_STALE_HOURS = 24;
const RATE_LIMIT_BACKOFF_MS = 60 * 1000; // 60 second backoff on rate limit

/**
 * Fetches REAL online status from Databricks (core.node_sessions liveness).
 * Returns { ok, onlineSerials }. `ok:false` means the lookup failed and the
 * result must NOT be applied (otherwise we'd wrongly mark everything offline).
 */
async function fetchOnlineDevicesFromAPI(
  devices: { serialNumber: string; network: string }[],
  onError: (msg: string) => void
): Promise<{ ok: boolean; onlineSerials: string[] }> {
  try {
    const serials = devices.map((d) => d.serialNumber).filter(Boolean);
    if (serials.length === 0) return { ok: true, onlineSerials: [] };

    const res = await fetch('/api/databricks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'status', serials }),
    });
    const data = await res.json();

    if (!data.success) {
      onError(data.error || 'Databricks status check failed.');
      return { ok: false, onlineSerials: [] };
    }
    return {
      ok: true,
      onlineSerials: (data.statuses || []).filter((s: any) => s.online).map((s: any) => s.serial),
    };
  } catch (e: any) {
    onError(e?.message || 'Could not reach Databricks.');
    return { ok: false, onlineSerials: [] };
  }
}

function getTimeSinceSync(lastSync: string | null): string {
  if (!lastSync) return 'Never synced';
  const ms = Date.now() - new Date(lastSync).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NetworkSyncButton() {
  const { devices, syncNetworkStatus, syncMetadata, updateSyncMetadata, isSyncStale, isRateLimited } = useDeviceStore();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ updated: number; checked: number } | null>(null);
  const [error, setError] = useState('');
  const [autoSyncTriggered, setAutoSyncTriggered] = useState(false);

  // Devices whose status is network-driven (exclude deactivated + lifecycle states).
  const checkableDevices = devices.filter(
    (d) => !d.deactivated && !['in_repair', 'in_testing', 'pending_return'].includes(d.status)
  );
  const stale = isSyncStale();
  const rateLimited = isRateLimited();

  // Auto-sync on page load if stale (>24h since last sync). Runs daily.
  useEffect(() => {
    if (stale && !autoSyncTriggered && !rateLimited && checkableDevices.length > 0) {
      setAutoSyncTriggered(true);
      handleSync(true);
    }
  }, [stale, autoSyncTriggered, rateLimited]);

  const handleSync = async (isAutoSync = false) => {
    // Guard: don't sync if rate limited
    if (rateLimited) {
      setError('Rate limited — please wait before syncing again');
      return;
    }

    // Guard: don't sync if already in progress
    if (syncMetadata.syncInProgress) return;

    setSyncing(true);
    setError('');
    setSyncResult(null);
    updateSyncMetadata({ syncInProgress: true });

    try {
      const result = await fetchOnlineDevicesFromAPI(
        checkableDevices.map((d) => ({ serialNumber: d.serialNumber, network: d.network })),
        (msg) => setError(msg)
      );

      // Only apply if the lookup succeeded — never mark everything offline on a
      // failed/timed-out query (that would be a false-negative wipe).
      if (result.ok) {
        const updated = syncNetworkStatus(result.onlineSerials);
        setSyncResult({ updated, checked: checkableDevices.length });
      } else {
        updateSyncMetadata({ syncInProgress: false });
      }
    } catch (e) {
      setError('Sync failed — will retry on next attempt');
      updateSyncMetadata({ syncInProgress: false });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-gray-900">Network Status Sync</h4>
            {stale && !syncing && (
              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">Stale</span>
            )}
            {rateLimited && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Rate Limited</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Checks real device liveness in Databricks (node_sessions). Online devices show Online; everything else shows Not Online. Auto-syncs every 24h.
          </p>
        </div>
        <button
          onClick={() => handleSync(false)}
          disabled={syncing || rateLimited || checkableDevices.length === 0}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Syncing...' : `Sync Now (${checkableDevices.length} devices)`}
        </button>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span>Last synced: {getTimeSinceSync(syncMetadata.lastFullSync)}</span>
        {syncMetadata.lastSyncOnlineCount > 0 && (
          <span>·  {syncMetadata.lastSyncOnlineCount} online at last check</span>
        )}
        {syncMetadata.lastSyncDeviceCount > 0 && (
          <span>·  {syncMetadata.lastSyncDeviceCount} total devices</span>
        )}
      </div>

      {/* Results */}
      {syncResult && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            Checked {syncResult.checked} device(s) — <span className="font-semibold">{syncResult.updated} status change(s)</span>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
