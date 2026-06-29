'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDeviceStore } from '@/store/deviceStore';

// ─── Tester Info Refresh (from Databricks, read-only) ─────────────────────────
// Pulls the CURRENT tester (name / email / network / location) for each device
// by serial from Databricks — the source of truth — and updates the local
// record. CSV intake data goes stale; this re-syncs it on demand.
//
// Read-only: the API route can only run SELECTs. This component applies the
// returned values to the device store (which logs every field change to the
// device audit trail automatically).

interface DbxStatus {
  configured: boolean;
  ready: boolean;
  identity?: string;
  testerTableConfigured?: boolean;
  testerTable?: string | null;
  error?: string;
}

interface TesterRow {
  serial: string;
  name: string | null;
  email: string | null;
  network: string | null;
  location: string | null;
}

export default function TesterRefreshButton() {
  const { devices, updateDevice, getDeviceBySerial } = useDeviceStore();
  const [status, setStatus] = useState<DbxStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<{ matched: number; updated: number; notFound: string[] } | null>(null);
  const [error, setError] = useState('');

  const activeDevices = devices.filter((d) => !d.deactivated);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/databricks');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ configured: false, ready: false, error: 'Could not reach the Databricks route.' });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    setResult(null);
    try {
      const serials = activeDevices.map((d) => d.serialNumber).filter(Boolean);
      const res = await fetch('/api/databricks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serials }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Refresh failed.');
        return;
      }

      // Apply each returned tester row to the matching device record.
      let updated = 0;
      (data.testers as TesterRow[]).forEach((t) => {
        if (!t.serial) return;
        const device = getDeviceBySerial(t.serial);
        if (!device) return;
        const updates: Record<string, string> = {};
        if (t.name && t.name !== device.assignedTo) updates.assignedTo = t.name;
        if (t.email && t.email !== device.assignedEmail) updates.assignedEmail = t.email;
        if (t.network && t.network !== device.network) updates.network = t.network;
        if (t.location && t.location !== device.location) updates.location = t.location;
        if (Object.keys(updates).length > 0) {
          updateDevice(device.id, updates as any);
          updated++;
        }
      });

      setResult({ matched: data.matched, updated, notFound: data.notFound || [] });
    } catch (e: any) {
      setError(e.message || 'Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  };

  const ready = !!status?.ready && !!status?.testerTableConfigured;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-gray-900">Tester Info Refresh</h4>
            {status && !status.configured && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">Not configured</span>
            )}
            {status?.configured && !ready && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">Setup needed</span>
            )}
            {ready && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Connected</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Pulls current tester name, email & network for each device from Databricks (read-only) and refreshes the records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="text-xs font-medium px-2.5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {checking ? 'Checking…' : '↻ Re-check'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={!ready || refreshing || activeDevices.length === 0}
            title={
              !status?.configured ? 'Add Databricks credentials to .env.local'
              : !status?.testerTableConfigured ? 'Set DATABRICKS_TESTER_TABLE in .env.local'
              : !status?.ready ? 'Databricks token not valid'
              : 'Refresh tester info from Databricks'
            }
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refreshing ? 'Refreshing…' : `Refresh Tester Info (${activeDevices.length})`}
          </button>
        </div>
      </div>

      {/* Connection / setup detail */}
      {status && !ready && (
        <div className="mt-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          {!status.configured
            ? <>Add <code className="bg-white/60 px-1 rounded">DATABRICKS_HOST</code>, <code className="bg-white/60 px-1 rounded">DATABRICKS_TOKEN</code> and <code className="bg-white/60 px-1 rounded">DATABRICKS_WAREHOUSE_ID</code> to <code className="bg-white/60 px-1 rounded">.env.local</code>, then re-check.</>
            : !status.testerTableConfigured
            ? <>Connected as <strong>{status.identity}</strong>. Now set <code className="bg-white/60 px-1 rounded">DATABRICKS_TESTER_TABLE</code> (the table mapping serial → tester) in <code className="bg-white/60 px-1 rounded">.env.local</code>. Don't know it yet? We can discover it with a read-only query.</>
            : status.error
            ? <>{status.error}</>
            : <>Databricks token isn't valid yet — re-check after auth.</>}
        </div>
      )}

      {ready && (
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span>Connected as {status?.identity}</span>
          {status?.testerTable && <span>·  Source: <code className="text-gray-500">{status.testerTable}</code></span>}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          Matched {result.matched} device(s) in Databricks — <span className="font-semibold">{result.updated} record(s) updated</span>.
          {result.notFound.length > 0 && (
            <span className="block mt-1 text-blue-600/80">
              {result.notFound.length} serial(s) had no tester match: {result.notFound.slice(0, 8).join(', ')}{result.notFound.length > 8 ? '…' : ''}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
      )}
    </div>
  );
}
