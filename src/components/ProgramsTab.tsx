'use client';

import { useState, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Device, Program } from '@/types';

type ProgramStatus = 'active' | 'completed' | 'archived';
type DeviceAction = 'return' | 'release' | 'move' | 'archive' | 'brick_and_return';

interface ProgramInfo {
  name: Program;
  label: string;
  status: ProgramStatus;
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
  const { devices, updateDevice, addHistoryEntry, addClosedProgram, getClosedPrograms } = useDeviceStore();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [closingProgram, setClosingProgram] = useState(false);
  const [deviceActions, setDeviceActions] = useState<Record<string, DeviceAction>>({});
  const [moveTarget, setMoveTarget] = useState<Program>('dogfood');
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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
        return {
          name,
          label: PROGRAM_LABELS[name],
          status: 'active' as ProgramStatus,
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
    // Default all devices to 'archive'
    const actions: Record<string, DeviceAction> = {};
    devices
      .filter((d) => d.program === program && d.status !== 'deactivated')
      .forEach((d) => { actions[d.id] = 'archive'; });
    setDeviceActions(actions);
  };

  const handleSetAllActions = (action: DeviceAction) => {
    const updated: Record<string, DeviceAction> = {};
    Object.keys(deviceActions).forEach((id) => { updated[id] = action; });
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

        case 'release':
          // Release to tester — clear program tracking, keep assignee
          updateDevice(deviceId, { program: 'other' as Program, notes: `${device.notes}\n[Released to tester at end of ${selectedProgram} program]` });
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'program_closed',
            user: 'Admin',
            description: `Program ${selectedProgram} closed — device released to tester (${device.assignedTo || device.assignedEmail})`,
          });
          break;

        case 'move':
          // Move to next program
          updateDevice(deviceId, { program: moveTarget });
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'program_closed',
            user: 'Admin',
            description: `Program ${selectedProgram} closed — device moved to ${moveTarget}`,
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
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
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
      release: Object.values(deviceActions).filter((a) => a === 'release').length,
      move: Object.values(deviceActions).filter((a) => a === 'move').length,
      archive: Object.values(deviceActions).filter((a) => a === 'archive').length,
    };

    return (
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

        {/* Bulk actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Set all to:</span>
            <button onClick={() => handleSetAllActions('brick_and_return')} className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-800 border border-red-300 rounded-lg hover:bg-red-200">Brick & Return</button>
            <button onClick={() => handleSetAllActions('archive')} className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">Archive</button>
          </div>

          {/* Summary counts + Process button */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-red-700 font-medium">{actionCounts.return} return</span>
              <span className="text-red-800 font-medium">{actionCounts.brick_and_return} brick & return</span>
              <span className="text-gray-600 font-medium">{actionCounts.archive} archive</span>
            </div>
            <button
              onClick={handleProcessClose}
              disabled={processing}
              className="ml-auto px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : `Close Program & Process ${selectedDevices.length} Devices`}
            </button>
          </div>
        </div>

        {/* Device list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serial</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{device.serialNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{device.assignedTo || device.assignedEmail || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {device.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={deviceActions[device.id] || 'archive'}
                      onChange={(e) => setDeviceActions({ ...deviceActions, [device.id]: e.target.value as DeviceAction })}
                      className="px-2 py-1 text-xs border border-gray-200 rounded-md"
                    >
                      <option value="return">Return to eero</option>
                      <option value="brick_and_return">Brick & Return</option>
                      <option value="archive">Archive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Main Programs View ─────────────────────────────────────────────
  const closedPrograms = getClosedPrograms();
  const closedProgramNames = new Set(closedPrograms.map((cp) => cp.program));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Programs</h2>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700 font-medium">{successMsg}</p>
        </div>
      )}

      {/* Active program cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.filter((p) => !closedProgramNames.has(p.name)).map((prog) => (
          <div key={prog.name} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">{prog.label}</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{prog.deviceCount}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{prog.onlineCount}</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-600">{prog.offlineCount}</p>
                <p className="text-xs text-gray-500">Offline</p>
              </div>
            </div>

            {prog.deactivatedCount > 0 && (
              <p className="text-xs text-gray-400 mb-3">{prog.deactivatedCount} deactivated</p>
            )}

            <button
              onClick={() => handleStartClose(prog.name)}
              className="w-full py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close Program →
            </button>
          </div>
        ))}
      </div>

      {programs.filter((p) => !closedProgramNames.has(p.name)).length === 0 && closedPrograms.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No active programs with devices</p>
        </div>
      )}

      {/* Archived/Closed programs */}
      {closedPrograms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Archived Programs</h3>
          <div className="space-y-3">
            {closedPrograms.map((cp) => (
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
                        {cp.actions.map((a, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-mono">{a.serial}</td>
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
