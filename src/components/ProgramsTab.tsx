'use client';

import { useState, useMemo } from 'react';
import { Button, Select, Tag, Card, Modal } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { Device, Program } from '@/types';
import DeviceDetailPanel from './DeviceDetailPanel';
import BulkReturnPanel from './BulkReturnPanel';
import { useAuthStore } from '@/store/authStore';
import { downloadCSV, todayStamp } from '@/constants';

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

// Map a DeviceAction to a WDS Tag color for inline action badges
const ACTION_TAG_COLOR: Record<DeviceAction, 'red' | 'orange' | 'grey'> = {
  brick_and_return: 'red',
  return: 'orange',
  archive: 'grey',
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
3. Drop off at any UPS or FedEx location

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
        <h2 className="text-xl font-bold text-[var(--ui-text-text-primary)]">✓ Program Closed Successfully</h2>
        <p className="text-sm text-[var(--ui-text-text-tertiary)]">{PROGRAM_LABELS[selectedProgram!] || 'Program'} — {processResults.totalProcessed} devices processed</p>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card size={3}>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--ui-text-text-primary)]">{processResults.totalProcessed}</p>
              <p className="text-xs text-[var(--ui-text-text-tertiary)]">Total Processed</p>
            </div>
          </Card>
          <div className="bg-[var(--ui-support-fill-support-error)] rounded-xl border border-[var(--ui-support-border-support-error)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--ui-support-text-support-error)]">{processResults.devicesBricked.length}</p>
            <p className="text-xs text-[var(--ui-core-red-red-6)]">Devices Bricked</p>
          </div>
          <div className="bg-[var(--ui-support-fill-support-info)] rounded-xl border border-[var(--ui-support-border-support-info)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--ui-support-text-icon-support-info)]">{processResults.emailsSent.length}</p>
            <p className="text-xs text-[var(--ui-core-periwinkle-periwinkle-6)]">Emails Sent</p>
          </div>
          <Card size={3}>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--ui-text-text-secondary)]">{processResults.devicesArchived}</p>
              <p className="text-xs text-[var(--ui-text-text-tertiary)]">Archived</p>
            </div>
          </Card>
        </div>

        {/* Bricked devices confirmation */}
        {processResults.devicesBricked.length > 0 && (
          <div className="bg-[var(--ui-support-fill-support-error)] rounded-xl border border-[var(--ui-support-border-support-error)] p-5">
            <h3 className="text-sm font-semibold text-[var(--ui-support-text-support-error)] mb-3">⚠️ Devices Bricked via Partner API ({processResults.devicesBricked.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {processResults.devicesBricked.map((serial) => (
                <div key={serial} className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--ui-core-red-red-6)]">●</span>
                  <span className="font-mono">{serial}</span>
                  <span className="text-[var(--ui-core-red-red-6)] font-medium">Bricked</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emails sent confirmation */}
        {processResults.emailsSent.length > 0 && (
          <div className="bg-[var(--ui-support-fill-support-info)] rounded-xl border border-[var(--ui-support-border-support-info)] p-5">
            <h3 className="text-sm font-semibold text-[var(--ui-support-text-icon-support-info)] mb-3">📧 Return Emails Sent ({processResults.emailsSent.length} testers)</h3>
            <div className="space-y-2">
              {processResults.emailsSent.map(({ email, deviceCount }) => (
                <div key={email} className="flex items-center justify-between text-sm p-2 bg-[var(--ui-support-fill-support-info)] rounded-lg">
                  <span className="text-[var(--ui-text-text-secondary)]">{email}</span>
                  <span className="text-xs text-[var(--ui-core-periwinkle-periwinkle-6)] font-medium">{deviceCount} device(s) · Email sent ✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <Button
          type="primary"
          label="Back to Programs"
          onClick={() => { setProcessResults(null); setSelectedProgram(null); }}
        />
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
              className="text-sm text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] cursor-pointer font-medium mb-1"
              onClick={() => { setClosingProgram(false); setSelectedProgram(null); }}
            >
              ← Back to programs
            </p>
            <h2 className="text-xl font-bold text-[var(--ui-text-text-primary)]">Close Program: {PROGRAM_LABELS[selectedProgram]}</h2>
            <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">Decide what happens to each device in this program</p>
          </div>
        </div>

        {/* Already Processed — persistent record */}
        {(() => {
          const programRecord = getClosedPrograms().find((cp) => cp.program === selectedProgram);
          if (!programRecord || programRecord.actions.length === 0) return null;
          const processed = programRecord.actions;
          return (
            <div className="bg-[var(--ui-support-fill-support-success)] border border-[var(--ui-support-border-support-success)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[var(--ui-support-text-support-success)]">✓ Devices Already Processed</h3>
                <span className="text-xs text-[var(--ui-core-green-green-6)] font-medium">{processed.length} device(s) done</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--ui-support-text-support-success)] mb-2">
                <span>{processed.filter((d) => d.action === 'brick_and_return').length} bricked</span>
                <span>{processed.filter((d) => d.action === 'return').length} returned</span>
                <span>{processed.filter((d) => d.action === 'archive').length} archived</span>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-[var(--ui-support-text-support-success)] font-medium hover:text-[var(--ui-core-green-green-6)]">View processed devices</summary>
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {processed.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-[var(--ui-background-layer-layer-page)] rounded">
                      <span className="font-mono">{d.serial}</span>
                      <span className="text-[var(--ui-text-text-tertiary)]">{d.assignee} · {d.region}</span>
                      <Tag color={ACTION_TAG_COLOR[d.action as DeviceAction]} size="regular">{d.action.replace(/_/g, ' ')}</Tag>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          );
        })()}

        {/* Program-wide actions — admin only */}
        {canEdit() && (
        <Card size={3}>
          <h3 className="text-sm font-semibold text-[var(--ui-text-text-primary)] mb-1">Program-Wide Actions</h3>
          <p className="text-xs text-[var(--ui-text-text-tertiary)] mb-4">
            Use these buttons to apply the same action to <strong>every device</strong> in this program across all regions. If you need different actions per region, skip this and use the per-region buttons below instead.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="primary"
              danger
              label="Brick & Return All Devices"
              onClick={() => { handleSetAllActions('brick_and_return'); setBulkReturnDevices(selectedDevices); }}
            />
            <Button
              type="default"
              label="Archive All Devices"
              onClick={() => { handleSetAllActions('archive'); setBulkReturnDevices(selectedDevices); }}
            />
            <Button
              type="primary"
              label="Return All Devices"
              onClick={() => { handleSetAllActions('return'); setBulkReturnDevices(selectedDevices); }}
            />
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--ui-background-layer-border-border-layer-page)]">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[var(--ui-support-text-support-error)] font-medium">{actionCounts.return} return</span>
              <span className="text-[var(--ui-support-text-support-error)] font-medium">{actionCounts.brick_and_return} brick & return</span>
              <span className="text-[var(--ui-text-text-tertiary)] font-medium">{actionCounts.archive} archive</span>
              {Object.keys(deviceActions).length === 0 && <span className="text-[var(--ui-core-orange-orange-6)] font-medium">No actions selected yet</span>}
            </div>
            <div className="ml-auto">
              <Button
                type="primary"
                label="Preview Changes →"
                onClick={() => setShowPreview(true)}
                disabled={processing || Object.keys(deviceActions).length === 0}
              />
            </div>
          </div>
        </Card>
        )}

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
            downloadCSV(`close-program-preview-${selectedProgram}-${todayStamp()}.csv`, rows);
          };

          return (
            <Modal
              isOpen
              title={`Preview: Close Program ${PROGRAM_LABELS[selectedProgram]}`}
              onCancel={() => setShowPreview(false)}
              hideFooter
            >
              <div className="flex items-center justify-end mb-1">
                <Button
                  type="link"
                  label="Export Preview (CSV)"
                  onClick={exportPreviewCSV}
                />
              </div>
              <p className="text-sm text-[var(--ui-text-text-tertiary)] mb-1">Review exactly what will happen before executing. Nothing has been changed yet.</p>
              <p className="text-xs text-[var(--ui-text-text-placeholder)] mb-6">Preview generated: {previewTime}</p>

              {/* Brick & Return section */}
              {brickDevices.length > 0 && (
                <div className="mb-5 p-4 bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-lg">
                  <h3 className="text-sm font-semibold text-[var(--ui-support-text-support-error)] mb-2">🚨 BRICK & RETURN — {brickDevices.length} device(s)</h3>
                  <p className="text-xs text-[var(--ui-core-red-red-6)] mb-3">These devices will be permanently deactivated via the Partner API. They will never connect to a network again. Return emails will be sent.</p>
                  {Object.entries(brickByRegion).map(([region, devices]) => (
                    <div key={region} className="mb-2">
                      <p className="text-xs font-medium text-[var(--ui-support-text-support-error)]">📍 {region} ({devices.length})</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {devices.map((d) => <span key={d.id} className="text-xs font-mono bg-[var(--ui-support-fill-support-error)] text-[var(--ui-support-text-support-error)] px-1.5 py-0.5 rounded">{d.serialNumber}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Return section */}
              {returnDevices.length > 0 && (
                <div className="mb-5 p-4 bg-[var(--ui-support-fill-support-warning)] border border-[var(--ui-support-border-support-warning)] rounded-lg">
                  <h3 className="text-sm font-semibold text-[var(--ui-support-text-icon-support-warning)] mb-2">📦 RETURN TO EERO — {returnDevices.length} device(s)</h3>
                  <p className="text-xs text-[var(--ui-core-orange-orange-6)] mb-3">These devices will be marked as "Pending Return." Return emails will be sent. Devices stay active until you confirm receipt.</p>
                  {Object.entries(returnByRegion).map(([region, devices]) => (
                    <div key={region} className="mb-2">
                      <p className="text-xs font-medium text-[var(--ui-support-text-icon-support-warning)]">📍 {region} ({devices.length})</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {devices.map((d) => <span key={d.id} className="text-xs font-mono bg-[var(--ui-support-fill-support-warning)] text-[var(--ui-support-text-icon-support-warning)] px-1.5 py-0.5 rounded">{d.serialNumber}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Archive section */}
              {archiveDevices.length > 0 && (
                <div className="mb-5 p-4 bg-[var(--ui-background-layer-layer-page-hover)] border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg">
                  <h3 className="text-sm font-semibold text-[var(--ui-text-text-secondary)] mb-2">📁 ARCHIVE — {archiveDevices.length} device(s)</h3>
                  <p className="text-xs text-[var(--ui-text-text-tertiary)] mb-3">These devices will be marked as deactivated. Data is preserved. No emails sent.</p>
                  {Object.entries(archiveByRegion).map(([region, devices]) => (
                    <div key={region} className="mb-2">
                      <p className="text-xs font-medium text-[var(--ui-text-text-tertiary)]">📍 {region} ({devices.length})</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {devices.map((d) => <span key={d.id} className="text-xs font-mono bg-[var(--ui-background-layer-layer-page-hover)] text-[var(--ui-text-text-tertiary)] px-1.5 py-0.5 rounded">{d.serialNumber}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] rounded-lg mb-6">
                <h3 className="text-sm font-semibold text-[var(--ui-support-text-icon-support-info)] mb-2">Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-[var(--ui-support-text-support-error)]">{brickDevices.length}</p>
                    <p className="text-xs text-[var(--ui-text-text-tertiary)]">Bricked</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[var(--ui-core-orange-orange-6)]">{returnDevices.length}</p>
                    <p className="text-xs text-[var(--ui-text-text-tertiary)]">Pending Return</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[var(--ui-text-text-tertiary)]">{archiveDevices.length}</p>
                    <p className="text-xs text-[var(--ui-text-text-tertiary)]">Archived</p>
                  </div>
                </div>
              </div>

              {/* Batch processing option for bricking */}
              {brickDevices.length > 10 && (
                <div className="p-4 bg-[var(--ui-support-fill-support-warning)] border border-[var(--ui-support-border-support-warning)] rounded-lg mb-6">
                  <h3 className="text-xs font-semibold text-[var(--ui-support-text-icon-support-warning)] mb-1">⚡ Large batch detected — consider processing in stages</h3>
                  <p className="text-xs text-[var(--ui-support-text-icon-support-warning)] mb-3">You're about to brick {brickDevices.length} devices. We recommend processing by region using the per-region buttons instead, so you can verify each batch before continuing.</p>
                  <Button
                    type="default"
                    label="← Go back and process by region instead"
                    onClick={() => setShowPreview(false)}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  type="default"
                  label="← Go Back & Edit"
                  onClick={() => setShowPreview(false)}
                />
                <Button
                  type="primary"
                  danger={brickDevices.length > 0}
                  label={processing ? 'Processing...' : `Confirm & Execute (${selectedDevices.length} devices)`}
                  onClick={() => { setShowPreview(false); handleProcessClose(); }}
                  disabled={processing}
                />
              </div>
            </Modal>
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
                <div className="bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--ui-core-red-red-6)]">⚠️</span>
                    <span className="text-sm font-semibold text-[var(--ui-support-text-support-error)]">{missingRegion.length} device(s) missing region/country data</span>
                  </div>
                  <p className="text-xs text-[var(--ui-support-text-support-error)] mb-2">These devices have no country assigned. Update them in the device detail or re-import with the Country column filled in.</p>
                  <div className="flex flex-wrap gap-2">
                    {missingRegion.map((d) => (
                      <span key={d.id} className="text-xs font-mono bg-[var(--ui-support-fill-support-error)] text-[var(--ui-support-text-support-error)] px-2 py-0.5 rounded">
                        {d.serialNumber} ({d.assignedTo || d.assignedEmail || 'unassigned'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {regions.map((region) => (
                <div key={region} className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--ui-background-layer-layer-page-hover)] border-b border-[var(--ui-background-layer-border-border-layer-page)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--ui-text-text-secondary)]">📍 {region}</span>
                      <span className="text-xs text-[var(--ui-text-text-placeholder)]">{grouped[region].length} device(s)</span>
                    </div>
                    {canEdit() && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--ui-text-text-tertiary)]">Set region to:</span>
                      <Button
                        type="default"
                        danger
                        label="Brick & Return"
                        onClick={() => {
                          const updated = { ...deviceActions };
                          grouped[region].forEach((d) => { updated[d.id] = 'brick_and_return'; });
                          setDeviceActions(updated);
                        }}
                      />
                      <Button
                        type="default"
                        label="Archive"
                        onClick={() => {
                          const updated = { ...deviceActions };
                          grouped[region].forEach((d) => { updated[d.id] = 'archive'; });
                          setDeviceActions(updated);
                        }}
                      />
                    </div>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--ui-background-layer-border-border-layer-page)]">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Serial</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Assigned To</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
                      {grouped[region].map((device) => (
                        <tr key={device.id} className="hover:bg-[var(--ui-background-layer-layer-page-hover)]">
                          <td className="px-4 py-2.5 font-mono text-xs">
                            <button
                              onClick={() => setDetailDevice(device)}
                              className="text-[var(--ui-core-periwinkle-periwinkle-6)] font-medium hover:underline cursor-pointer"
                            >
                              {device.serialNumber}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-[var(--ui-text-text-tertiary)]">{device.assignedTo || device.assignedEmail || '—'}</td>
                          <td className="px-4 py-2.5">
                            <Tag color={device.status === 'online' ? 'green' : 'orange'} size="regular">
                              {device.status.replace(/_/g, ' ')}
                            </Tag>
                          </td>
                          <td className="px-4 py-2.5">
                            {canEdit() ? (
                            <div className="w-40">
                              <Select
                                id={`device-action-${device.id}`}
                                value={deviceActions[device.id] || undefined}
                                placeholder="Select action..."
                                state={deviceActions[device.id] ? 'default' : 'warning'}
                                onChange={(val) => setDeviceActions({ ...deviceActions, [device.id]: val as DeviceAction })}
                                options={[
                                  { value: 'return', label: 'Return to eero' },
                                  { value: 'brick_and_return', label: 'Brick & Return' },
                                  { value: 'archive', label: 'Archive' },
                                ]}
                              />
                            </div>
                            ) : (
                              <span className="text-xs text-[var(--ui-text-text-placeholder)]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Per-region process button — admin only */}
                  {canEdit() && (
                    <div className="px-4 py-3 bg-[var(--ui-background-layer-layer-page-hover)] border-t border-[var(--ui-background-layer-border-border-layer-page)] flex items-center justify-between">
                      <div className="text-xs text-[var(--ui-text-text-tertiary)]">
                        {grouped[region].filter((d) => deviceActions[d.id] === 'brick_and_return').length} brick & return · {grouped[region].filter((d) => deviceActions[d.id] === 'return').length} return · {grouped[region].filter((d) => deviceActions[d.id] === 'archive').length} archive · {grouped[region].filter((d) => !deviceActions[d.id]).length} unset
                      </div>
                      <Button
                        type="primary"
                        label={`Process ${region} (${grouped[region].length} devices) →`}
                        onClick={() => setBulkReturnDevices(grouped[region])}
                      />
                    </div>
                  )}
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
        <h2 className="text-lg font-bold text-[var(--ui-text-text-primary)]">Programs</h2>
      </div>

      {/* Active program cards — includes programs with partial processing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.filter((p) => !fullyArchivedPrograms.has(p.name)).map((prog) => {
          const programRecord = closedPrograms.find((cp) => cp.program === prog.name);
          const processedCount = programRecord?.actions.length || 0;
          const hasProgress = processedCount > 0;

          return (
          <Card key={prog.name} size={3}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--ui-text-text-primary)]">{prog.label}</h3>
              {hasProgress ? (
                <Tag color="orange" size="regular">In Progress</Tag>
              ) : (
                <Tag color="green" size="regular">Active</Tag>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--ui-text-text-primary)]">{prog.deviceCount}</p>
                <p className="text-xs text-[var(--ui-text-text-tertiary)]">Total Devices</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--ui-core-green-green-6)]">{prog.onlineCount}</p>
                <p className="text-xs text-[var(--ui-text-text-tertiary)]">Online Devices</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--ui-core-orange-orange-6)]">{prog.offlineCount}</p>
                <p className="text-xs text-[var(--ui-text-text-tertiary)]">Offline Devices</p>
              </div>
            </div>

            {/* Progress indicator when partially processed */}
            {hasProgress && (
              <div className="mb-3 p-2 bg-[var(--ui-background-layer-layer-page-hover)] rounded-lg">
                <div className="flex items-center gap-3 text-xs text-[var(--ui-text-text-tertiary)]">
                  <span className="font-medium">{processedCount} processed</span>
                  <span>{programRecord!.actions.filter((a) => a.action === 'brick_and_return').length} bricked</span>
                  <span>{programRecord!.actions.filter((a) => a.action === 'archive').length} archived</span>
                  <span>{programRecord!.actions.filter((a) => a.action === 'return').length} returned</span>
                </div>
              </div>
            )}

            {prog.deactivatedCount > 0 && !hasProgress && (
              <p className="text-xs text-[var(--ui-text-text-placeholder)] mb-3">{prog.deactivatedCount} deactivated</p>
            )}

            <Button
              type="default"
              fullWidth
              label={canEdit() ? (hasProgress ? 'Continue Processing →' : 'Close Program →') : 'View Program Details →'}
              onClick={() => handleStartClose(prog.name)}
            />
          </Card>
          );
        })}
      </div>

      {programs.filter((p) => !fullyArchivedPrograms.has(p.name)).length === 0 && closedPrograms.length === 0 && (
        <Card size={3}>
          <div className="p-12 text-center">
            <p className="text-[var(--ui-text-text-placeholder)] text-sm">No active programs with devices</p>
          </div>
        </Card>
      )}

      {/* Archived/Closed programs */}
      {/* Archived/Closed programs — only fully processed ones */}
      {closedPrograms.filter((cp) => fullyArchivedPrograms.has(cp.program)).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider mb-3">Archived Programs</h3>
          <div className="space-y-3">
            {closedPrograms.filter((cp) => fullyArchivedPrograms.has(cp.program)).map((cp) => (
              <Card key={cp.id} size={3}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-semibold text-[var(--ui-text-text-primary)]">{PROGRAM_LABELS[cp.program as Program] || cp.program}</h4>
                    <Tag color="grey" size="regular">Archived</Tag>
                  </div>
                  <span className="text-xs text-[var(--ui-text-text-placeholder)]">Closed {new Date(cp.closedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--ui-text-text-tertiary)] mb-3">
                  <span>Closed by {cp.closedBy}</span>
                  <span>·</span>
                  <span>{cp.totalDevices} devices processed</span>
                  <span>{cp.actions.filter((a) => a.action === 'brick_and_return').length} bricked</span>
                  <span>{cp.actions.filter((a) => a.action === 'archive').length} archived</span>
                  <span>{cp.actions.filter((a) => a.action === 'return').length} returned</span>
                </div>

                {/* Expandable device list */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] font-medium">
                    View {cp.actions.length} devices
                  </summary>
                  <div className="mt-2 max-h-48 overflow-y-auto border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg">
                    <table className="w-full">
                      <thead className="bg-[var(--ui-background-layer-layer-page-hover)] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-text-tertiary)]">Serial</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-text-tertiary)]">Assignee</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-text-tertiary)]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
                        {cp.actions.map((a, i) => {
                          const device = devices.find((d) => d.serialNumber === a.serial);
                          return (
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-mono">
                              {device ? (
                                <button
                                  onClick={() => setDetailDevice(device)}
                                  className="text-[var(--ui-core-periwinkle-periwinkle-6)] font-medium hover:underline cursor-pointer"
                                >
                                  {a.serial}
                                </button>
                              ) : (
                                <span>{a.serial}</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-[var(--ui-text-text-tertiary)]">{a.assignee}</td>
                            <td className="px-3 py-1.5">
                              <Tag color={ACTION_TAG_COLOR[a.action as DeviceAction]} size="regular">
                                {a.action.replace(/_/g, ' ')}
                              </Tag>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              </Card>
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
