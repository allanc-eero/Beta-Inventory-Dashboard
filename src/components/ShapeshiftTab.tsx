'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePackagesStore } from '@/store/packagesStore';
import { useDeviceStore } from '@/store/deviceStore';
import { useAuthStore } from '@/store/authStore';
import { ShapeshiftJob, ShapeshiftTargetEnv, ShapeshiftJobStatus } from '@/types';
import { Zap, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button, Select, Input, Tag, Card, Checkbox, Segmented } from '@amzn/eero-web-design-components';

type TagColor = 'grey' | 'navy' | 'periwinkle' | 'green' | 'orange' | 'red' | 'turquoise' | 'ocean' | 'purple' | 'terracotta' | 'yellow';

const STATUS_TAG_COLORS: Record<ShapeshiftJobStatus, TagColor> = {
  queued: 'periwinkle',
  in_progress: 'orange',
  success: 'green',
  failed: 'red',
  cancelled: 'grey',
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
        <h2 className="text-xl font-bold text-[var(--ui-text-text-primary)] flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--ui-core-periwinkle-periwinkle-6)]" />
          Shapeshift
        </h2>
        <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">
          Automates the prod ↔ stage shapeshift workflow. Scan a serial, pick the target environment, and hit Shapeshift. Jobs run in the background — queue multiple units in a row.
        </p>
      </div>

      {/* eero CLI status banner */}
      {cliStatus && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm flex items-start gap-2 ${
          cliStatus.ready
            ? 'bg-[var(--ui-support-fill-support-success)] border-[var(--ui-support-border-support-success)] text-[var(--ui-support-text-support-success)]'
            : 'bg-[var(--ui-support-fill-support-warning)] border-[var(--ui-support-border-support-warning)] text-[var(--ui-support-text-icon-support-warning)]'
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
            <Button
              type="default"
              size="medium"
              onClick={refreshStatus}
              loading={checkingStatus}
              label={checkingStatus ? 'Checking…' : '↻ Re-check'}
            />
          </div>
        </div>
      )}

      {/* Good to know */}
      <Card size={3} title={<span className="text-sm font-semibold text-[var(--ui-text-text-primary)]">▸ Good to Know</span>}>
        <ul className="space-y-2 text-sm text-[var(--ui-text-text-secondary)]">
          <li><strong>Tokens expire.</strong> The browser-cookie admin auth is session-based and will lapse. When it does, the status banner above turns yellow and tells you which command to run. Re-auth, reload, done.</li>
          <li><strong>In-memory jobs.</strong> Job status lives in server memory — if the dev server restarts mid-shapeshift, the UI loses the job, though the actual move continues on eero's side. (A database would fix this for production.)</li>
          <li><strong>Don't double-run the same unit.</strong> Let a device finish its move before testing on it again, or use a different device. Re-running a unit that's mid-shapeshift can confuse the job state.</li>
          <li><strong>It's slow on purpose.</strong> OTA + reboot + heartbeat takes several minutes. The "Running…" state is normal — don't interpret it as hung. Expand the job to watch live CLI output.</li>
        </ul>
      </Card>

      {/* Queue a serial */}
      <Card size={3} title={<span className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider">Queue a Serial</span>}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          {/* Serial input with device picker */}
          <div className="relative">
            <div className="flex gap-1 items-end">
              <div className="flex-1">
                <Input
                  id="shapeshift-serial"
                  label="Serial"
                  layout="vertical"
                  value={serial}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSerial(e.target.value)}
                  placeholder="e.g. GGC3530B522401A5"
                  className="font-mono"
                />
              </div>
              <Button
                type="default"
                size="medium"
                onClick={() => setShowSearch(!showSearch)}
                ariaLabel="Pick from existing devices"
                label="↓"
              />
            </div>
            {/* Device picker dropdown */}
            {showSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--ui-background-layer-layer-page)] border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by serial, name..."
                  className="w-full px-3 py-2 border-b border-[var(--ui-background-layer-border-border-layer-page)] text-sm focus:outline-none"
                  autoFocus
                />
                {searchResults.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDevice(d.serialNumber)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--ui-background-layer-layer-page-hover)] border-b border-[var(--ui-background-layer-border-border-layer-page)] last:border-0"
                  >
                    <span className="font-mono font-medium">{d.serialNumber}</span>
                    <span className="text-[var(--ui-text-text-placeholder)] ml-2">{d.internalName || d.model} · {d.assignedTo || 'unassigned'}</span>
                  </button>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <p className="px-3 py-2 text-xs text-[var(--ui-text-text-placeholder)]">No devices found. Type serial manually above.</p>
                )}
              </div>
            )}
          </div>

          {/* Target env */}
          <div>
            <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Target Env</label>
            <Select
              id="shapeshift-target-env"
              value={targetEnv}
              onChange={(val) => setTargetEnv(val as ShapeshiftTargetEnv)}
              options={[
                { value: 'stage', label: 'stage (prod → stage)' },
                { value: 'prod', label: 'prod (stage → prod)' },
              ]}
            />
          </div>

          {/* Network ID */}
          <div>
            <Input
              id="shapeshift-network"
              label="Network (optional)"
              layout="vertical"
              value={networkId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNetworkId(e.target.value)}
              placeholder="e.g. 5754479"
            />
            <p className="text-xs text-[var(--ui-text-text-placeholder)] mt-1">If set, shapeshifts the whole network. Otherwise just the eero serial.</p>
          </div>

          {/* Retries */}
          <div>
            <Input
              id="shapeshift-retries"
              label="Retries"
              layout="vertical"
              type="number"
              min={1}
              max={50}
              value={retries}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRetries(parseInt(e.target.value) || 10)}
            />
          </div>

          {/* Submit button */}
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={!serial.trim() || !confirmed}
            label="Shapeshift →"
          />
        </div>

        {/* Options row */}
        <div className="flex items-center gap-6 mt-3 flex-wrap">
          <Checkbox
            checked={otaToLatest}
            onChange={(e: { target: { checked: boolean } }) => setOtaToLatest(e.target.checked)}
            label="OTA to latest stable in target env"
          />
          <Checkbox
            checked={confirmed}
            onChange={(e: { target: { checked: boolean } }) => setConfirmed(e.target.checked)}
            label="✓ I confirm the checklist"
          />
        </div>
      </Card>

      {/* Jobs list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--ui-text-text-primary)] uppercase tracking-wider">Jobs</h3>
          <Segmented
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as ShapeshiftJobStatus | 'all')}
            items={(['all', 'queued', 'in_progress', 'success', 'failed', 'cancelled'] as const).map((s) => ({
              value: s,
              label: s === 'all' ? 'All' : s.replace('_', ' '),
            }))}
          />
        </div>

        {filteredJobs.length === 0 ? (
          <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-12 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-[var(--ui-text-text-disabled)]" />
            <p className="text-sm text-[var(--ui-text-text-placeholder)]">No shapeshift jobs yet. Queue one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[var(--ui-text-text-primary)]">{job.serial}</span>
                        <span className="text-[var(--ui-text-text-placeholder)]">→</span>
                        <span className="text-sm font-semibold text-[var(--ui-text-text-secondary)] uppercase">{job.targetEnv}</span>
                      </div>
                      <p className="text-xs text-[var(--ui-text-text-tertiary)] mt-0.5">
                        {job.status === 'in_progress' && `Attempt ${job.currentAttempt}/${job.retries} · `}
                        {job.assignedTo}
                        {job.networkId && ` · Network: ${job.networkId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag color={STATUS_TAG_COLORS[job.status]} size="regular">
                      {job.status.replace('_', ' ')}
                    </Tag>
                    {(job.status === 'queued' || job.status === 'in_progress') && (
                      <Button
                        type="text"
                        size="medium"
                        danger
                        onClick={() => cancelShapeshiftJob(job.id)}
                        ariaLabel="Cancel"
                        label={<X className="w-4 h-4" />}
                      />
                    )}
                    {/* Run via real eero CLI */}
                    {(job.status === 'queued' || job.status === 'failed') && (
                      <Button
                        type="primary"
                        size="medium"
                        onClick={() => runShapeshift(job)}
                        disabled={!cliStatus?.ready}
                        label={job.status === 'failed' ? 'Retry' : 'Run shapeshift'}
                      />
                    )}
                    {job.status === 'in_progress' && (
                      <Tag color="orange" size="regular">
                        Running…
                      </Tag>
                    )}
                    <button
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="text-[var(--ui-text-text-placeholder)] hover:text-[var(--ui-text-text-tertiary)] p-1"
                    >
                      {expandedJob === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedJob === job.id && (
                  <div className="border-t border-[var(--ui-background-layer-border-border-layer-page)] px-4 py-3 bg-[var(--ui-background-layer-layer-page-hover)] text-xs space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div><span className="text-[var(--ui-text-text-tertiary)]">Target:</span> <span className="font-medium">{job.targetEnv}</span></div>
                      <div><span className="text-[var(--ui-text-text-tertiary)]">Network:</span> <span className="font-medium">{job.networkId || '—'}</span></div>
                      <div><span className="text-[var(--ui-text-text-tertiary)]">Retries:</span> <span className="font-medium">{job.currentAttempt}/{job.retries}</span></div>
                      <div><span className="text-[var(--ui-text-text-tertiary)]">Queued by:</span> <span className="font-medium">{job.assignedTo}</span></div>
                      <div><span className="text-[var(--ui-text-text-tertiary)]">OTA:</span> <span className="font-medium">{job.otaToLatest ? 'Yes' : 'No'}</span></div>
                      <div><span className="text-[var(--ui-text-text-tertiary)]">Created:</span> <span className="font-medium">{new Date(job.createdAt).toLocaleString()}</span></div>
                      {job.completedAt && <div><span className="text-[var(--ui-text-text-tertiary)]">Completed:</span> <span className="font-medium">{new Date(job.completedAt).toLocaleString()}</span></div>}
                    </div>

                    {/* Live CLI output / console log */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[var(--ui-text-text-tertiary)] font-medium uppercase tracking-wide">CLI Output</span>
                        {job.status === 'in_progress' && (
                          <span className="text-[var(--ui-support-text-icon-support-warning)] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[var(--ui-core-orange-orange-6)] rounded-full animate-pulse" /> streaming…
                          </span>
                        )}
                      </div>
                      {job.log && job.log.length > 0 ? (
                        <pre className="max-h-64 overflow-auto bg-gray-900 text-gray-100 rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap break-words font-mono">
{job.log.join('\n')}
                        </pre>
                      ) : (
                        <p className="text-[var(--ui-text-text-placeholder)] italic">No output yet. Click "Run shapeshift" to start.</p>
                      )}
                    </div>

                    {/* What this does / how to retry */}
                    {job.status === 'failed' && (
                      <div className="p-2.5 bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-lg text-[var(--ui-support-text-support-error)]">
                        <p className="font-medium">This shapeshift failed.</p>
                        <p className="mt-0.5">Check the CLI output above for the reason. Common causes: admin token expired (re-run <code className="bg-[var(--ui-background-layer-layer-page)] px-1 rounded">eero api admin --prod auth</code>), the eero didn't heartbeat in time (it may still be rebooting — verify in the {job.targetEnv} admin panel before retrying), or it's already in {job.targetEnv}. Click <strong>Retry</strong> to run it again.</p>
                      </div>
                    )}
                    {job.status === 'in_progress' && (
                      <div className="p-2.5 bg-[var(--ui-support-fill-support-warning)] border border-[var(--ui-support-border-support-warning)] rounded-lg text-[var(--ui-support-text-icon-support-warning)]">
                        Shapeshift in progress — this includes an OTA to the cross-environment firmware, a reboot, and a heartbeat wait. It can take several minutes. Leave this open to watch progress.
                      </div>
                    )}
                    {job.status === 'success' && (
                      <div className="p-2.5 bg-[var(--ui-support-fill-support-success)] border border-[var(--ui-support-border-support-success)] rounded-lg text-[var(--ui-support-text-support-success)]">
                        ✓ Device moved to <strong>{job.targetEnv}</strong>. The device record's environment was updated and the move was logged to its timeline. Confirm in the {job.targetEnv} admin panel if needed.
                      </div>
                    )}

                    {job.notes && <p className="text-[var(--ui-text-text-tertiary)] mt-2">{job.notes}</p>}
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
