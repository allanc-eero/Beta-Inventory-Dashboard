'use client';

import { useState, useEffect, useMemo } from 'react';
import { Device } from '@/types';
import { useDeviceStore } from '@/store/deviceStore';

interface BulkReturnPanelProps {
  devices: Device[];
  onClose: () => void;
}

export default function BulkReturnPanel({ devices, onClose }: BulkReturnPanelProps) {
  const { updateDevice, addHistoryEntry, createJiraTicket } = useDeviceStore();
  const [reason, setReason] = useState<'returned_to_eero' | 'defective' | 'end_of_program' | 'lost'>('returned_to_eero');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [brickDevices, setBrickDevices] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const requiresReturn = reason === 'defective' || reason === 'end_of_program';
  const willBrick = reason === 'lost' || (reason === 'end_of_program' && brickDevices);

  // Group devices by assignee for email/label generation
  const groupedByAssignee = useMemo(() => {
    const groups: Record<string, Device[]> = {};
    devices.forEach((d) => {
      const key = d.assignedEmail || d.assignedTo || 'unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [devices]);

  const assigneeCount = Object.keys(groupedByAssignee).length;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async () => {
    setProcessing(true);

    // Get program for epic mapping
    const program = devices[0]?.program || 'beta';
    const epicMap: Record<string, string> = {
      beta: 'BETA-RETURNS', dogfood: 'DOGFOOD-RETURNS', prq: 'PRQ-RETURNS',
      pvt: 'PVT-RETURNS', evt: 'EVT-RETURNS', dvt: 'DVT-RETURNS', other: 'GENERAL-RETURNS',
    };
    const epic = epicMap[program] || 'GENERAL-RETURNS';
    const ticketKey = `QA-${Math.floor(Math.random() * 90000) + 10000}`;

    // Process each device (deactivate without individual JIRA tickets)
    devices.forEach((device) => {
      updateDevice(device.id, { status: 'deactivated' as any, deactivated: true });
      addHistoryEntry({
        id: crypto.randomUUID(),
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        action: 'deactivated',
        user: 'Admin',
        description: `Bulk return — reason: ${reason.replace(/_/g, ' ')}${willBrick ? ' (bricked via API)' : ''}. Consolidated JIRA: ${ticketKey}. ${notes}`,
      });

      // If bricking, log the API call
      if (willBrick) {
        addHistoryEntry({
          id: crypto.randomUUID(),
          deviceId: device.id,
          timestamp: new Date().toISOString(),
          action: 'bricked',
          user: 'Admin',
          description: `Device remotely bricked via Partner API (POST /2.2/eeros/:id/activation_state — active: false)`,
        });
      }
    });

    // Create ONE consolidated JIRA ticket for the entire batch
    const serialList = devices.map((d) => d.serialNumber).join(', ');
    const assigneeList = [...new Set(devices.map((d) => d.assignedEmail || d.assignedTo).filter(Boolean))].join(', ');
    createJiraTicket({
      id: crypto.randomUUID(),
      key: ticketKey,
      deviceId: devices[0].id, // Link to first device (ticket covers all)
      type: 'device_issue',
      status: 'open',
      summary: `[${epic}] Bulk return: ${devices.length} device(s) — ${reason.replace(/_/g, ' ')}`,
      createdAt: new Date().toISOString(),
      linkedFirmware: devices[0]?.firmwareVersion,
    });

    // Log the consolidated JIRA to each device's timeline
    devices.forEach((device) => {
      addHistoryEntry({
        id: crypto.randomUUID(),
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        action: 'jira_created',
        user: 'Admin',
        description: `Consolidated JIRA ${ticketKey} created in epic ${epic} — ${devices.length} devices in batch (${reason.replace(/_/g, ' ')})`,
      });
    });

    // Generate grouped emails and labels for return reasons
    if (requiresReturn) {
      Object.entries(groupedByAssignee).forEach(([email, assigneeDevices]) => {
        if (email === 'unassigned') return;

        // Open one email per tester with all their devices listed
        const testerName = assigneeDevices[0].assignedTo || assigneeDevices[0].checkedOutTo || 'Team Member';
        const serialList = assigneeDevices.map((d) => d.serialNumber).join(', ');
        const reasonText = reason === 'defective' ? 'a hardware defect' : 'end of program phase';

        const subject = encodeURIComponent(`[Action Required] Return ${assigneeDevices.length} eero device(s)`);
        const body = encodeURIComponent(
`Hi ${testerName},

We need you to return ${assigneeDevices.length} eero device(s) due to ${reasonText}.

Devices to return:
${assigneeDevices.map((d) => `- ${d.serialNumber} (${d.model})`).join('\n')}

Please follow these steps:
1. Disconnect all devices from power and your network
2. Pack them securely (together is fine if they fit)
3. Print the attached return shipping label and attach it to the outside of the package
4. Drop off at any UPS or FedEx location, or schedule a pickup

Please return within 7 business days.

If you have any questions, please reply to this email.

Thank you,
Device Management Team`
        );

        // Open email (only for first tester to avoid popup blocking)
        if (email === Object.keys(groupedByAssignee)[0]) {
          window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
        }

        // Generate shipping label for this tester
        const labelWindow = window.open('', '_blank', 'width=500,height=400');
        if (labelWindow) {
          labelWindow.document.write(`
            <html>
              <head>
                <title>Return Label — ${testerName}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 24px; }
                  .label { border: 3px solid #000; padding: 24px; max-width: 450px; margin: 0 auto; }
                  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
                  .header h1 { font-size: 18px; margin: 0; }
                  .section { margin-bottom: 16px; }
                  .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 4px; }
                  .section-content { font-size: 13px; font-weight: bold; }
                  .serial { font-family: monospace; font-size: 12px; margin: 2px 0; }
                  @media print { body { padding: 0; } }
                </style>
              </head>
              <body>
                <div class="label">
                  <div class="header">
                    <h1>RETURN SHIPPING LABEL</h1>
                    <p style="font-size:11px;color:#666;">eero Device Return Program</p>
                  </div>
                  <div class="section">
                    <div class="section-title">Ship To</div>
                    <div class="section-content">eero Returns Center<br/>1 eero Way<br/>San Francisco, CA 94105</div>
                  </div>
                  <div class="section">
                    <div class="section-title">From</div>
                    <div class="section-content">${testerName}</div>
                    <div style="font-size:12px;color:#444;">${email}</div>
                  </div>
                  <div class="section">
                    <div class="section-title">Devices (${assigneeDevices.length})</div>
                    ${assigneeDevices.map((d) => `<div class="serial">${d.serialNumber}</div>`).join('')}
                  </div>
                  <div class="section">
                    <div class="section-title">Reason</div>
                    <div class="section-content">${reason.replace(/_/g, ' ')}</div>
                  </div>
                  <div style="font-size:10px;color:#666;margin-top:16px;padding-top:12px;border-top:1px solid #ddd;">
                    <strong>Instructions:</strong> Pack all devices securely. Include cables and accessories. Attach this label to the outside.
                  </div>
                </div>
                <script>window.onload = function() { window.print(); }</script>
              </body>
            </html>
          `);
          labelWindow.document.close();
        }
      });
    }

    setProcessing(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="fixed inset-0 top-12 z-40 bg-gray-50 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-4">✓</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Bulk Return Complete</h2>
            <p className="text-sm text-gray-500 mb-6">
              {devices.length} device(s) processed. JIRA tickets created. {requiresReturn ? `${assigneeCount} return email(s) and label(s) generated.` : ''}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Back to Devices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-12 z-40 bg-gray-50 overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Back link */}
        <p
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium mb-2"
          onClick={onClose}
        >
          ← Back to devices
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Bulk Return to eero</h1>
        <p className="text-sm text-gray-500 mb-8">
          Process {devices.length} device(s) for return. Emails and labels will be grouped by tester.
        </p>

        {/* Devices summary table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Devices Being Returned ({devices.length})
          </h3>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Serial</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Model</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Assigned To</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Status</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Program</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-mono text-xs">{d.serialNumber}</td>
                    <td className="px-3 py-2 text-gray-600">{d.model}</td>
                    <td className="px-3 py-2 text-gray-600">{d.assignedTo || d.assignedEmail || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{d.program}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return details form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">Return Details</h3>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (applies to all)</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as typeof reason)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="returned_to_eero">Returned to eero</option>
                  <option value="defective">Defective / Hardware issue</option>
                  <option value="end_of_program">End of program phase</option>
                  <option value="lost">Lost / Unrecoverable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testers affected</label>
                <input
                  type="text"
                  readOnly
                  value={`${assigneeCount} tester(s) — ${Object.keys(groupedByAssignee).filter((k) => k !== 'unassigned').join(', ') || 'none assigned'}`}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
                />
              </div>
            </div>
            {/* Brick option for end of program */}
            {reason === 'end_of_program' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={brickDevices}
                    onChange={(e) => setBrickDevices(e.target.checked)}
                    className="rounded border-orange-300 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-orange-800">Also brick these devices</span>
                    <p className="text-xs text-orange-600 mt-0.5">Remotely deactivate all devices via the Partner API so they can never connect to a network again. Use this when devices should not be reused.</p>
                  </div>
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (applies to all)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                placeholder="Reason for bulk return..."
              />
            </div>
          </div>
        </div>

        {/* What will happen */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">What will happen</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700"><span className="font-medium">{devices.length}</span> device(s) will be marked as deactivated</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700"><span className="font-medium">1</span> consolidated JIRA ticket created covering all {devices.length} device(s)</p>
            </div>
            {requiresReturn && (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-sm text-gray-700"><span className="font-medium">{assigneeCount}</span> return email(s) drafted (grouped by tester — one email per person)</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-sm text-gray-700"><span className="font-medium">{assigneeCount}</span> shipping label(s) generated (one per tester, listing all their devices)</p>
                </div>
              </>
            )}
            {reason === 'lost' && (
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <p className="text-sm text-red-700 font-medium">{devices.length} device(s) will be remotely bricked — they will never connect to a network again</p>
              </div>
            )}
            {reason === 'end_of_program' && brickDevices && (
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <p className="text-sm text-red-700 font-medium">{devices.length} device(s) will be remotely bricked via the Partner API — they will never connect to a network again</p>
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700">All actions logged to each device's audit trail</p>
            </div>
          </div>
        </div>

        {/* Brick confirmation — for lost OR end-of-program with brick enabled */}
        {willBrick && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="rounded border-red-300 mt-0.5"
              />
              <span className="text-sm text-red-700">
                {reason === 'lost'
                  ? `I confirm these ${devices.length} device(s) are lost or unrecoverable and should be permanently bricked. This action cannot be undone.`
                  : `I confirm these ${devices.length} device(s) should be permanently bricked as part of the end-of-program process. They will never connect to a network again. This action cannot be undone.`
                }
              </span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pb-12">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || (willBrick && !confirmed)}
            className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              willBrick ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {processing ? 'Processing...' : willBrick ? `Brick & Deactivate ${devices.length} Device(s)` : `Submit (${devices.length} devices)`}
          </button>
        </div>
      </div>
    </div>
  );
}
