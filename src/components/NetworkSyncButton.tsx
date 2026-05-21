'use client';

import { useState, useEffect } from 'react';
import { useDeviceStore } from '@/store/deviceStore';

const SYNC_COOLDOWN_MS = 60 * 1000; // 1 minute minimum between syncs
const SYNC_STALE_HOURS = 24;
const RATE_LIMIT_BACKOFF_MS = 60 * 1000; // 60 second backoff on rate limit

/**
 * Simulates calling the eero Partner API to check which devices are online.
 * In production, replace with actual fetch() calls.
 */
async function fetchOnlineDevicesFromAPI(
  devices: { serialNumber: string; network: string }[],
  onRateLimit: () => void
): Promise<string[]> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // In production:
  // try {
  //   const response = await fetch('https://api-user.e2ro.com/2.2/organizations/self/networks/administered', {
  //     headers: { 'X-User-Token': API_TOKEN, 'Accept': 'application/json' }
  //   });
  //   if (response.status === 400) {
  //     const body = await response.json();
  //     if (body.meta?.error === 'error.rate.limit') {
  //       onRateLimit();
  //       return [];
  //     }
  //   }
  //   // ... process networks and eeros ...
  // } catch (e) { ... }

  // Simulation: randomly mark ~30% of not_online devices as now online
  const onlineSerials: string[] = [];
  devices.forEach((d) => {
    if (Math.random() < 0.3) {
      onlineSerials.push(d.serialNumber);
    }
  });

  return onlineSerials;
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

  const notOnlineDevices = devices.filter((d) => d.status === 'not_online' && !d.deactivated);
  const stale = isSyncStale();
  const rateLimited = isRateLimited();

  // Auto-sync on page load if stale (>24h since last sync)
  useEffect(() => {
    if (stale && !autoSyncTriggered && !rateLimited && notOnlineDevices.length > 0) {
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
      const onlineSerials = await fetchOnlineDevicesFromAPI(
        notOnlineDevices.map((d) => ({ serialNumber: d.serialNumber, network: d.network })),
        () => {
          // Rate limit handler
          updateSyncMetadata({
            rateLimitedUntil: new Date(Date.now() + RATE_LIMIT_BACKOFF_MS).toISOString(),
            syncInProgress: false,
          });
          setError('API rate limit hit — backing off for 60 seconds');
        }
      );

      if (!isRateLimited()) {
        const updated = syncNetworkStatus(onlineSerials);
        setSyncResult({ updated, checked: notOnlineDevices.length });
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
            Polls the eero Partner API to detect devices that have come online. Auto-syncs every 24h.
          </p>
        </div>
        <button
          onClick={() => handleSync(false)}
          disabled={syncing || rateLimited || notOnlineDevices.length === 0}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Syncing...' : `Sync Now (${notOnlineDevices.length} to check)`}
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
            Checked {syncResult.checked} device(s) — <span className="font-semibold">{syncResult.updated} came online</span>
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
