'use client';

import { useState } from 'react';
import { Modal, Input, Select, TextArea, Button } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { Device, DeviceStatus, Program } from '@/types';

interface AddDeviceModalProps {
  onClose: () => void;
}

export default function AddDeviceModal({ onClose }: AddDeviceModalProps) {
  const { addDevice, addHistoryEntry, getTesterProfile, upsertTesterProfile } = useDeviceStore();
  const [formData, setFormData] = useState({
    serialNumber: '',
    model: 'eero Max 7',
    internalName: '',
    program: 'beta' as Program,
    assignedTo: '',
    assignedEmail: '',
    notes: '',
  });
  const [profileApplied, setProfileApplied] = useState(false);

  // When email field loses focus, try to auto-fill from tester profile
  const handleEmailBlur = () => {
    const email = formData.assignedEmail.trim().toLowerCase();
    if (!email || profileApplied) return;
    const profile = getTesterProfile(email);
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        assignedTo: prev.assignedTo || profile.name,
      }));
      setProfileApplied(true);
    }
  };

  const handleSubmit = () => {
    const email = formData.assignedEmail.trim().toLowerCase();
    const profile = email ? getTesterProfile(email) : undefined;

    const device: Device = {
      id: crypto.randomUUID(),
      serialNumber: formData.serialNumber,
      model: formData.model,
      manufacturer: 'eero',
      revision: '',
      revisionNotes: '',
      hardwareConfig: '',
      mac: '',
      internalName: formData.internalName,
      sku: '',
      partNumber: '',
      country: profile?.country || '',
      adminId: profile?.adminId || '',
      unitId: '',
      deactivated: false,
      firmwareVersion: '',
      status: 'not_online' as DeviceStatus,
      assignedTo: formData.assignedTo || profile?.name || '',
      assignedEmail: formData.assignedEmail,
      contactEmail: profile?.contactEmail || '',
      alternateEmail: profile?.alternateEmail || '',
      location: profile?.location || '',
      adminLocation: '',
      network: profile?.networkId || '',
      program: formData.program,
      product: '',
      assetTag: '',
      poExpensify: '',
      accountingId: '',
      cost: '',
      purchaseDate: '',
      imei1: '',
      imei2: '',
      eid: '',
      tracking: '',
      jira: '',
      checkedOutTo: formData.assignedTo || profile?.name || '',
      checkedOutDate: formData.assignedTo ? new Date().toISOString() : '',
      dueDate: '',
      notes: formData.notes,
      shipmentStatus: 'ordered',
      fcLocation: '',
      leg1Carrier: '',
      leg1Tracking: '',
      leg1Date: '',
      leg2Carrier: '',
      leg2Tracking: '',
      leg2Date: '',
      testbedId: '',
      testbedName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDevice(device);

    // Upsert tester profile
    if (email) {
      upsertTesterProfile({ email, name: formData.assignedTo, programs: [formData.program] });
    }

    // Log creation to history
    addHistoryEntry({
      id: crypto.randomUUID(),
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      action: 'created',
      user: 'Admin',
      description: `Device manually added${formData.assignedTo ? ` — assigned to ${formData.assignedTo}` : ''}. Full details will populate on next API sync.`,
    });

    onClose();
  };

  return (
    <Modal
      isOpen
      title="Add Device"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Add Device"
      cancelText="Cancel"
      okButtonProps={{ disabled: !formData.serialNumber }}
    >
      <p className="text-xs text-[var(--ui-text-text-tertiary)] mb-4">
        MAC, firmware, and location will auto-populate on next API sync.
      </p>

      <div className="space-y-4">
        {/* Serial */}
        <Input
          id="add-serial"
          label="Serial Number"
          value={formData.serialNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, serialNumber: e.target.value })}
          placeholder="e.g. GGC54MX36114006L"
          layout="vertical"
        />

        {/* Model + Internal Name */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="add-model"
            label="Model"
            value={formData.model}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, model: e.target.value })}
            placeholder="eero Max 7"
            layout="vertical"
          />
          <Input
            id="add-internal-name"
            label="Internal Name"
            value={formData.internalName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, internalName: e.target.value })}
            placeholder="e.g. Merci"
            layout="vertical"
          />
        </div>

        {/* Program */}
        <Select
          id="add-program"
          label="Program"
          value={formData.program}
          onChange={(value) => setFormData({ ...formData, program: value as Program })}
          options={[
            { value: 'beta', label: 'Beta' },
            { value: 'dogfood', label: 'Dogfood' },
            { value: 'prq', label: 'PRQ' },
            { value: 'pvt', label: 'PVT' },
            { value: 'evt', label: 'EVT' },
            { value: 'dvt', label: 'DVT' },
            { value: 'other', label: 'Other' },
          ]}
          layout="vertical"
        />

        {/* Assigned To */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="add-assigned-to"
            label="Assigned To"
            value={formData.assignedTo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, assignedTo: e.target.value })}
            placeholder="John Smith"
            layout="vertical"
          />
          <div>
            <Input
              id="add-email"
              label="Email"
              value={formData.assignedEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, assignedEmail: e.target.value })}
              onBlur={handleEmailBlur}
              placeholder="jsmith@amazon.com"
              layout="vertical"
            />
            {profileApplied && (
              <p className="text-xs text-[var(--ui-core-green-green-6)] mt-1">✓ Known tester — profile data will be applied</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <TextArea
          id="add-notes"
          label="Notes"
          value={formData.notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="e.g. Replacement for defective unit GGC54MX..."
          layout="vertical"
        />

        {/* Info box */}
        <div className="p-3 bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] rounded-lg">
          <p className="text-xs text-[var(--ui-support-text-icon-support-info)]">
            Once added, the next daily API sync will fetch the full device details (MAC address, firmware version, network status, location) from the Partner API automatically.
          </p>
        </div>
      </div>
    </Modal>
  );
}
