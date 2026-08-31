'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Select, Checkbox, Tag, Modal } from '@amzn/eero-web-design-components';
import { Device, DeviceStatus } from '@/types';
import { useDeviceStore } from '@/store/deviceStore';
import { usePackagesStore } from '@/store/packagesStore';
import JiraToast from './JiraToast';
import { isDomesticCountry, getReturnEpic, downloadCSV, todayStamp } from '@/constants';

interface BulkReturnPanelProps {
  devices: Device[];
  onClose: () => void;
}

export default function BulkReturnPanel({ devices, onClose }: BulkReturnPanelProps) {
  const { updateDevice, addHistoryEntry, createJiraTicket } = useDeviceStore();
  const { addServiceOrder } = usePackagesStore();
  const [reason, setReason] = useState<'returned_to_eero' | 'defective' | 'end_of_program' | 'lost'>('returned_to_eero');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [brickDevices, setBrickDevices] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [jiraToast, setJiraToast] = useState<{ ticketKey: string; summary: string; epicKey: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState('[Action Required] Return {count} eero device(s)');
  const [emailBody, setEmailBody] = useState(`Hi {name},

We need you to return {count} eero device(s).

Devices to return:
{devices}

Please follow these steps:
1. Disconnect all devices from power and your network
2. Pack them securely
3. Drop off at any Parcel Transportation location

It is very important you return the prototype before {deadline}. If you are unable to accommodate the return by this date, please let us know immediately.

If you have any questions, please reply to this email.

Thank you,
Beta Team`);

  const INTERNATIONAL_TEMPLATE = `Hi {name},

We need you to return {count} eero device(s).

Devices to return:
{devices}

Please follow these steps:

1. Remove devices from the network then disconnect from power
2. Pack them securely
3. Check device tracker for more instructions:

   A.) Go to this link: https://termination-returns-emea.re-teck.com/recycling/home
   B.) After you click "Get Started" you will navigate the page to find "Eero/Wifi Router" and enter the number of eero units you are returning
   C.) Then select "Continue"
   D.) You will complete the next form with:
       - The DSN information of the eero devices you are returning (The serial number)
       - Your shipping information
       - Amazon Alias
   E.) Then select "end of Beta program/Recall" for why you are returning
   F.) Then, check the 2 boxes and select "Continue"

It is very important you return the prototype before {deadline}. If you are unable to accommodate the return by this date, please let us know immediately.

If you have questions about the return of your hardware, please do not hesitate to reach out via Slack or to beta-team@eero.com.

Thank you,
Beta Team`;
  const [perTesterEmails, setPerTesterEmails] = useState<Record<string, string>>({});
  const [perTesterSubjects, setPerTesterSubjects] = useState<Record<string, string>>({});

  const requiresReturn = reason === 'defective' || reason === 'end_of_program';
  const willBrick = reason === 'lost' || (reason === 'end_of_program' && brickDevices);

  // Group devices by assignee for email/label generation (deduplicated by serial)
  const groupedByAssignee = useMemo(() => {
    // Deduplicate devices by serial number first
    const seen = new Set<string>();
    const uniqueDevices = devices.filter((d) => {
      if (seen.has(d.serialNumber)) return false;
      seen.add(d.serialNumber);
      return true;
    });

    const groups: Record<string, Device[]> = {};
    uniqueDevices.forEach((d) => {
      const key = d.assignedEmail || d.assignedTo || 'unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [devices]);

  const assigneeCount = Object.keys(groupedByAssignee).filter((k) => k !== 'unassigned').length;

  // Deduplicated device list for display and processing
  const uniqueDevices = useMemo(() => {
    const seen = new Set<string>();
    return devices.filter((d) => {
      if (seen.has(d.serialNumber)) return false;
      seen.add(d.serialNumber);
      return true;
    });
  }, [devices]);

  // Initialize per-tester emails — auto-select template based on tester's country
  useEffect(() => {
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const emails: Record<string, string> = {};
    Object.entries(groupedByAssignee).forEach(([email, assigneeDevices]) => {
      if (email === 'unassigned') return;
      const testerName = assigneeDevices[0].assignedTo || assigneeDevices[0].checkedOutTo || 'Team Member';
      const testerCountry = assigneeDevices[0].country || '';
      const template = isDomesticCountry(testerCountry) ? emailBody : INTERNATIONAL_TEMPLATE;
      const deviceList = assigneeDevices.map((d) => `- ${d.serialNumber} (${d.model || d.product || ''})`.trim()).join('\n');
      emails[email] = template
        .replace(/\{name\}/g, testerName)
        .replace(/\{devices\}/g, deviceList)
        .replace(/\{count\}/g, String(assigneeDevices.length))
        .replace(/\{deadline\}/g, deadline);
    });
    setPerTesterEmails(emails);
  }, [reason]); // Re-initialize when reason changes

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async () => {
    setProcessing(true);

    // Get program for epic mapping
    const program = uniqueDevices[0]?.program || 'beta';
    const epic = getReturnEpic(program);
    const ticketKey = `QA-${Math.floor(Math.random() * 90000) + 10000}`;

    // Process each device — mark as pending return (not deactivated until confirmed)
    uniqueDevices.forEach((device) => {
      const newStatus = willBrick ? 'deactivated' : 'pending_return';
      updateDevice(device.id, { status: newStatus as DeviceStatus, deactivated: willBrick });
      addHistoryEntry({
        id: crypto.randomUUID(),
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        action: willBrick ? 'deactivated' : 'return_requested',
        user: 'Admin',
        description: willBrick
          ? `Bulk return — reason: ${reason.replace(/_/g, ' ')} (bricked via API). Consolidated JIRA: ${ticketKey}. ${notes}`
          : `Return requested — reason: ${reason.replace(/_/g, ' ')}. Device marked as pending return. Consolidated JIRA: ${ticketKey}. ${notes}`,
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
    const serialList = uniqueDevices.map((d) => d.serialNumber).join(', ');
    const assigneeList = [...new Set(uniqueDevices.map((d) => d.assignedEmail || d.assignedTo).filter(Boolean))].join(', ');
    createJiraTicket({
      id: crypto.randomUUID(),
      key: ticketKey,
      deviceId: uniqueDevices[0].id, // Link to first device (ticket covers all)
      type: 'device_issue',
      status: 'open',
      summary: `[${epic}] Bulk return: ${uniqueDevices.length} device(s) — ${reason.replace(/_/g, ' ')}`,
      createdAt: new Date().toISOString(),
      linkedFirmware: uniqueDevices[0]?.firmwareVersion,
    });

    // Show JIRA toast for defective/hardware or end_of_program returns
    if (reason === 'defective' || reason === 'end_of_program') {
      setJiraToast({
        ticketKey,
        summary: `[${epic}] Bulk return: ${uniqueDevices.length} device(s) — ${reason.replace(/_/g, ' ')}`,
        epicKey: epic,
      });

      // Create ONE Service Order on the Kanban board for this return batch (maps 1:1 to the JIRA ticket)
      const now = new Date().toISOString();
      const soType = reason as any; // maps directly: 'returned_to_eero' | 'defective' | 'end_of_program' | 'lost'
      const serialSummary = uniqueDevices.length <= 3
        ? uniqueDevices.map((d) => d.serialNumber).join(', ')
        : `${uniqueDevices.slice(0, 3).map((d) => d.serialNumber).join(', ')} +${uniqueDevices.length - 3} more`;
      addServiceOrder({
        id: crypto.randomUUID(),
        title: `[${epic}] Return: ${uniqueDevices.length} device(s) — ${reason.replace(/_/g, ' ')}`,
        description: `Returning ${uniqueDevices.length} device(s). Reason: ${reason.replace(/_/g, ' ')}.\n\nSerials: ${uniqueDevices.map((d) => d.serialNumber).join(', ')}\n\nTesters: ${[...new Set(uniqueDevices.map((d) => d.assignedTo || d.assignedEmail).filter(Boolean))].join(', ')}\n\n${notes || ''}`,
        type: soType,
        priority: reason === 'defective' ? 'P1' : 'P2',
        status: 'intake',
        assignee: '',
        requester: 'System (return)',
        site: uniqueDevices[0]?.country || 'USA',
        deviceSerial: serialSummary,
        jiraKey: ticketKey,
        jiraUrl: `https://eeroinc.atlassian.net/browse/${ticketKey}`,
        epicKey: epic,
        columnEnteredAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Log the consolidated JIRA to each device's timeline
    uniqueDevices.forEach((device) => {
      addHistoryEntry({
        id: crypto.randomUUID(),
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        action: 'jira_created',
        user: 'Admin',
        description: `Consolidated JIRA ${ticketKey} created in epic ${epic} — ${uniqueDevices.length} devices in batch (${reason.replace(/_/g, ' ')})`,
      });
    });

    // Generate grouped emails and labels for return reasons
    if (requiresReturn) {
      Object.entries(groupedByAssignee).forEach(([email, assigneeDevices]) => {
        if (email === 'unassigned') return;

        // Use the per-tester editable email content
        const subject = encodeURIComponent(
          (perTesterSubjects[email] || emailSubject).replace(/\{count\}/g, String(assigneeDevices.length))
        );
        const bodyText = perTesterEmails[email] || '';
        const body = encodeURIComponent(bodyText);

        // Log the email to each device's timeline and update tracking fields
        assigneeDevices.forEach((device) => {
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId: device.id,
            timestamp: new Date().toISOString(),
            action: 'email_sent',
            user: 'Admin',
            description: `Return email sent to ${email}:\n\nSubject: ${(perTesterSubjects[email] || emailSubject).replace(/\{count\}/g, String(assigneeDevices.length))}\n\n${bodyText}`,
          });
          // Update email tracking fields on the device
          updateDevice(device.id, {
            returnEmailSentAt: new Date().toISOString(),
            returnEmailCount: (device.returnEmailCount || 0) + 1,
          });
        });

        // Open email (only for first tester to avoid popup blocking)
        if (email === Object.keys(groupedByAssignee)[0]) {
          window.open(`mailto:${email}?from=beta-team@eero.com&subject=${subject}&body=${body}`, '_self');
        }
      });
    }

    setProcessing(false);
    setDone(true);
  };

  if (done) {
    const exportBatchCSV = () => {
      const rows = [['Serial Number', 'Tester Name', 'Email', 'Action', 'Reason', 'Date']];
      uniqueDevices.forEach((d) => {
        rows.push([
          d.serialNumber,
          d.assignedTo || d.checkedOutTo || '',
          d.assignedEmail || '',
          willBrick ? 'Bricked & Deactivated' : 'Deactivated',
          reason.replace(/_/g, ' '),
          new Date().toLocaleDateString(),
        ]);
      });
      downloadCSV(`bulk-return-${todayStamp()}.csv`, rows);
    };

    return (
      <div className="fixed inset-0 top-12 z-40 bg-[var(--ui-background-layer-background-page)] overflow-y-auto">
        {/* JIRA Toast Notification */}
        {jiraToast && (
          <JiraToast
            ticketKey={jiraToast.ticketKey}
            summary={jiraToast.summary}
            epicKey={jiraToast.epicKey}
            onClose={() => setJiraToast(null)}
          />
        )}
        <div className="max-w-[900px] mx-auto px-6 py-8">
          <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-12 text-center">
            <p className="text-4xl mb-4">✓</p>
            <h2 className="text-xl font-bold text-[var(--ui-text-text-primary)] mb-2">Bulk Return Complete</h2>
            <p className="text-sm text-[var(--ui-text-text-tertiary)] mb-6">
              {uniqueDevices.length} device(s) processed. JIRA tickets created. {requiresReturn ? `${assigneeCount} return email(s) generated.` : ''}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                type="default"
                label="Export Batch Report (CSV)"
                onClick={exportBatchCSV}
              />
              <Button
                type="primary"
                label="Back to Devices"
                onClick={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-12 z-40 bg-[var(--ui-background-layer-background-page)] overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Back link */}
        <p
          className="text-sm text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] cursor-pointer font-medium mb-2"
          onClick={onClose}
        >
          ← Back to devices
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--ui-text-text-primary)] mb-1">Bulk Return to eero</h1>
        <p className="text-sm text-[var(--ui-text-text-tertiary)] mb-8">
          Process {uniqueDevices.length} device(s) for return. Emails will be grouped by tester.
        </p>

        {/* Devices summary table */}
        <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-5 mb-8">
          <h3 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider mb-3">
            Devices Being Returned ({uniqueDevices.length})
          </h3>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--ui-background-layer-layer-page-hover)]">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--ui-text-text-tertiary)]">Serial</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--ui-text-text-tertiary)]">Model</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--ui-text-text-tertiary)]">Assigned To</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--ui-text-text-tertiary)]">Status</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--ui-text-text-tertiary)]">Program</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
                {uniqueDevices.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-mono text-xs">{d.serialNumber}</td>
                    <td className="px-3 py-2 text-[var(--ui-text-text-tertiary)]">{d.model}</td>
                    <td className="px-3 py-2 text-[var(--ui-text-text-tertiary)]">{d.assignedTo || d.assignedEmail || '—'}</td>
                    <td className="px-3 py-2">
                      <Tag color={d.status === 'online' ? 'green' : 'orange'} size="regular">
                        {d.status.replace(/_/g, ' ')}
                      </Tag>
                    </td>
                    <td className="px-3 py-2">
                      <Tag color="periwinkle" size="regular">{d.program}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return details form */}
        <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-6 mb-8">
          <h3 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider mb-5">Return Details</h3>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--ui-text-text-secondary)] mb-1">Reason (applies to all)</label>
                <Select
                  id="bulk-return-reason"
                  value={reason}
                  onChange={(val) => setReason(val as typeof reason)}
                  options={[
                    { value: 'returned_to_eero', label: 'Returned to eero' },
                    { value: 'defective', label: 'Defective / Hardware issue' },
                    { value: 'end_of_program', label: 'End of program phase' },
                    { value: 'lost', label: 'Lost / Unrecoverable' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ui-text-text-secondary)] mb-1">Testers affected</label>
                <input
                  type="text"
                  readOnly
                  value={`${assigneeCount} tester(s) — ${Object.keys(groupedByAssignee).filter((k) => k !== 'unassigned').join(', ') || 'none assigned'}`}
                  className="w-full px-3 py-2.5 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg text-sm bg-[var(--ui-background-layer-layer-page-hover)] text-[var(--ui-text-text-tertiary)]"
                />
              </div>
            </div>
            {/* Brick option for end of program */}
            {reason === 'end_of_program' && (
              <div className="p-3 bg-[var(--ui-support-fill-support-warning)] border border-[var(--ui-support-border-support-warning)] rounded-lg">
                <Checkbox
                  checked={brickDevices}
                  onChange={(e: { target: { checked: boolean } }) => setBrickDevices(e.target.checked)}
                  label="Also brick these devices"
                />
                <p className="text-xs text-[var(--ui-core-orange-orange-6)] mt-0.5 ml-6">Remotely deactivate all devices via the Partner API so they can never connect to a network again. Use this when devices should not be reused.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--ui-text-text-secondary)] mb-1">Internal Notes <span className="font-normal text-[var(--ui-text-text-placeholder)]">(not sent to testers — for your team's records only)</span></label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ui-core-periwinkle-periwinkle-6)] resize-none h-20"
                placeholder="Internal reason for bulk return, context for the team..."
              />
            </div>
          </div>
        </div>

        {/* Email Template + Region-Grouped Emails */}
        {requiresReturn && Object.keys(groupedByAssignee).filter((k) => k !== 'unassigned').length > 0 && (
          <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-support-border-support-info)] p-6 mb-8">
            <h3 className="text-xs font-semibold text-[var(--ui-core-periwinkle-periwinkle-6)] uppercase tracking-wider mb-1">📧 Emails to Testers — Grouped by Region</h3>
            <p className="text-xs text-[var(--ui-text-text-tertiary)] mb-2">
              Emails are grouped by region since return instructions differ per country. Edit each region's template independently. Sent from: <strong>beta-team@eero.com</strong>
            </p>

            <div className="mb-4">
              <Button
                type="text"
                label="↻ Reset all emails from template"
                onClick={() => {
                  const reset: Record<string, string> = {};
                  Object.entries(groupedByAssignee).forEach(([email, assigneeDevices]) => {
                    if (email === 'unassigned') return;
                    const testerName = assigneeDevices[0].assignedTo || assigneeDevices[0].checkedOutTo || 'Team Member';
                    const deviceList = assigneeDevices.map((d) => `- ${d.serialNumber} (${d.model})`).join('\n');
                    reset[email] = emailBody
                      .replace(/\{name\}/g, testerName)
                      .replace(/\{devices\}/g, deviceList)
                      .replace(/\{count\}/g, String(assigneeDevices.length));
                  });
                  setPerTesterEmails(reset);
                }}
              />
            </div>

            {/* Group by region */}
            {(() => {
              // Build region → emails mapping
              const regionEmails: Record<string, { email: string; devices: Device[] }[]> = {};
              Object.entries(groupedByAssignee).forEach(([email, assigneeDevices]) => {
                if (email === 'unassigned') return;
                const region = assigneeDevices[0]?.country || 'Unknown Region';
                if (!regionEmails[region]) regionEmails[region] = [];
                regionEmails[region].push({ email, devices: assigneeDevices });
              });
              const regions = Object.keys(regionEmails).sort();

              return (
                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                  {regions.map((region) => (
                    <div key={region} className="border border-[var(--ui-background-layer-border-border-layer-page)] rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-[var(--ui-background-layer-layer-page-hover)] border-b border-[var(--ui-background-layer-border-border-layer-page)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--ui-text-text-secondary)]">📍 {region}</span>
                          <span className="text-xs text-[var(--ui-text-text-placeholder)]">{regionEmails[region].length} tester(s) · {regionEmails[region].reduce((sum, t) => sum + t.devices.length, 0)} device(s)</span>
                        </div>
                        <span className="text-xs text-[var(--ui-text-text-placeholder)]">From: beta-team@eero.com</span>
                      </div>

                      <div className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
                        {regionEmails[region].map(({ email, devices: testerDevices }) => (
                          <div key={email} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-[var(--ui-text-text-secondary)]">To: {email}</span>
                              <span className="text-xs text-[var(--ui-text-text-placeholder)]">{testerDevices.length} device(s)</span>
                            </div>
                            <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Subject</label>
                            <input
                              type="text"
                              value={(perTesterSubjects[email] || emailSubject).replace(/\{count\}/g, String(testerDevices.length))}
                              onChange={(e) => setPerTesterSubjects({ ...perTesterSubjects, [email]: e.target.value })}
                              className="w-full px-3 py-1.5 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-md text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-[var(--ui-core-periwinkle-periwinkle-6)]"
                            />
                            <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Message</label>
                            <textarea
                              value={perTesterEmails[email] || ''}
                              onChange={(e) => setPerTesterEmails({ ...perTesterEmails, [email]: e.target.value })}
                              className="w-full px-3 py-2 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-md text-sm font-mono resize-none h-32 focus:outline-none focus:ring-1 focus:ring-[var(--ui-core-periwinkle-periwinkle-6)]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* What will happen */}
        <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-6 mb-8">
          <h3 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider mb-4">What will happen</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-[var(--ui-core-green-green-6)] mt-0.5">✓</span>
              <p className="text-sm text-[var(--ui-text-text-secondary)]"><span className="font-medium">{uniqueDevices.length}</span> device(s) will be marked as {willBrick ? 'deactivated (bricked)' : 'pending return'}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--ui-core-green-green-6)] mt-0.5">✓</span>
              <p className="text-sm text-[var(--ui-text-text-secondary)]"><span className="font-medium">1</span> consolidated JIRA ticket created covering all {uniqueDevices.length} device(s)</p>
            </div>
            {requiresReturn && (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-[var(--ui-core-green-green-6)] mt-0.5">✓</span>
                  <p className="text-sm text-[var(--ui-text-text-secondary)]"><span className="font-medium">{assigneeCount}</span> return email(s) drafted (grouped by tester — one email per person)</p>
                </div>
              </>
            )}
            {reason === 'lost' && (
              <div className="flex items-start gap-3">
                <span className="text-[var(--ui-core-red-red-6)] mt-0.5">⚠️</span>
                <p className="text-sm text-[var(--ui-support-text-support-error)] font-medium">{uniqueDevices.length} device(s) will be remotely bricked — they will never connect to a network again</p>
              </div>
            )}
            {reason === 'end_of_program' && brickDevices && (
              <div className="flex items-start gap-3">
                <span className="text-[var(--ui-core-red-red-6)] mt-0.5">⚠️</span>
                <p className="text-sm text-[var(--ui-support-text-support-error)] font-medium">{uniqueDevices.length} device(s) will be remotely bricked via the Partner API — they will never connect to a network again</p>
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className="text-[var(--ui-core-green-green-6)] mt-0.5">✓</span>
              <p className="text-sm text-[var(--ui-text-text-secondary)]">All actions logged to each device's audit trail</p>
            </div>
          </div>
        </div>

        {/* Brick confirmation — for lost OR end-of-program with brick enabled */}
        {willBrick && (
          <div className="bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-xl p-5 mb-8">
            <Checkbox
              checked={confirmed}
              onChange={(e: { target: { checked: boolean } }) => setConfirmed(e.target.checked)}
              label={
                reason === 'lost'
                  ? `I confirm these ${uniqueDevices.length} device(s) are lost or unrecoverable and should be permanently bricked. This action cannot be undone.`
                  : `I confirm these ${uniqueDevices.length} device(s) should be permanently bricked as part of the end-of-program process. They will never connect to a network again. This action cannot be undone.`
              }
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pb-12">
          <Button
            type="default"
            label="Cancel"
            onClick={onClose}
          />
          <Button
            type="primary"
            danger={willBrick}
            label="Preview Changes →"
            onClick={() => setShowPreview(true)}
            disabled={processing || (willBrick && !confirmed)}
          />
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <Modal
            isOpen
            title="Preview: Bulk Return"
            onCancel={() => setShowPreview(false)}
            hideFooter
          >
            <p className="text-xs text-[var(--ui-text-text-placeholder)] mb-4">Generated: {new Date().toLocaleString()} · Nothing has been changed yet.</p>

            {/* What will happen */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-[var(--ui-background-layer-layer-page-hover)] border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg">
                <span className="text-lg">📦</span>
                <div>
                  <p className="text-sm font-medium text-[var(--ui-text-text-secondary)]">{uniqueDevices.length} device(s) will be marked as {willBrick ? 'BRICKED & DEACTIVATED' : 'Pending Return'}</p>
                  <p className="text-xs text-[var(--ui-text-text-tertiary)]">{willBrick ? 'Permanently deactivated via Partner API — cannot be undone' : 'Return emails will be sent. Devices stay active until confirmed received.'}</p>
                </div>
              </div>

              {willBrick && (
                <div className="p-3 bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-lg">
                  <p className="text-xs font-semibold text-[var(--ui-support-text-support-error)] mb-2">🚨 Devices being bricked:</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueDevices.map((d) => (
                      <span key={d.id} className="text-xs font-mono bg-[var(--ui-support-fill-support-error)] text-[var(--ui-support-text-support-error)] px-1.5 py-0.5 rounded">{d.serialNumber}</span>
                    ))}
                  </div>
                </div>
              )}

              {requiresReturn && (
                <div className="p-3 bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] rounded-lg">
                  <p className="text-xs font-medium text-[var(--ui-support-text-icon-support-info)]">{assigneeCount} return email(s) will be sent (grouped by region, from beta-team@eero.com)</p>
                </div>
              )}
            </div>

            {/* Affected testers */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase mb-2">Affected testers</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.entries(groupedByAssignee).filter(([k]) => k !== 'unassigned').map(([email, devs]) => (
                  <div key={email} className="flex items-center justify-between text-xs p-2 bg-[var(--ui-background-layer-layer-page-hover)] rounded">
                    <span className="text-[var(--ui-text-text-secondary)]">{devs[0].assignedTo || email}</span>
                    <span className="text-[var(--ui-text-text-placeholder)]">{email} · {devs.length} device(s) · {devs[0].country || '?'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                type="default"
                label="← Go Back & Edit"
                onClick={() => setShowPreview(false)}
              />
              <Button
                type="primary"
                danger={willBrick}
                label={willBrick ? `Confirm & Brick ${uniqueDevices.length} Device(s)` : `Confirm & Process ${uniqueDevices.length} Device(s)`}
                onClick={() => { setShowPreview(false); handleSubmit(); }}
              />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
