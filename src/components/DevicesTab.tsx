'use client';

import { useState, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Device, DeviceStatus, Program } from '@/types';
import { Search, Filter, Plus, RefreshCw, ChevronDown, Edit2, Monitor } from 'lucide-react';
import DeviceDetailPanel from './DeviceDetailPanel';
import AddDeviceModal from './AddDeviceModal';
import BulkReturnPanel from './BulkReturnPanel';

export default function DevicesTab() {
  const { devices, updateDevice, addHistoryEntry } = useDeviceStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [programFilter, setProgramFilter] = useState<Program | 'all'>('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkReturn, setShowBulkReturn] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  const models = useMemo(() => {
    const m = new Set(devices.map((d) => d.model).filter(Boolean));
    return Array.from(m).sort();
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchesSearch =
        !search ||
        d.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        d.model.toLowerCase().includes(search.toLowerCase()) ||
        d.internalName.toLowerCase().includes(search.toLowerCase()) ||
        d.assignedTo?.toLowerCase().includes(search.toLowerCase()) ||
        d.assignedEmail?.toLowerCase().includes(search.toLowerCase()) ||
        d.mac?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesProgram = programFilter === 'all' || d.program === programFilter;
      const matchesModel = modelFilter === 'all' || d.model === modelFilter;

      return matchesSearch && matchesStatus && matchesProgram && matchesModel;
    });
  }, [devices, search, statusFilter, programFilter, modelFilter]);

  const toggleSelectAll = () => {
    if (selectedDevices.size === filteredDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(filteredDevices.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedDevices);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDevices(next);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search serial, model, name, email, MAC..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | 'all')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="not_online">Not Online</option>
          <option value="deactivated">Deactivated</option>
        </select>

        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value as Program | 'all')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Programs</option>
          <option value="beta">Beta</option>
          <option value="dogfood">Dogfood</option>
          <option value="prq">PRQ</option>
          <option value="pvt">PVT</option>
          <option value="evt">EVT</option>
          <option value="dvt">DVT</option>
          <option value="other">Other</option>
        </select>

        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Models</option>
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Device
        </button>
      </div>

      {/* Device actions */}
      {selectedDevices.size === 1 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-lg sticky top-14 z-20">
          <span className="text-sm font-medium text-blue-800">
            1 device selected
          </span>
          <button
            onClick={() => setSelectedDevices(new Set())}
            className="px-3 py-1 text-blue-700 border border-blue-300 rounded text-xs font-medium hover:bg-blue-100"
          >
            Clear
          </button>
          <button
            onClick={() => {
              const deviceId = Array.from(selectedDevices)[0];
              const device = filteredDevices.find((d) => d.id === deviceId);
              if (device) {
                setSelectedDevice(device);
                setSelectedDevices(new Set());
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
          >
            Edit device →
          </button>
          <button
            onClick={() => setShowBulkReturn(true)}
            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
          >
            Return selected →
          </button>
          <button
            onClick={() => {
              const ids = Array.from(selectedDevices);
              ids.forEach((id) => {
                updateDevice(id, { status: 'deactivated' as DeviceStatus, deactivated: true });
                addHistoryEntry({ id: crypto.randomUUID(), deviceId: id, timestamp: new Date().toISOString(), action: 'archived', user: 'Admin', description: 'Device archived' });
              });
              setSelectedDevices(new Set());
            }}
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700"
          >
            Archive selected
          </button>
        </div>
      )}
      {selectedDevices.size > 1 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-lg sticky top-14 z-20">
          <span className="text-sm font-medium text-blue-800">
            {selectedDevices.size} device(s) selected
          </span>
          <button
            onClick={() => setSelectedDevices(new Set())}
            className="px-3 py-1 text-blue-700 border border-blue-300 rounded text-xs font-medium hover:bg-blue-100"
          >
            Clear
          </button>
          <button
            onClick={() => setShowBulkReturn(true)}
            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
          >
            Return selected →
          </button>
          <button
            onClick={() => {
              const ids = Array.from(selectedDevices);
              ids.forEach((id) => {
                updateDevice(id, { status: 'deactivated' as DeviceStatus, deactivated: true });
                addHistoryEntry({ id: crypto.randomUUID(), deviceId: id, timestamp: new Date().toISOString(), action: 'archived', user: 'Admin', description: 'Device archived' });
              });
              setSelectedDevices(new Set());
            }}
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700"
          >
            Archive selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDevices.size > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">Serial Number</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">Model</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">Internal Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">Phase</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">Firmware</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">Program</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">Assigned To</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDevice(device)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedDevices.has(device.id)}
                      onChange={() => toggleSelect(device.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">{device.serialNumber}</td>
                  <td className="px-4 py-3">{device.model}</td>
                  <td className="px-4 py-3 text-gray-600">{device.internalName}</td>
                  <td className="px-4 py-3 text-gray-600">{device.revision || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{device.firmwareVersion || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {device.program}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{device.assignedTo || device.checkedOutTo || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={device.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDevices.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Monitor size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No devices found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add devices via Import</p>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
          Showing {filteredDevices.length} of {devices.length} devices
        </div>
      </div>

      {/* Detail Panel */}
      {selectedDevice && (
        <DeviceDetailPanel device={selectedDevice} onClose={() => setSelectedDevice(null)} />
      )}

      {/* Add Device Modal */}
      {showAddModal && <AddDeviceModal onClose={() => setShowAddModal(false)} />}

      {/* Bulk Return Panel */}
      {showBulkReturn && (
        <BulkReturnPanel
          devices={devices.filter((d) => selectedDevices.has(d.id))}
          onClose={() => { setShowBulkReturn(false); setSelectedDevices(new Set()); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  const config: Record<DeviceStatus, { class: string; label: string }> = {
    online: { class: 'status-in-stock', label: 'Online' },
    not_online: { class: 'status-checked-out', label: 'Not Online' },
    in_repair: { class: 'status-in-repair', label: 'In Repair' },
    in_testing: { class: 'status-in-testing', label: 'In Testing' },
    deactivated: { class: 'bg-gray-100 text-gray-600', label: 'Deactivated' },
  };

  const c = config[status] || { class: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`status-badge ${c.class}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  );
}
