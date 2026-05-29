'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">Add Device</h2>
            <p className="text-xs text-gray-500 mt-0.5">MAC, firmware, and location will auto-populate on next API sync.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Serial */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Serial Number *</label>
            <input
              type="text"
              required
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. GGC54MX36114006L"
            />
          </div>

          {/* Model + Internal Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="eero Max 7"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Internal Name</label>
              <input
                type="text"
                value={formData.internalName}
                onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Merci"
              />
            </div>
          </div>

          {/* Program */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
            <select
              value={formData.program}
              onChange={(e) => setFormData({ ...formData, program: e.target.value as Program })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beta">Beta</option>
              <option value="dogfood">Dogfood</option>
              <option value="prq">PRQ</option>
              <option value="pvt">PVT</option>
              <option value="evt">EVT</option>
              <option value="dvt">DVT</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Assigned To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.assignedEmail}
                onChange={(e) => setFormData({ ...formData, assignedEmail: e.target.value })}
                onBlur={handleEmailBlur}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="jsmith@amazon.com"
              />
              {profileApplied && (
                <p className="text-xs text-green-600 mt-1">✓ Known tester — profile data will be applied</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16"
              placeholder="e.g. Replacement for defective unit GGC54MX..."
            />
          </div>

          {/* Info box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              Once added, the next daily API sync will fetch the full device details (MAC address, firmware version, network status, location) from the Partner API automatically.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
