'use client';

import { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '@/types';
import { Edit2, Clock, Download } from 'lucide-react';
import { useDeviceStore } from '@/store/deviceStore';
import { useAuthStore } from '@/store/authStore';
import FirmwarePanel from './FirmwarePanel';
import HealthPanel from './HealthPanel';
import DeviceTimeline from './DeviceTimeline';
import JiraPanel from './JiraPanel';
import DeactivateDeviceModal from './DeactivateDeviceModal';
import AttachmentsPanel from './AttachmentsPanel';
import SalesforcePanel from './SalesforcePanel';
import { STATUS_CONFIG as SHARED_STATUS_CONFIG, downloadCSV, daysSince } from '@/constants';

interface DeviceDetailPanelProps {
  device: Device;
  onClose: () => void;
  onNavigateToPerson?: (email: string) => void;
}

// ─── Field Definitions (data-driven) ──────────────────────────────────────────
type FieldDef = { label: string; field: keyof Device; linkUrl?: (d: Device) => string | undefined; options?: string[] };

const DEVICE_FIELDS: FieldDef[] = [
  { label: 'MODEL', field: 'model' },
  { label: 'MANUFACTURER', field: 'manufacturer' },
  { label: 'REVISION', field: 'revision' },
  { label: 'REVISION NOTES', field: 'revisionNotes' },
  { label: 'HARDWARE CONFIG', field: 'hardwareConfig' },
  { label: 'MAC', field: 'mac' },
  { label: 'INTERNAL NAME', field: 'internalName' },
  { label: 'SKU', field: 'sku' },
  { label: 'PART NUMBER', field: 'partNumber' },
  { label: 'COUNTRY', field: 'country' },
  { label: 'ADMIN ID', field: 'unitId', linkUrl: (d) => d.unitId ? `https://admin.e2ro.com/users/${d.unitId.replace(/^UID0*/, '')}` : undefined },
  { label: 'FIRMWARE', field: 'firmwareVersion' },
  { label: 'ENVIRONMENT', field: 'environment', options: ['', 'stage', 'prod'] },
];

const ASSIGNMENT_FIELDS: FieldDef[] = [
  { label: 'COUNTRY', field: 'country' },
  { label: 'INSIGHT NETWORK', field: 'network', linkUrl: (d) => d.network ? `https://insight.eero.com/eeros/${d.network}` : undefined },
];

const LOGISTICS_FIELDS: FieldDef[] = [
  { label: 'ASSET TAG', field: 'assetTag' },
  { label: 'PO / EXPENSIFY', field: 'poExpensify' },
  { label: 'TRACKING', field: 'tracking' },
  { label: 'RETURN TRACKING', field: 'returnTrackingNumber' },
  { label: 'JIRA', field: 'jira' },
];

const CONTACT_FIELDS: FieldDef[] = [
  { label: 'EMAIL', field: 'assignedEmail' },
  { label: 'CONTACT EMAIL', field: 'contactEmail' },
  { label: 'ALTERNATE EMAIL', field: 'alternateEmail' },
  { label: 'DUE DATE', field: 'dueDate' },
];

// ─── Status Display ───────────────────────────────────────────────────────────
const STATUS_CONFIG = SHARED_STATUS_CONFIG;

// ─── Export Helper ────────────────────────────────────────────────────────────
function exportDeviceCSV(device: Device) {
  const rows: [string, string][] = [
    ['Serial Number', device.serialNumber], ['Model', device.model],
    ['Manufacturer', device.manufacturer], ['Revision', device.revision],
    ['Hardware Config', device.hardwareConfig], ['Internal Name', device.internalName],
    ['SKU', device.sku], ['Country', device.country],
    ['Admin ID', device.unitId], ['Firmware', device.firmwareVersion],
    ['Environment', device.environment || ''],
    ['Status', device.status], ['Assigned To', device.assignedTo],
    ['Email', device.assignedEmail], ['Contact Email', device.contactEmail || ''],
    ['Alternate Email', device.alternateEmail || ''],
    ['Insight Network', device.network], ['Location', device.location],
    ['Program', device.program], ['PO / Expensify', device.poExpensify],
    ['Tracking', device.tracking], ['Testbed', device.testbedName],
    ['Due Date', device.dueDate], ['Notes', device.notes],
  ];
  downloadCSV(`${device.serialNumber}_device_info.csv`, [['Field', 'Value'], ...rows]);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DeviceDetailPanel({ device: initialDevice, onClose, onNavigateToPerson }: DeviceDetailPanelProps) {
  const { devices, updateDevice, addHistoryEntry, getTesterProfile } = useDeviceStore();
  const { canEdit } = useAuthStore();
  const device = devices.find((d) => d.id === initialDevice.id) || initialDevice;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(device);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => { updateDevice(device.id, editData); setIsEditing(false); };
  const statusInfo = STATUS_CONFIG[device.status] || { class: 'bg-gray-100 text-gray-600', label: device.status };

  const renderFields = (fields: FieldDef[], editable = true) =>
    fields.map(({ label, field, linkUrl, options }) => (
      <DetailField
        key={`${label}-${field}`}
        label={label}
        value={String((device as any)[field] || '')}
        editing={editable && isEditing}
        field={field}
        editData={editData}
        setEditData={setEditData}
        linkUrl={linkUrl?.(device)}
        options={options}
      />
    ));

  return (
    <div className="fixed inset-0 top-12 z-40 bg-gray-50 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium mb-2" onClick={onClose}>
          ← Back to devices
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{device.serialNumber}</h1>

        {/* Status bar + actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className={`status-badge ${statusInfo.class}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {statusInfo.label}
            </span>
            {device.country && <span className="text-sm text-red-600 font-medium">📍 {device.country}</span>}
          </div>
          <div className="flex items-center gap-2">
            <ActionButton onClick={() => exportDeviceCSV(device)} icon={<Download size={14} />} label="Export" />
            {canEdit() && (
              <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Edit2 size={14} /> Edit details
              </button>
            )}
            {canEdit() && device.status !== 'deactivated' && (
              <button onClick={() => setShowDeactivateModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Return to eero
              </button>
            )}
          </div>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <SectionBlock title="DEVICE">
              {renderFields(DEVICE_FIELDS)}
              <DetailField label="DEACTIVATED" value={device.deactivated ? 'yes' : 'no'} editing={false} field="deactivated" editData={editData} setEditData={setEditData} />
            </SectionBlock>
          </div>

          <div className="space-y-6">
            <SectionBlock title="ASSIGNMENT">
              <DetailField label="STATUS" value={statusInfo.label} editing={false} field="status" editData={editData} setEditData={setEditData} />
              {/* Assigned To — clickable to navigate to person profile */}
              {isEditing ? (
                <DetailField label="ASSIGNED TO" value={device.assignedTo || device.checkedOutTo || ''} editing={true} field="assignedTo" editData={editData} setEditData={setEditData} />
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">ASSIGNED TO</span>
                  {(device.assignedTo || device.checkedOutTo) && onNavigateToPerson ? (
                    <span className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigateToPerson(device.assignedEmail || device.assignedTo || '')}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {device.assignedTo || device.checkedOutTo} →
                      </button>
                      {(() => { const p = getTesterProfile(device.assignedEmail || ''); return p?.testerId ? <span className="text-xs font-mono text-gray-400">{p.testerId}</span> : null; })()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-900">{device.assignedTo || device.checkedOutTo || '—'}</span>
                  )}
                </div>
              )}
              {renderFields(ASSIGNMENT_FIELDS)}
            </SectionBlock>
            <SectionBlock title="LOGISTICS">{renderFields(LOGISTICS_FIELDS)}</SectionBlock>
          </div>

          <div className="space-y-6">
            <SectionBlock title="NOTES">
              {isEditing ? (
                <textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{device.notes || '—'}</p>
              )}
            </SectionBlock>
            {device.testbedName && <SectionBlock title="TESTBED"><p className="text-sm text-gray-900">{device.testbedName}</p></SectionBlock>}
            {device.assignedEmail && (
              <SectionBlock title="CONTACT">
                {renderFields(CONTACT_FIELDS)}
                <DetailField label="PROGRAM" value={device.program} editing={false} field="program" editData={editData} setEditData={setEditData} />
              </SectionBlock>
            )}

            {/* Email Tracking & Return Escalation */}
            {(device.returnEmailSentAt || device.status === 'deactivated' || device.status === 'pending_return') && (
              <SectionBlock title="RETURN STATUS">
                {device.returnEmailSentAt && (() => {
                  const daysSinceSent = daysSince(device.returnEmailSentAt);
                  const isWeek1 = daysSinceSent >= 7 && daysSinceSent < 14;
                  const isWeek2 = daysSinceSent >= 14;
                  return (
                    <>
                      <div className="flex items-baseline gap-3">
                        <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">EMAIL SENT</span>
                        <span className="text-sm text-green-700">{new Date(device.returnEmailSentAt).toLocaleDateString()} ({device.returnEmailCount || 1}× sent) · {daysSinceSent} day(s) ago</span>
                      </div>
                      {device.returnReminderSentAt && (
                        <div className="flex items-baseline gap-3">
                          <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">REMINDER SENT</span>
                          <span className="text-sm text-orange-600">{new Date(device.returnReminderSentAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {/* Week 1 escalation: send follow-up */}
                      {isWeek1 && device.status === 'pending_return' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs font-medium text-yellow-800 mb-2">⏰ 1 week since return request — send a follow-up reminder</p>
                          <button
                            onClick={() => {
                              const testerName = device.assignedTo || 'Team Member';
                              const subject = encodeURIComponent(`[Follow-up] Please return your eero device — ${device.serialNumber}`);
                              const body = encodeURIComponent(`Hi ${testerName},\n\nThis is a friendly follow-up. We sent a return request on ${new Date(device.returnEmailSentAt!).toLocaleDateString()} for your eero device (${device.serialNumber}).\n\nPlease return it at your earliest convenience. If you've already shipped it, reply with the tracking number.\n\nThank you,\nDevice Management Team`);
                              window.open(`mailto:${device.assignedEmail}?from=beta-team@eero.com&subject=${subject}&body=${body}`, '_self');
                              updateDevice(device.id, { returnReminderSentAt: new Date().toISOString(), returnEmailCount: (device.returnEmailCount || 1) + 1 });
                              addHistoryEntry({ id: crypto.randomUUID(), deviceId: device.id, timestamp: new Date().toISOString(), action: 'reminder_sent', user: 'Admin', description: `Week 1 follow-up reminder sent to ${device.assignedEmail}` });
                            }}
                            className="px-4 py-1.5 text-xs font-medium text-yellow-800 border border-yellow-300 rounded-md hover:bg-yellow-100"
                          >
                            Send Follow-up Reminder
                          </button>
                        </div>
                      )}
                      {/* Week 2 escalation: contact directly or brick */}
                      {isWeek2 && device.status === 'pending_return' && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-medium text-red-800 mb-2">🚨 2+ weeks since return request — escalate: contact tester directly or brick the device</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const testerName = device.assignedTo || 'Team Member';
                                const subject = encodeURIComponent(`[URGENT] eero device return overdue — ${device.serialNumber}`);
                                const body = encodeURIComponent(`Hi ${testerName},\n\nThis is an urgent follow-up. Your eero device (${device.serialNumber}) was requested for return on ${new Date(device.returnEmailSentAt!).toLocaleDateString()} — over 2 weeks ago.\n\nPlease return this device immediately or contact us to discuss. If we don't hear back, the device may be remotely deactivated.\n\nThank you,\nDevice Management Team`);
                                window.open(`mailto:${device.assignedEmail}?from=beta-team@eero.com&subject=${subject}&body=${body}`, '_self');
                                updateDevice(device.id, { returnReminderSentAt: new Date().toISOString(), returnEmailCount: (device.returnEmailCount || 1) + 1 });
                                addHistoryEntry({ id: crypto.randomUUID(), deviceId: device.id, timestamp: new Date().toISOString(), action: 'reminder_sent', user: 'Admin', description: `Week 2 URGENT reminder sent to ${device.assignedEmail}` });
                              }}
                              className="px-4 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-100"
                            >
                              Send Urgent Reminder
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Brick device ${device.serialNumber}? This will permanently deactivate it via the Partner API. This cannot be undone.`)) {
                                  updateDevice(device.id, { status: 'deactivated' as DeviceStatus, deactivated: true });
                                  addHistoryEntry({ id: crypto.randomUUID(), deviceId: device.id, timestamp: new Date().toISOString(), action: 'bricked', user: 'Admin', description: `Device bricked after 2+ weeks with no return. Previously assigned to ${device.assignedEmail}` });
                                }
                              }}
                              className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                              Brick Device
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Confirm return received button */}
                      {device.status === 'pending_return' && (
                        <button
                          onClick={() => {
                            updateDevice(device.id, { status: 'deactivated' as DeviceStatus, deactivated: true });
                            addHistoryEntry({ id: crypto.randomUUID(), deviceId: device.id, timestamp: new Date().toISOString(), action: 'return_confirmed', user: 'Admin', description: `Device return confirmed. Marked as deactivated.` });
                          }}
                          className="mt-3 px-4 py-2 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50 w-full text-center"
                        >
                          ✓ Confirm Device Received — Mark as Deactivated
                        </button>
                      )}
                    </>
                  );
                })()}
                {!device.returnEmailSentAt && device.status === 'pending_return' && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">STATUS</span>
                    <span className="text-sm text-orange-600">Pending return — no email sent yet</span>
                  </div>
                )}
              </SectionBlock>
            )}
          </div>
        </div>

        {/* Edit actions */}
        {isEditing && (
          <div className="flex justify-end gap-2 mt-8">
            <button onClick={() => { setIsEditing(false); setEditData(device); }} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Changes</button>
          </div>
        )}

        {/* Feature panels */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <FirmwarePanel deviceId={device.id} />
          <HealthPanel deviceId={device.id} />
          <JiraPanel deviceId={device.id} />
          <SalesforcePanel deviceId={device.id} deviceSerial={device.serialNumber} />
          <AttachmentsPanel deviceId={device.id} />
        </div>

        {/* Timeline */}
        <div className="mt-10 border-t border-gray-200 pt-8 pb-12">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Device Timeline</h3>
          </div>
          <DeviceTimeline deviceId={device.id} />
        </div>
      </div>

      {showDeactivateModal && <DeactivateDeviceModal device={device} onClose={() => setShowDeactivateModal(false)} />}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActionButton({ onClick, icon, label }: { onClick?: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
      {icon} {label}
    </button>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailField({ label, value, editing, field, editData, setEditData, linkUrl, options }: {
  label: string; value: string; editing: boolean; field: keyof Device;
  editData: Device; setEditData: (d: Device) => void; linkUrl?: string; options?: string[];
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">{label}</span>
        {options ? (
          <select
            value={(editData[field] as string) || ''}
            onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
            className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt === '' ? '— not set —' : opt}</option>
            ))}
          </select>
        ) : (
          <input type="text" value={(editData[field] as string) || ''} onChange={(e) => setEditData({ ...editData, [field]: e.target.value })} className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        )}
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">{label}</span>
      {linkUrl && value ? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">{value} ↗</a>
      ) : (
        <span className="text-sm text-gray-900">{value || '—'}</span>
      )}
    </div>
  );
}
