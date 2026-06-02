'use client';

import { useState, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Device, Program } from '@/types';
import DeviceDetailPanel from './DeviceDetailPanel';
import BulkReturnPanel from './BulkReturnPanel';
import { useAuthStore } from '@/store/authStore';

type DeviceAction = 'return' | 'archive' | 'brick_and_return';

interface ProgramInfo {
  name: Program;
  label: string;
  deviceCount: number;
  onlineCount: number;
  offlineCount: number;
  deactivatedCount: number;
}

const PROGRAM_LABELS: Record<Program, string> = {
  beta: 'Beta',
  dogfood: 'Dogfood',
  prq: 'PRQ',
  pvt: 'PVT',
  evt: 'EVT',
  dvt: 'DVT',
  other: 'Other',
};

export default function ProgramsTab() {
  const { devices, updateDevice, addHistoryEntry, addClosedProgram, getClosedPrograms, addProcessedDevicesToProgram } = useDeviceStore();
  const { canEdit } = useAuthStore();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [closingProgram, setClosingProgram] = useState(false);
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [deviceActions, setDeviceActions] = useState<Record<string, DeviceAction>>({});
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [bulkReturnDevices, setBulkReturnDevices] = useState<Device[] | null>(null);
  const [processResults, setProcessResults] = useState<{
    emailsSent: { email: string; deviceCount: number }[];
    devicesBricked: string[];
    devicesArchived: number;
    devicesReturned: number;
    totalProcessed: number;
  } | null>(null);

  // Build program summaries
  const programs: ProgramInfo[] = useMemo(() => {
    const programNames: Program[] = ['beta', 'dogfood', 'prq', 'pvt', 'evt', 'dvt', 'other'];
    return programNames
      .map((name) => {
        const programDevices = devices.filter((d) => d.program === name);
        const product = programDevices.find((d) => d.product)?.product || '';
        return {
          name,
          label: product ? `${product} ${PROGRAM_LABELS[name]}` : PROGRAM_LABELS[name],
          deviceCount: programDevices.length,
          onlineCount: programDevices.filter((d) => d.status === 'online').length,
          offlineCount: programDevices.filter((d) => d.status === 'not_online').length,
          deactivatedCount: programDevices.filter((d) => d.status === 'deactivated').length,
        };
      })
      .filter((p) => p.deviceCount > 0);
  }, [devices]);

  const selectedDevices = useMemo(() => {
    if (!selectedProgram) return [];
    return devices.filter((d) => d.program === selectedProgram && d.status !== 'deactivated');
  }, [devices, selectedProgram]);

  const handleStartClose = (program: Program) => {
    setSelectedProgram(program);
    setClosingProgram(true);
    // Start with no actions selected — user must explicitly choose
    setDeviceActions({});
  };

  const handleSetAllActions = (action: DeviceAction) => {
    const updated: Record<string, DeviceAction> = {};
    selectedDevices.forEach((d) => { updated[d.id] = action; });
    setDeviceActions(updated);
  };

  const handleProcessClose = () => {
    setProcessing(true);

    Object.entries(deviceActions).forEach(([deviceId, action]) => {
      const device = devices.find((d) => d.id === deviceId);
      if (!device) return;

      switch (action) {
        case 'return':
          // Mark for return — set status to deactivated
          updateDevice(deviceId, { status: 'deactivated', deactivated: true });
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'program_closed',
            user: 'Admin',
            description: `Program ${selectedProgram} closed — device marked for return to eero`,
          });
          break;

        case 'brick_and_return':
          // Brick via API + mark for return
          updateDevice(deviceId, { status: 'deactivated', deactivated: true });
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'bricked',
            user: 'Admin',
            description: `Program ${selectedProgram} closed — device bricked via Partner API (POST /2.2/eeros/:id/activation_state — active: false)`,
          });
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'program_closed',
            user: 'Admin',
            description: `Device bricked & marked for return to eero. Return email will be sent to ${device.assignedEmail || device.assignedTo || 'assignee'}.`,
          });
          break;

        case 'archive':
          // Archive — mark as deactivated but keep all data
          updateDevice(deviceId, { status: 'deactivated', deactivated: true });
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'program_closed',
            user: 'Admin',
            description: `Program ${selectedProgram} closed — device archived`,
          });
          break;
      }
    });

    // Collect results for confirmation screen
    const brickDevices = Object.entries(deviceActions)
      .filter(([, a]) => a === 'brick_and_return')
      .map(([id]) => devices.find((d) => d.id === id))
      .filter(Boolean) as Device[];

    const returnDevices = Object.entries(deviceActions)
      .filter(([, a]) => a === 'return' || a === 'brick_and_return')
      .map(([id]) => devices.find((d) => d.id === id))
      .filter(Boolean) as Device[];

    // Group return devices by assignee for emails
    const emailGroups: Record<string, Device[]> = {};
    returnDevices.forEach((d) => {
      const email = d.assignedEmail || d.assignedTo || 'unassigned';
      if (email === 'unassigned') return;
      if (!emailGroups[email]) emailGroups[email] = [];
      emailGroups[email].push(d);
    });

    // Generate emails and labels for return/brick_and_return devices
    Object.entries(emailGroups).forEach(([email, assigneeDevices]) => {
      const testerName = assigneeDevices[0].assignedTo || assigneeDevices[0].checkedOutTo || 'Team Member';
      const subject = encodeURIComponent(`[Action Required] Return ${assigneeDevices.length} eero device(s) — Program ${selectedProgram} closed`);
      const body = encodeURIComponent(
`Hi ${testerName},

The ${PROGRAM_LABELS[selectedProgram!]} program has ended. We need you to return ${assigneeDevices.length} device(s).

Devices to return:
${assigneeDevices.map((d) => `- ${d.serialNumber} (${d.model})`).join('\n')}

Please follow these steps:
1. Disconnect all devices from power and your network
2. Pack them securely
3. Use the attached return shipping label
4. Drop off at any UPS or FedEx location

Please return within 7 business days.

Thank you,
Device Management Team`
      );

      // Open email for first tester (browser limits multiple mailto)
      if (email === Object.keys(emailGroups)[0]) {
        window.open(`mailto:${email}?from=beta-team@eero.com&subject=${subject}&body=${body}`, '_self');
      }
    });

    // Save closed program history record
    addClosedProgram({
      id: crypto.randomUUID(),
      program: selectedProgram!,
      closedAt: new Date().toISOString(),
      closedBy: 'Admin',
      totalDevices: Object.keys(deviceActions).length,
      actions: Object.entries(deviceActions).map(([deviceId, action]) => {
        const device = devices.find((d) => d.id === deviceId);
        return {
          deviceId,
          serial: device?.serialNumber || '',
          assignee: device?.assignedEmail || device?.assignedTo || 'unassigned',
          action,
          region: device?.country || 'Unknown',
          processedAt: new Date().toISOString(),
        };
      }),
    });

    setProcessResults({
      emailsSent: Object.entries(emailGroups).map(([email, devs]) => ({ email, deviceCount: devs.length })),
      devicesBricked: brickDevices.map((d) => d.serialNumber),
      devicesArchived: Object.values(deviceActions).filter((a) => a === 'archive').length,
      devicesReturned: returnDevices.length,
      totalProcessed: Object.keys(deviceActions).length,
    });

    setProcessing(false);
    setClosingProgram(false);
  };

  // ─── Results Confirmation Screen ──────────────────────────────────────
  if (processResults) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">✓ Program Closed Successfully</h2>
        <p className="text-sm text-gray-500">{PROGRAM_LABELS[selectedProgram!] || 'Program'} — {processResults.totalProcessed} devices processed</p>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{processResults.totalProcessed}</p>
            <p className="text-xs text-gray-500">Total Processed</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{processResults.devicesBricked.length}</p>
            <p className="text-xs text-red-600">Devices Bricked</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{processResults.emailsSent.length}</p>
            <p className="text-xs text-blue-600">Emails Sent</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{processResults.devicesArchived}</p>
            <p className="text-xs text-gray-500">Archived</p>
          </div>
        </div>

        {/* Bricked devices confirmation */}
        {processResults.devicesBricked.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 p-5">
            <h3 className="text-sm font-semibold text-red-800 mb-3">⚠️ Devices Bricked via Partner API ({processResults.devicesBricked.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {processResults.devicesBricked.map((serial) => (
                <div key={serial} className="flex items-center gap-2 text-xs">
                  <span className="text-red-500">●</span>
                  <span className="font-mono">{serial}</span>
                  <span className="text-red-600 font-medium">Bricked</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emails sent confirmation */}
        {processResults.emailsSent.length > 0 && (
          <div className="bg-white rounded-xl border border-blue-200 p-5">
            <h3 className="text-sm font-semibold text-blue-800 mb-3">📧 Return Emails Sent ({processResults.emailsSent.length} testers)</h3>
            <div className="space-y-2">
              {processResults.emailsSent.map(({ email, deviceCount }) => (
                <div key={email} className="flex items-center justify-between text-sm p-2 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">{email}</span>
                  <span className="text-xs text-blue-600 font-medium">{deviceCount} device(s) · Email sent ✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => { setProcessResults(null); setSelectedProgram(null); }}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Programs
        </button>
      </div>
    );
  }

  // ─── Close Program View ─────────────────────────────────────────────
  if (closingProgram && selectedProgram) {
    const actionCounts = {
      return: Object.values(deviceActions).filter((a) => a === 'return').length,
      brick_and_return: Object.values(deviceActions).filter((a) => a === 'brick_and_return').length,
      archive: Object.values(deviceActions).filter((a) => a === 'archive').length,
    };

    return (
      <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium mb-1"
              onClick={() => { setClosingProgram(false); setSelectedProgram(null); }}
            >
              ← Back to programs
            </p>
            <h2 className="text-xl font-bold text-gray-900">Close Program: {PROGRAM_LABELS[selectedProgram]}</h2>
            <p className="text-sm text-gray-500 mt-1">Decide what happens to each device in this program</p>
          </div>
        </div>

        {/* Already Processed — persistent record */}
        {(() => {
          const programRecord = getClosedPrograms().find((cp) => cp.program === selectedProgram);
          if (!programRecord || programRecord.actions.length === 0) return null;
          const processed = programRecord.actions;
          return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-green-800">✓ Devices Already Processed</h3>
                <span className="text-xs text-green-600 font-medium">{processed.length} device(s) done</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-green-700 mb-2">
                <span>{processed.filter((d) => d.action === 'brick_and_return').length} bricked</span>
                <span>{processed.filter((d) => d.action === 'return').length} returned</span>
                <span>{processed.filter((d) => d.action === 'archive').length} archived</span>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-green-700 font-medium hover:text-green-900">View processed devices</summary>
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {processed.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-white rounded">
                      <span className="font-mono">{d.serial}</span>
                      <span className="text-gray-500">{d.assignee} · {d.region}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${d.action === 'brick_and_return' ? 'bg-red-100 text-red-700' : d.action === 'return' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{d.action.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          );
        })()}

        {/* Program-wide actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Program-Wide Actions</h3>
          <p className="text-xs text-gray-500 mb-4">
            Use these buttons to apply the same action to <strong>every device</strong> in this program across all regions. If you need different actions per region, skip this and use the per-region buttons below instead.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { handleSetAllActions('brick_and_return'); setBulkReturnDevices(selectedDevices); }}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Brick & Return All Devices
            </button>
            <button
              onClick={() => { handleSetAllActions('archive'); setBulkReturnDevices(selectedDevices); }}
              className="px-4 py-2 text-sm font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Archive All Devices
            </button>
            <button
              onClick={() => { handleSetAllActions('return'); setBulkReturnDevices(selectedDevices); }}
              className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Return All Devices
            </button>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-red-700 font-medium">{actionCounts.return} return</span>
              <span className="text-red-800 font-medium">{actionCounts.brick_and_return} brick & return</span>
              <span className="text-gray-600 font-medium">{actionCounts.archive} archive</span>
              {Object.keys(deviceActions).length === 0 && <span className="text-orange-600 font-medium">No actions selected yet</span>}
            </div>
            <button
              onClick={() => setShowPreview(true)}
              disabled={processing || Object.keys(deviceActions).length === 0}
              className="ml-auto px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview Changes →
            </button>
          </div>
        </div>

        {/* Dry Run Preview Modal */}
        {showPreview && (() => {
          const brickDevices = selectedDevices.filter((d) => deviceActions[d.id] === 'brick_and_return');
          const returnDevices = selectedDevices.filter((d) => deviceActions[d.id] === 'return');
          const archiveDevices = selectedDevices.filter((d) => deviceActions[d.id] === 'archive');
          const previewTime = new Date().toLocaleString();

          // Group by region for the preview
          const brickByRegion: Record<string, Device[]> = {};
          brickDevices.forEach((d) => { const r = d.country || 'Unknown'; if (!brickByRegion[r]) brickByRegion[r] = []; brickByRegion[r].push(d); });
          const returnByRegion: Record<string, Device[]> = {};
          returnDevices.forEach((d) => { const r = d.country || 'Unknown'; if (!returnByRegion[r]) returnByRegion[r] = []; returnByRegion[r].push(d); });
          const archiveByRegion: Record<string, Device[]> = {};
          archiveDevices.forEach((d) => { const r = d.country || 'Unknown'; if (!archiveByRegion[r]) archiveByRegion[r] = []; archiveByRegion[r].push(d); });

          const exportPreviewCSV = () => {
            const rows = [['Serial Number', 'Assigned To', 'Email', 'Region', 'Status', 'Action', 'Program']];
            selectedDevices.forEach((d) => {
              rows.push([d.serialNumber, d.assignedTo || '', d.assignedEmail || '', d.country || '', d.status, deviceActions[d.id] || 'archive', selectedProgram || '']);
            });
            const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `close-program-preview-${selectedProgram}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(false)} />
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Preview: Close Program {PROGRAM_LABELS[selectedProgram]}</h2>
                  <button onClick={exportPreviewCSV} className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-50">
                    Export Preview (CSV)
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-1">Review exactly what will happen before executing. Nothing has been changed yet.</p>
                <p className="text-xs text-gray-400 mb-6">Preview generated: {previewTime}</p>

                {/* Brick & Return section */}
                {brickDevices.length > 0 && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">🚨 BRICK & RETURN — {brickDevices.length} device(s)</h3>
                    <p className="text-xs text-red-600 mb-3">These devices will be permanently deactivated via the Partner API. They will never connect to a network again. Return emails will be sent.</p>
                    {Object.entries(brickByRegion).map(([region, devices]) => (
                      <div key={region} className="mb-2">
                        <p className="text-xs font-medium text-red-700">📍 {region} ({devices.length})</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {devices.map((d) => <span key={d.id} className="text-xs font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{d.serialNumber}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Return section */}
                {returnDevices.length > 0 && (
                  <div className="mb-5 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-orange-800 mb-2">📦 RETURN TO EERO — {returnDevices.length} device(s)</h3>
                    <p className="text-xs text-orange-600 mb-3">These devices will be marked as "Pending Return." Return emails will be sent. Devices stay active until you confirm receipt.</p>
                    {Object.entries(returnByRegion).map(([region, devices]) => (
                      <div key={region} className="mb-2">
                        <p className="text-xs font-medium text-orange-700">📍 {region} ({devices.length})</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {devices.map((d) => <span key={d.id} className="text-xs font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">{d.serialNumber}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Archive section */}
                {archiveDevices.length > 0 && (
                  <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">📁 ARCHIVE — {archiveDevices.length} device(s)</h3>
                    <p className="text-xs text-gray-500 mb-3">These devices will be marked as deactivated. Data is preserved. No emails sent.</p>
                    {Object.entries(archiveByRegion).map(([region, devices]) => (
                      <div key={region} className="mb-2">
                        <p className="text-xs font-medium text-gray-600">📍 {region} ({devices.length})</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {devices.map((d) => <span key={d.id} className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{d.serialNumber}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-red-700">{brickDevices.length}</p>
                      <p className="text-xs text-gray-600">Bricked</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-orange-600">{returnDevices.length}</p>
                      <p className="text-xs text-gray-600">Pending Return</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-600">{archiveDevices.length}</p>
                      <p className="text-xs text-gray-600">Archived</p>
                    </div>
                  </div>
                </div>

                {/* Batch processing option for bricking */}
                {brickDevices.length > 10 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                    <h3 className="text-xs font-semibold text-yellow-800 mb-1">⚡ Large batch detected — consider processing in stages</h3>
                    <p className="text-xs text-yellow-700 mb-3">You're about to brick {brickDevices.length} devices. We recommend processing by region using the per-region buttons instead, so you can verify each batch before continuing.</p>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-xs font-medium text-yellow-800 border border-yellow-300 px-3 py-1.5 rounded-md hover:bg-yellow-100"
                    >
                      ← Go back and process by region instead
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ← Go Back & Edit
                  </button>
                  <button
                    onClick={() => { setShowPreview(false); handleProcessClose(); }}
                    disabled={processing}
                    className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${brickDevices.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {processing ? 'Processing...' : `Confirm & Execute (${selectedDevices.length} devices)`}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Device list — grouped by region/country */}
        {(() => {
          const grouped: Record<string, typeof selectedDevices> = {};
          selectedDevices.forEach((d) => {
            const region = d.country || 'Unknown Region';
            if (!grouped[region]) grouped[region] = [];
            grouped[region].push(d);
          });
          const regions = Object.keys(grouped).sort();
          const missingRegion = grouped['Unknown Region'] || [];

          return (
            <div className="space-y-4">
              {/* Warning for devices missing region data */}
              {missingRegion.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600">⚠️</span>
                    <span className="text-sm font-semibold text-red-800">{missingRegion.length} device(s) missing region/country data</span>
                  </div>
                  <p className="text-xs text-red-700 mb-2">These devices have no country assigned. Update them in the device detail or re-import with the Country column filled in.</p>
                  <div className="flex flex-wrap gap-2">
                    {missingRegion.map((d) => (
                      <span key={d.id} className="text-xs font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        {d.serialNumber} ({d.assignedTo || d.assignedEmail || 'unassigned'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {regions.map((region) => (
                <div key={region} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">📍 {region}</span>
                      <span className="text-xs text-gray-400">{grouped[region].length} device(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Set region to:</span>
                      <button
                        onClick={() => {
                          const updated = { ...deviceActions };
                          grouped[region].forEach((d) => { updated[d.id] = 'brick_and_return'; });
                          setDeviceActions(updated);
                        }}
                        className="px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200 rounded hover:bg-red-50"
                      >
                        Brick & Return
                      </button>
                      <button
                        onClick={() => {
                          const updated = { ...deviceActions };
                          grouped[region].forEach((d) => { updated[d.id] = 'archive'; });
                          setDeviceActions(updated);
                        }}
                        className="px-2 py-0.5 text-xs font-medium text-gray-600 border border-gray-200 rounded hover:bg-gray-100"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Serial</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {grouped[region].map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-mono text-xs">
                            <button
                              onClick={() => setDetailDevice(device)}
                              className="text-blue-700 font-medium hover:underline cursor-pointer"
                            >
                              {device.serialNumber}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{device.assignedTo || device.assignedEmail || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {device.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <select
                              value={deviceActions[device.id] || ''}
                              onChange={(e) => setDeviceActions({ ...deviceActions, [device.id]: e.target.value as DeviceAction })}
                              className={`px-2 py-1 text-xs border rounded-md ${deviceActions[device.id] ? 'border-gray-200' : 'border-orange-300 bg-orange-50'}`}
                            >
                              <option value="" disabled>Select action...</option>
                              <option value="return">Return to eero</option>
                              <option value="brick_and_return">Brick & Return</option>
                              <option value="archive">Archive</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Per-region process button */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {grouped[region].filter((d) => deviceActions[d.id] === 'brick_and_return').length} brick & return · {grouped[region].filter((d) => deviceActions[d.id] === 'return').length} return · {grouped[region].filter((d) => deviceActions[d.id] === 'archive').length} archive · {grouped[region].filter((d) => !deviceActions[d.id]).length} unset
                    </div>
                    <button
                      onClick={() => setBulkReturnDevices(grouped[region])}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Process {region} ({grouped[region].length} devices) →
                    </button>
                  </div>
                </div>
              ))}

              {/* Region Preview Modal — replaced by BulkReturnPanel */}
            </div>
          );
        })()}
      </div>

      {detailDevice && (
        <DeviceDetailPanel device={detailDevice} onClose={() => setDetailDevice(null)} />
      )}
      {bulkReturnDevices && (
        <BulkReturnPanel devices={bulkReturnDevices} onClose={() => {
          // Track what was processed — save to persistent store
          const processed = bulkReturnDevices.filter((d) => {
            const current = devices.find((dev) => dev.id === d.id);
            return current && (current.status === 'deactivated' || current.status === 'pending_return');
          });
          if (processed.length > 0 && selectedProgram) {
            const now = new Date().toISOString();
            addProcessedDevicesToProgram(selectedProgram, processed.map((d) => ({
              deviceId: d.id,
              serial: d.serialNumber,
              assignee: d.assignedEmail || d.assignedTo || '—',
              action: devices.find((dev) => dev.id === d.id)?.status === 'deactivated' ? 'brick_and_return' : 'return',
              region: d.country || 'Unknown',
              processedAt: now,
            })));
          }
          setBulkReturnDevices(null);
        }} />
      )}
      </>
    );
  }

  // ─── Main Programs View ─────────────────────────────────────────────
  const closedPrograms = getClosedPrograms();

  // A program is only "fully archived" when ALL its devices are deactivated/pending_return
  const fullyArchivedPrograms = new Set(
    closedPrograms
      .filter((cp) => {
        const programDevices = devices.filter((d) => d.program === cp.program);
        return programDevices.length > 0 && programDevices.every((d) => d.status === 'deactivated' || d.status === 'pending_return');
      })
      .map((cp) => cp.program)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Programs</h2>
      </div>

      {/* Active program cards — includes programs with partial processing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.filter((p) => !fullyArchivedPrograms.has(p.name)).map((prog) => {
          const programRecord = closedPrograms.find((cp) => cp.program === prog.name);
          const processedCount = programRecord?.actions.length || 0;
          const hasProgress = processedCount > 0;

          return (
          <div key={prog.name} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">{prog.label}</h3>
              {hasProgress ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">In Progress</span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{prog.deviceCount}</p>
                <p className="text-xs text-gray-500">Total Devices</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{prog.onlineCount}</p>
                <p className="text-xs text-gray-500">Online Devices</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-600">{prog.offlineCount}</p>
                <p className="text-xs text-gray-500">Offline Devices</p>
              </div>
            </div>

            {/* Progress indicator when partially processed */}
            {hasProgress && (
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="font-medium">{processedCount} processed</span>
                  <span>{programRecord!.actions.filter((a) => a.action === 'brick_and_return').length} bricked</span>
                  <span>{programRecord!.actions.filter((a) => a.action === 'archive').length} archived</span>
                  <span>{programRecord!.actions.filter((a) => a.action === 'return').length} returned</span>
                </div>
              </div>
            )}

            {prog.deactivatedCount > 0 && !hasProgress && (
              <p className="text-xs text-gray-400 mb-3">{prog.deactivatedCount} deactivated</p>
            )}

            {canEdit() && (
              <button
                onClick={() => handleStartClose(prog.name)}
                className="w-full py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {hasProgress ? 'Continue Processing →' : 'Close Program →'}
              </button>
            )}
          </div>
          );
        })}
      </div>

      {programs.filter((p) => !fullyArchivedPrograms.has(p.name)).length === 0 && closedPrograms.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No active programs with devices</p>
        </div>
      )}

      {/* Archived/Closed programs */}
      {/* Archived/Closed programs — only fully processed ones */}
      {closedPrograms.filter((cp) => fullyArchivedPrograms.has(cp.program)).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Archived Programs</h3>
          <div className="space-y-3">
            {closedPrograms.filter((cp) => fullyArchivedPrograms.has(cp.program)).map((cp) => (
              <div key={cp.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-semibold text-gray-900">{PROGRAM_LABELS[cp.program as Program] || cp.program}</h4>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Archived</span>
                  </div>
                  <span className="text-xs text-gray-400">Closed {new Date(cp.closedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>Closed by {cp.closedBy}</span>
                  <span>·</span>
                  <span>{cp.totalDevices} devices processed</span>
                  <span>{cp.actions.filter((a) => a.action === 'brick_and_return').length} bricked</span>
                  <span>{cp.actions.filter((a) => a.action === 'archive').length} archived</span>
                  <span>{cp.actions.filter((a) => a.action === 'return').length} returned</span>
                </div>

                {/* Expandable device list */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                    View {cp.actions.length} devices
                  </summary>
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Serial</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Assignee</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {cp.actions.map((a, i) => {
                          const device = devices.find((d) => d.serialNumber === a.serial);
                          return (
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-mono">
                              {device ? (
                                <button
                                  onClick={() => setDetailDevice(device)}
                                  className="text-blue-700 font-medium hover:underline cursor-pointer"
                                >
                                  {a.serial}
                                </button>
                              ) : (
                                <span>{a.serial}</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-gray-600">{a.assignee}</td>
                            <td className="px-3 py-1.5">
                              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                a.action === 'brick_and_return' ? 'bg-red-100 text-red-700' :
                                a.action === 'return' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {a.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailDevice && (
        <DeviceDetailPanel device={detailDevice} onClose={() => setDetailDevice(null)} />
      )}
    </div>
  );
}
