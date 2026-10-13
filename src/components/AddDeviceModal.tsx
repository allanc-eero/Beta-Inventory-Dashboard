'use client';

import { useMemo, useState } from 'react';
import { Modal, Input, Select, TextArea, Button } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { useBetaProgramsStore } from '@/store/betaProgramsStore';
import { programEnumFor } from '@/components/programs/helpers';
import type { DemoTester } from '@/components/programs/types';
import { Device, DeviceStatus } from '@/types';
import { runDeviceSync } from '@/lib/networkSync';

interface AddDeviceModalProps {
  onClose: () => void;
  // When opened from a program's page, the device is added to that program and
  // the Program field is locked.
  programName?: string;
}

export default function AddDeviceModal({ onClose, programName }: AddDeviceModalProps) {
  const { addDevice, addHistoryEntry, getTesterProfile, upsertTesterProfile, getDeviceBySerial, addPerson, getPersonByEmail } = useDeviceStore();
  const { programs, setPrograms } = useBetaProgramsStore();
  // Hardware programs only — active first, completed ones at the end.
  const hardwarePrograms = useMemo(() => {
    // Always include the locked program, even if it isn't a hardware program.
    const hw = programs.filter((p) => p.type === 'hardware' || p.name === programName);
    return [...hw.filter((p) => p.status === 'active'), ...hw.filter((p) => p.status !== 'active')];
  }, [programs, programName]);
  const [formData, setFormData] = useState({
    serialNumber: '',
    model: 'eero Max 7',
    internalName: '',
    programName: programName || '',
    assignedTo: '',
    assignedEmail: '',
    notes: '',
  });
  const [profileApplied, setProfileApplied] = useState(false);

  const selectedProgram = programs.find((p) => p.name === formData.programName);
  const serial = formData.serialNumber.trim();
  const duplicate = serial ? getDeviceBySerial(serial) : undefined;
  const serialError = duplicate ? `Serial ${serial} already exists${duplicate.programName ? ` (in ${duplicate.programName})` : ''}` : '';
  const canSubmit = !!serial && !duplicate && !!selectedProgram;

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
    if (!canSubmit || !selectedProgram) return;
    const program = selectedProgram;
    const email = formData.assignedEmail.trim().toLowerCase();
    const profile = email ? getTesterProfile(email) : undefined;
    const assignedName = formData.assignedTo.trim() || profile?.name || '';

    const device: Device = {
      id: crypto.randomUUID(),
      serialNumber: serial,
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
      networkGroup: '',
      program: programEnumFor(program),
      programName: program.name,
      phase: program.currentPhase,
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
      checkedOutDate: program.startDate || (formData.assignedTo ? new Date().toISOString() : ''),
      dueDate: program.finishDate || '',
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
      testbedName: program.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDevice(device);
    // Look the serial up right away (eero Admin API) → network + Admin/Insight links.
    runDeviceSync([device.serialNumber]);

    // Add the tester to the program's roster (same shape as adding a tester inside
    // a program), plus People + tester profile, keyed by the program's name.
    if (email) {
      const name = assignedName || email;
      const onRoster = program.testers.some((t) => t.email.toLowerCase() === email);
      if (!onRoster) {
        const t: DemoTester = {
          id: `${program.id}-new-${Date.now()}`,
          name,
          email: formData.assignedEmail.trim(),
          programName: program.name,
          technicalLevel: 'Intermediate',
          reliability: 0,
          avgResponseDays: 0,
          feedbackQuality: 0,
          deviceOnline: null,
          missedSurveys: 0,
          noSeedDevice: true,
        };
        setPrograms((prev) => prev.map((p) => (p.id === program.id ? { ...p, testers: [t, ...p.testers] } : p)));
      }
      if (!getPersonByEmail(email)) addPerson({ id: crypto.randomUUID(), name, email: formData.assignedEmail.trim(), team: '', devices: [] });
      upsertTesterProfile({ email, name, programs: [program.name] });
    }

    // Log creation to history
    addHistoryEntry({
      id: crypto.randomUUID(),
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      action: 'created',
      user: 'Admin',
      description: `Device manually added to ${program.name}${formData.assignedTo ? ` — assigned to ${formData.assignedTo}` : ''}. Full details will populate on next API sync.`,
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
      okButtonProps={{ disabled: !canSubmit }}
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
          state={serialError ? 'error' : 'default'}
        />
        {serialError && (
          <p className="text-xs text-[var(--ui-core-red-red-6)] -mt-3">{serialError}</p>
        )}

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
          required
          value={formData.programName || undefined}
          onChange={(value) => setFormData({ ...formData, programName: value as string })}
          placeholder="Select a program"
          disabled={!!programName}
          options={hardwarePrograms.map((p) => ({
            value: p.name,
            label: p.status === 'completed' ? `${p.name} (completed)` : p.name,
          }))}
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
