'use client';

import { useState, useEffect } from 'react';
import { Device } from '@/types';
import { ExternalLink, RefreshCw, Edit2, ArrowRightLeft, Clock, FileText, Download } from 'lucide-react';
import { useDeviceStore } from '@/store/deviceStore';
import FirmwarePanel from './FirmwarePanel';
import HealthPanel from './HealthPanel';
import DeviceTimeline from './DeviceTimeline';
import JiraPanel from './JiraPanel';
import DeactivateDeviceModal from './DeactivateDeviceModal';
import AttachmentsPanel from './AttachmentsPanel';

interface DeviceDetailPanelProps {
  device: Device;
  onClose: () => void;
}

export default function DeviceDetailPanel({ device: initialDevice, onClose }: DeviceDetailPanelProps) {
  const { devices, updateDevice, checkinDevice, getDeviceHistory } = useDeviceStore();
  // Always read the latest version of this device from the store
  const device = devices.find((d) => d.id === initialDevice.id) || initialDevice;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(device);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Lock body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const history = getDeviceHistory(device.id);

  const handleSave = () => {
    updateDevice(device.id, editData);
    setIsEditing(false);
  };

  const handleCheckin = () => {
    checkinDevice(device.id);
    onClose();
  };

  const handleExport = () => {
    const rows = [
      ['Field', 'Value'],
      ['Serial Number', device.serialNumber],
      ['Model', device.model],
      ['Manufacturer', device.manufacturer],
      ['Revision', device.revision],
      ['Hardware Config', device.hardwareConfig],
      ['Internal Name', device.internalName],
      ['SKU', device.sku],
      ['Country', device.country],
      ['Admin ID', device.unitId],
      ['Firmware', device.firmwareVersion],
      ['Status', device.status],
      ['Assigned To', device.assignedTo],
      ['Email', device.assignedEmail],
      ['Contact Email', device.contactEmail || ''],
      ['Alternate Email', device.alternateEmail || ''],
      ['Insight Network', device.network],
      ['Location', device.location],
      ['Program', device.program],
      ['Asset Tag', device.assetTag],
      ['PO / Expensify', device.poExpensify],
      ['Tracking', device.tracking],
      ['Jira', device.jira],
      ['Testbed', device.testbedName],
      ['Due Date', device.dueDate],
      ['Notes', device.notes],
    ];
    const csv = rows.map((r) => r.map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${device.serialNumber}_device_info.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 top-12 z-40 bg-gray-50 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back link */}
        <p
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium mb-2"
          onClick={onClose}
        >
          ← Back to devices
        </p>

        {/* Serial number title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{device.serialNumber}</h1>

        {/* Status bar with actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className={`status-badge ${device.status === 'online' ? 'status-in-stock' : device.status === 'not_online' ? 'status-checked-out' : device.status === 'in_testing' ? 'status-in-testing' : 'status-in-repair'}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {device.status === 'online' ? 'Online' : device.status === 'not_online' ? 'Not Online' : device.status.replace('_', ' ')}
            </span>
            {device.country && (
              <span className="text-sm text-red-600 font-medium">📍 {device.country}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              Export
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Admin panel <ExternalLink size={13} />
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <RefreshCw size={14} />
              Refresh from admin
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Edit2 size={14} />
              Edit details
            </button>
            {device.status !== 'deactivated' && (
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Return to eero
              </button>
            )}
          </div>
        </div>

        {/* Two-column detail layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Device info */}
          <div className="space-y-6">
            <SectionBlock title="DEVICE">
              <DetailField label="MODEL" value={device.model} editing={isEditing} field="model" editData={editData} setEditData={setEditData} />
              <DetailField label="MANUFACTURER" value={device.manufacturer} editing={isEditing} field="manufacturer" editData={editData} setEditData={setEditData} />
              <DetailField label="REVISION" value={device.revision} editing={isEditing} field="revision" editData={editData} setEditData={setEditData} />
              <DetailField label="REVISION NOTES" value={device.revisionNotes} editing={isEditing} field="revisionNotes" editData={editData} setEditData={setEditData} />
              <DetailField label="HARDWARE CONFIG" value={device.hardwareConfig} editing={isEditing} field="hardwareConfig" editData={editData} setEditData={setEditData} />
              <DetailField label="MAC" value={device.mac} editing={isEditing} field="mac" editData={editData} setEditData={setEditData} />
              <DetailField label="INTERNAL NAME" value={device.internalName} editing={isEditing} field="internalName" editData={editData} setEditData={setEditData} />
              <DetailField label="SKU" value={device.sku} editing={isEditing} field="sku" editData={editData} setEditData={setEditData} />
              <DetailField label="PART NUMBER" value={device.partNumber} editing={isEditing} field="partNumber" editData={editData} setEditData={setEditData} />
              <DetailField label="COUNTRY" value={device.country} editing={isEditing} field="country" editData={editData} setEditData={setEditData} />
              <DetailField label="ADMIN ID" value={device.unitId} editing={isEditing} field="unitId" editData={editData} setEditData={setEditData} linkUrl={device.unitId ? `https://admin.e2ro.com/users/${device.unitId.replace(/^UID0*/, '')}` : undefined} />
              <DetailField label="FIRMWARE" value={device.firmwareVersion} editing={isEditing} field="firmwareVersion" editData={editData} setEditData={setEditData} />
              <DetailField label="DEACTIVATED" value={device.deactivated ? 'yes' : 'no'} editing={false} field="deactivated" editData={editData} setEditData={setEditData} />
            </SectionBlock>
          </div>

          {/* Middle column - Assignment */}
          <div className="space-y-6">
            <SectionBlock title="ASSIGNMENT">
              <DetailField label="STATUS" value={device.status.replace('_', ' ')} editing={false} field="status" editData={editData} setEditData={setEditData} />
              <DetailField label="ASSIGNED TO" value={device.assignedTo || device.checkedOutTo} editing={isEditing} field="assignedTo" editData={editData} setEditData={setEditData} />
              <DetailField label="COUNTRY" value={device.country} editing={isEditing} field="country" editData={editData} setEditData={setEditData} />
              <DetailField label="INSIGHT NETWORK" value={device.network} editing={isEditing} field="network" editData={editData} setEditData={setEditData} linkUrl={device.network ? `https://insight.eero.com/networks/${device.network}` : undefined} />
            </SectionBlock>

            <SectionBlock title="LOGISTICS">
              <DetailField label="ASSET TAG" value={device.assetTag} editing={isEditing} field="assetTag" editData={editData} setEditData={setEditData} />
              <DetailField label="PO / EXPENSIFY" value={device.poExpensify} editing={isEditing} field="poExpensify" editData={editData} setEditData={setEditData} />
              <DetailField label="TRACKING" value={device.tracking} editing={isEditing} field="tracking" editData={editData} setEditData={setEditData} />
              <DetailField label="JIRA" value={device.jira} editing={isEditing} field="jira" editData={editData} setEditData={setEditData} />
            </SectionBlock>
          </div>

          {/* Right column - Notes & Contact */}
          <div className="space-y-6">
            <SectionBlock title="NOTES">
              {isEditing ? (
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{device.notes || '—'}</p>
              )}
            </SectionBlock>

            {device.testbedName && (
              <SectionBlock title="TESTBED">
                <p className="text-sm text-gray-900">{device.testbedName}</p>
              </SectionBlock>
            )}

            {device.assignedEmail && (
              <SectionBlock title="CONTACT">
                <DetailField label="EMAIL" value={device.assignedEmail} editing={isEditing} field="assignedEmail" editData={editData} setEditData={setEditData} />
                <DetailField label="CONTACT EMAIL" value={device.contactEmail} editing={isEditing} field="contactEmail" editData={editData} setEditData={setEditData} />
                <DetailField label="ALTERNATE EMAIL" value={device.alternateEmail} editing={isEditing} field="alternateEmail" editData={editData} setEditData={setEditData} />
                <DetailField label="PROGRAM" value={device.program} editing={false} field="program" editData={editData} setEditData={setEditData} />
                <DetailField label="DUE DATE" value={device.dueDate} editing={isEditing} field="dueDate" editData={editData} setEditData={setEditData} />
              </SectionBlock>
            )}
          </div>
        </div>

        {/* Save/Cancel buttons when editing */}
        {isEditing && (
          <div className="flex justify-end gap-2 mt-8">
            <button
              onClick={() => { setIsEditing(false); setEditData(device); }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* ─── Feature Panels ─────────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <FirmwarePanel deviceId={device.id} />
          <HealthPanel deviceId={device.id} />
          <JiraPanel deviceId={device.id} />
          <AttachmentsPanel deviceId={device.id} />
        </div>

        {/* History Section — Enhanced Timeline */}
        <div className="mt-10 border-t border-gray-200 pt-8 pb-12">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Device Timeline</h3>
          </div>
          <DeviceTimeline deviceId={device.id} />
        </div>
      </div>

      {/* Deactivation Modal */}
      {showDeactivateModal && (
        <DeactivateDeviceModal device={device} onClose={() => setShowDeactivateModal(false)} />
      )}
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailField({
  label,
  value,
  editing,
  field,
  editData,
  setEditData,
  linkUrl,
}: {
  label: string;
  value: string;
  editing: boolean;
  field: keyof Device;
  editData: Device;
  setEditData: (d: Device) => void;
  linkUrl?: string;
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">{label}</span>
        <input
          type="text"
          value={(editData[field] as string) || ''}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">{label}</span>
      {linkUrl && value ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {value} ↗
        </a>
      ) : (
        <span className="text-sm text-gray-900">{value || '—'}</span>
      )}
    </div>
  );
}
