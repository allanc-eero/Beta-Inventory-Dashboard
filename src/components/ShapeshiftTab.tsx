'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePackagesStore } from '@/store/packagesStore';
import { useDeviceStore } from '@/store/deviceStore';
import { useAuthStore } from '@/store/authStore';
import { ShapeshiftJob, ShapeshiftTargetEnv, ShapeshiftJobStatus } from '@/types';
import { Zap, ChevronDown, ChevronUp, X } from 'lucide-react';

const STATUS_COLORS: Record<ShapeshiftJobStatus, string> = {
  queued: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function ShapeshiftTab() {
  const { shapeshiftJobs, addShapeshiftJob, updateShapeshiftJob, cancelShapeshiftJob } = usePackagesStore();
  const { devices, addHistoryEntry, updateDevice } = useDeviceStore();
  const { currentUser } = useAuthStore();

  // Form state
  const [serial, setSerial] = useState('');
  const [targetEnv, setTargetEnv] = useState<ShapeshiftTargetEnv>('stage');
  const [networkId, setNetworkId] = useState('');
  const [retries, setRetries] = useState(10);
  const [otaToLatest, setOtaToLatest] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state for jobs
  const [filterStatus, setFilterStatus] = useState<ShapeshiftJobStatus | 'all'>('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Device search for picker
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return devices
      .filter((d) => d.serialNumber.toLowerCase().includes(q) || d.assignedTo?.toLowerCase().includes(q) || d.internalName?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, devices]);

  const filteredJobs = useMemo(() => {
    const sorted = [...shapeshiftJobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filterStatus === 'all') return sorted;
    return sorted.filter((j) => j.status === filterStatus);
  }, [shapeshiftJobs, filterStatus]);

  // eero CLI availability/auth status
  const [cliStatus, setCliStatus] = useState<{ available: boolean; ready: boolean; adminStageAuthenticated?: boolean; adminProdAuthenticated?: boolean; version?: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refreshStatus = async () => {
    setCheckingStatus(true);
    try {
      const r = await fetch('/api/shapeshift', { cache: 'no-store' });
      const d = await r.json();
      setCliStatus({
        available: !!d.available,
        ready: !!d.ready,
        adminStageAuthenticated: !!d.adminStageAuthenticated,
        adminProdAuthenticated: !!d.adminProdAuthenticated,
        version: d.version,
      });
      setLastChecked(new Date());
    } catch {
      setCliStatus({ available: false, ready: false });
      setLastChecked(new Date());
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus(); // on load
    const interval = setInterval(refreshStatus, 30000); // every 30s
    const onFocus = () => refreshStatus();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Poll a running shapeshift job until it finishes
  const pollJob = (jobId: string, job: ShapeshiftJob): Promise<{ ok: boolean; output: string }> =>
    new Promise((resolve) => {
      const tick = async () => {
        try {
          const res = await fetch(`/api/shapeshift?jobId=${jobId}`);
          const data = await res.json();
          if (!data.found) return resolve({ ok: false, output: 'Job not found.' });
          // Stream latest output into the job log for visibility
          updateShapeshiftJob(job.id, { log: [data.output] });
          if (data.status === 'running') {
            setTimeout(tick, 4000);
          } else {
            resolve({ ok: data.status === 'success', output: data.output });
          }
        } catch (err: any) {
          resolve({ ok: false, output: `Polling failed: ${err.message}` });
        }
      };
      tick();
    });

  // Execute a queued/failed job via the real eero CLI (PTY-driven, job-based)
  const runShapeshift = async (job: ShapeshiftJob) => {
    setExpandedJob(job.id); // auto-open so the operator sees live output
    updateShapeshiftJob(job.id, { status: 'in_progress', currentAttempt: (job.currentAttempt || 0) + 1 });
    try {
      const res = await fetch('/api/shapeshift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: job.targetEnv,
          ...(job.networkId ? { network: job.networkId } : { eero: job.serial }),
        }),
      });
      const data = await res.json();
      if (!data.success || !data.jobId) {
        updateShapeshiftJob(job.id, { status: 'failed', log: [...(job.log || []), data.error || 'Failed to start shapeshift job.'] });
        return;
      }

      // Poll the background job until it completes (several minutes).
      const result = await pollJob(data.jobId, job);
      const device = devices.find((d) => d.serialNumber.toUpperCase() === job.serial.toUpperCase());

      if (result.ok) {
        updateShapeshiftJob(job.id, { status: 'success', completedAt: new Date().toISOString(), log: [result.output] });
        if (device) {
          updateDevice(device.id, { environment: job.targetEnv });
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId: device.id,
            timestamp: new Date().toISOString(),
            action: 'shapeshifted',
            user: job.assignedTo,
            description: `Shapeshifted to ${job.targetEnv} via eero CLI${job.networkId ? ` (network: ${job.networkId})` : ` (eero: ${job.serial})`}`,
          });
        }
      } else {
        updateShapeshiftJob(job.id, { status: 'failed', log: [result.output] });
      }
    } catch (err: any) {
      updateShapeshiftJob(job.id, {
        status: 'failed',
        log: [...(job.log || []), `Request failed: ${err.message}`],
      });
    }
  };

  const handleSubmit = () => {
    if (!serial.trim() || !confirmed) return;

    const job: ShapeshiftJob = {
      id: crypto.randomUUID(),
      serial: serial.trim().toUpperCase(),
      targetEnv,
      networkId: networkId.trim() || undefined,
      retries,
      currentAttempt: 0,
      status: 'queued',
      otaToLatest,
      assignedTo: currentUser?.email || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addShapeshiftJob(job);
    // Reset form
    setSerial('');
    setNetworkId('');
    setConfirmed(false);
  };

  const handleSelectDevice = (serialNumber: string) => {
    setSerial(serialNumber);
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#2c3e7a]" />
          Shapeshift
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Automates the prod ↔ stage shapeshift workflow. Scan a serial, pick the target environment, and hit Shapeshift. Jobs run in the background — queue multiple units in a row.
        </p>
      </div>

      {/* eero CLI status banner */}
      {cliStatus && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm flex items-start gap-2 ${
          cliStatus.ready
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          {cliStatus.ready ? (
            <>
              <span>✓</span>
              <span className="flex-1">eero CLI connected{cliStatus.version ? ` (${cliStatus.version})` : ''} and admin-authenticated — shapeshifts run for real via <code className="bg-white/60 px-1 rounded">eero shapeshift</code>.</span>
            </>
          ) : (
            <>
              <span>⚠️</span>
              <span className="flex-1">
                {!cliStatus.available
                  ? 'eero CLI not found on the server — shapeshifts can be queued but not executed.'
                  : !cliStatus.adminStageAuthenticated && !cliStatus.adminProdAuthenticated
                  ? 'Both admin tokens are stale. Run `eero api admin auth` (stage) and `eero api admin --prod auth` (prod) on the server, then re-check. Execution is disabled until then.'
                  : !cliStatus.adminProdAuthenticated
                  ? 'Prod admin token is stale. Run `eero api admin --prod auth` on the server, then re-check. Execution is disabled until then.'
                  : !cliStatus.adminStageAuthenticated
                  ? 'Stage admin token is stale. Run `eero api admin auth` on the server, then re-check. Execution is disabled until then.'
                  : 'eero CLI not ready — execution is disabled.'}
              </span>
            </>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {lastChecked && (
              <span className="text-xs opacity-60">checked {lastChecked.toLocaleTimeString()}</span>
            )}
            <button
              onClick={refreshStatus}
              disabled={checkingStatus}
              className="text-xs font-medium px-2 py-1 rounded border border-current/30 hover:bg-white/40 disabled:opacity-50"
            >
              {checkingStatus ? 'Checking…' : '↻ Re-check'}
            </button>
          </div>
        </div>
      )}

      {/* Good to know */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">▸ Good to Know</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li><strong>Tokens expire.</strong> The browser-cookie admin auth is session-based and will lapse. When it does, the status banner above turns yellow and tells you which command to run. Re-auth, reload, done.</li>
          <li><strong>In-memory jobs.</strong> Job status lives in server memory — if the dev server restarts mid-shapeshift, the UI loses the job, though the actual move continues on eero's side. (A database would fix this for production.)</li>
          <li><strong>Don't double-run the same unit.</strong> Let a device finish its move before testing on it again, or use a different device. Re-running a unit that's mid-shapeshift can confuse the job state.</li>
          <li><strong>It's slow on purpose.</strong> OTA + reboot + heartbeat takes several minutes. The "Running…" state is normal — don't interpret it as hung. Expand the job to watch live CLI output.</li>
        </ul>
      </div>

      {/* Queue a serial */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Queue a Serial</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          {/* Serial input with device picker */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">Serial</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="e.g. GGC3530B522401A5"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-2 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
                title="Pick from existing devices"
              >
                ↓
              </button>
            </div>
            {/* Device picker dropdown */}
            {showSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by serial, name..."
                  className="w-full px-3 py-2 border-b border-gray-100 text-sm focus:outline-none"
                  autoFocus
                />
                {searchResults.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDevice(d.serialNumber)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-50 last:border-0"
                  >
                    <span className="font-mono font-medium">{d.serialNumber}</span>
                    <span className="text-gray-400 ml-2">{d.internalName || d.model} · {d.assignedTo || 'unassigned'}</span>
                  </button>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <p className="px-3 py-2 text-xs text-gray-400">No devices found. Type serial manually above.</p>
                )}
              </div>
            )}
          </div>

          {/* Target env */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target Env</label>
            <select
              value={targetEnv}
              onChange={(e) => setTargetEnv(e.target.value as ShapeshiftTargetEnv)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="stage">stage (prod → stage)</option>
              <option value="prod">prod (stage → prod)</option>
            </select>
          </div>

          {/* Network ID */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Network (optional)</label>
            <input
              type="text"
              value={networkId}
              onChange={(e) => setNetworkId(e.target.value)}
              placeholder="e.g. 5754479"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">If set, shapeshifts the whole network. Otherwise just the eero serial.</p>
          </div>

          {/* Retries */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Retries</label>
            <input
              type="number"
              min={1}
              max={50}
              value={retries}
              onChange={(e) => setRetries(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!serial.trim() || !confirmed}
            className="px-4 py-2 bg-[#2c3e7a] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f5e] disabled:opacity-40 disabled:cursor-not-allowed h-[38px]"
          >
            Shapeshift →
          </button>
        </div>

        {/* Options row */}
        <div className="flex items-center gap-6 mt-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={otaToLatest} onChange={(e) => setOtaToLatest(e.target.checked)} className="rounded border-gray-300" />
            OTA to latest stable in target env
          </label>
          <label className="flex items-center gap-2 text-sm text-blue-700 font-medium cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="rounded border-blue-400 text-blue-600" />
            ✓ I confirm the checklist
          </label>
        </div>
      </div>

      {/* Jobs list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Jobs</h3>
          <div className="flex items-center gap-1">
            {(['all', 'queued', 'in_progress', 'success', 'failed', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all capitalize ${
                  filterStatus === s ? 'bg-[#2c3e7a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No shapeshift jobs yet. Queue one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900">{job.serial}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-semibold text-gray-700 uppercase">{job.targetEnv}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {job.status === 'in_progress' && `Attempt ${job.currentAttempt}/${job.retries} · `}
                        {job.assignedTo}
                        {job.networkId && ` · Network: ${job.networkId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full uppercase ${STATUS_COLORS[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {(job.status === 'queued' || job.status === 'in_progress') && (
                      <button
                        onClick={() => cancelShapeshiftJob(job.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {/* Run via real eero CLI */}
                    {(job.status === 'queued' || job.status === 'failed') && (
                      <button
                        onClick={() => runShapeshift(job)}
                        disabled={!cliStatus?.ready}
                        title={!cliStatus?.available ? 'eero CLI not available' : !cliStatus?.ready ? 'eero CLI not admin-authenticated' : 'Run shapeshift via eero CLI'}
                        className="text-xs px-2.5 py-1 bg-[#2c3e7a] text-white rounded font-medium hover:bg-[#1e2f5e] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {job.status === 'failed' ? 'Retry' : 'Run shapeshift'}
                      </button>
                    )}
                    {job.status === 'in_progress' && (
                      <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded font-medium">
                        Running…
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {expandedJob === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedJob === job.id && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-xs space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div><span className="text-gray-500">Target:</span> <span className="font-medium">{job.targetEnv}</span></div>
                      <div><span className="text-gray-500">Network:</span> <span className="font-medium">{job.networkId || '—'}</span></div>
                      <div><span className="text-gray-500">Retries:</span> <span className="font-medium">{job.currentAttempt}/{job.retries}</span></div>
                      <div><span className="text-gray-500">Queued by:</span> <span className="font-medium">{job.assignedTo}</span></div>
                      <div><span className="text-gray-500">OTA:</span> <span className="font-medium">{job.otaToLatest ? 'Yes' : 'No'}</span></div>
                      <div><span className="text-gray-500">Created:</span> <span className="font-medium">{new Date(job.createdAt).toLocaleString()}</span></div>
                      {job.completedAt && <div><span className="text-gray-500">Completed:</span> <span className="font-medium">{new Date(job.completedAt).toLocaleString()}</span></div>}
                    </div>

                    {/* Live CLI output / console log */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-500 font-medium uppercase tracking-wide">CLI Output</span>
                        {job.status === 'in_progress' && (
                          <span className="text-yellow-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" /> streaming…
                          </span>
                        )}
                      </div>
                      {job.log && job.log.length > 0 ? (
                        <pre className="max-h-64 overflow-auto bg-gray-900 text-gray-100 rounded-lg p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words font-mono">
{job.log.join('\n')}
                        </pre>
                      ) : (
                        <p className="text-gray-400 italic">No output yet. Click "Run shapeshift" to start.</p>
                      )}
                    </div>

                    {/* What this does / how to retry */}
                    {job.status === 'failed' && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <p className="font-medium">This shapeshift failed.</p>
                        <p className="mt-0.5">Check the CLI output above for the reason. Common causes: admin token expired (re-run <code className="bg-white px-1 rounded">eero api admin --prod auth</code>), the eero didn't heartbeat in time (it may still be rebooting — verify in the {job.targetEnv} admin panel before retrying), or it's already in {job.targetEnv}. Click <strong>Retry</strong> to run it again.</p>
                      </div>
                    )}
                    {job.status === 'in_progress' && (
                      <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                        Shapeshift in progress — this includes an OTA to the cross-environment firmware, a reboot, and a heartbeat wait. It can take several minutes. Leave this open to watch progress.
                      </div>
                    )}
                    {job.status === 'success' && (
                      <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        ✓ Device moved to <strong>{job.targetEnv}</strong>. The device record's environment was updated and the move was logged to its timeline. Confirm in the {job.targetEnv} admin panel if needed.
                      </div>
                    )}

                    {job.notes && <p className="text-gray-600 mt-2">{job.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
