'use client';

import { useState, useMemo } from 'react';
import { Button, Select, Tag, Checkbox, Pagination } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { Device, DeviceStatus, Program } from '@/types';
import { Monitor } from 'lucide-react';
import DeviceDetailPanel from './DeviceDetailPanel';
import AddDeviceModal from './AddDeviceModal';
import BulkReturnPanel from './BulkReturnPanel';
import AgentChat from './AgentChat';
import { getStatusBadge } from '@/constants';
import { useAuthStore } from '@/store/authStore';

export default function DevicesTab({ onNavigateToPerson }: { onNavigateToPerson?: (email: string) => void }) {
  const { devices, updateDevice, addHistoryEntry } = useDeviceStore();
  const { canEdit } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [programFilter, setProgramFilter] = useState<Program | 'all'>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkReturn, setShowBulkReturn] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchesSearch =
        !search ||
        d.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        d.internalName.toLowerCase().includes(search.toLowerCase()) ||
        d.assignedTo?.toLowerCase().includes(search.toLowerCase()) ||
        d.assignedEmail?.toLowerCase().includes(search.toLowerCase()) ||
        d.mac?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesProgram = programFilter === 'all' || d.program === programFilter;

      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [devices, search, statusFilter, programFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedDevices);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDevices(next);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-[var(--ui-background-layer-layer-page)] p-4 rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)]">
        <AgentChat />

        <div className="w-40">
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as DeviceStatus | 'all')}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'online', label: 'Online' },
              { value: 'not_online', label: 'Not Online' },
              { value: 'deactivated', label: 'Deactivated' },
            ]}
          />
        </div>

        <div className="w-40">
          <Select
            id="program-filter"
            value={programFilter}
            onChange={(value) => setProgramFilter(value as Program | 'all')}
            options={[
              { value: 'all', label: 'All Programs' },
              { value: 'beta', label: 'Beta' },
              { value: 'dogfood', label: 'Dogfood' },
              { value: 'prq', label: 'PRQ' },
              { value: 'pvt', label: 'PVT' },
              { value: 'evt', label: 'EVT' },
              { value: 'dvt', label: 'DVT' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>

        {canEdit() && (
          <Button type="primary" label="Add Device" onClick={() => setShowAddModal(true)} />
        )}
      </div>

      {/* Device actions — hidden for viewers */}
      {canEdit() && selectedDevices.size === 1 && (
        <div className="flex items-center gap-3 bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] p-3 rounded-lg sticky top-14 z-20">
          <span className="text-sm font-medium text-[var(--ui-support-text-icon-support-info)]">
            1 device selected
          </span>
          <Button type="default" label="Clear" onClick={() => setSelectedDevices(new Set())} />
          <Button
            type="primary"
            label="Edit device →"
            onClick={() => {
              const deviceId = Array.from(selectedDevices)[0];
              const device = filteredDevices.find((d) => d.id === deviceId);
              if (device) {
                setSelectedDevice(device);
                setSelectedDevices(new Set());
              }
            }}
          />
          <Button type="primary" danger label="Return selected →" onClick={() => setShowBulkReturn(true)} />
          <Button
            type="default"
            label="Archive selected"
            onClick={() => {
              const ids = Array.from(selectedDevices);
              ids.forEach((id) => {
                updateDevice(id, { status: 'deactivated' as DeviceStatus, deactivated: true });
                addHistoryEntry({ id: crypto.randomUUID(), deviceId: id, timestamp: new Date().toISOString(), action: 'archived', user: 'Admin', description: 'Device archived' });
              });
              setSelectedDevices(new Set());
            }}
          />
        </div>
      )}
      {canEdit() && selectedDevices.size > 1 && (
        <div className="flex items-center gap-3 bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] p-3 rounded-lg sticky top-14 z-20">
          <span className="text-sm font-medium text-[var(--ui-support-text-icon-support-info)]">
            {selectedDevices.size} device(s) selected
          </span>
          <Button type="default" label="Clear" onClick={() => setSelectedDevices(new Set())} />
          <Button type="primary" danger label="Return selected →" onClick={() => setShowBulkReturn(true)} />
          <Button
            type="default"
            label="Archive selected"
            onClick={() => {
              const ids = Array.from(selectedDevices);
              ids.forEach((id) => {
                updateDevice(id, { status: 'deactivated' as DeviceStatus, deactivated: true });
                addHistoryEntry({ id: crypto.randomUUID(), deviceId: id, timestamp: new Date().toISOString(), action: 'archived', user: 'Admin', description: 'Device archived' });
              });
              setSelectedDevices(new Set());
            }}
          />
        </div>
      )}

      {/* Table — grouped by program */}
      {(() => {
        const grouped: Record<string, typeof filteredDevices> = {};
        filteredDevices.forEach((d) => {
          const prog = d.program || 'unassigned';
          if (!grouped[prog]) grouped[prog] = [];
          grouped[prog].push(d);
        });
        const programOrder = ['beta', 'dogfood', 'prq', 'pvt', 'evt', 'dvt', 'other', 'unassigned'];
        const programs = programOrder.filter((p) => grouped[p]);
        const missingProgram = grouped['unassigned'] || [];

        return (
          <>
            {/* Warning for devices missing program */}
            {missingProgram.length > 0 && (
              <div className="bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--ui-core-red-red-6)]">⚠️</span>
                  <span className="text-xs font-semibold text-[var(--ui-support-text-support-error)]">{missingProgram.length} device(s) have no program assigned</span>
                </div>
                <p className="text-xs text-[var(--ui-support-text-support-error)] mt-1">Update them in the device detail or re-import with the Program column.</p>
              </div>
            )}

            {programs.map((prog) => (
              <ProgramDeviceGroup
                key={prog}
                prog={prog}
                rows={grouped[prog]}
                selectedDevices={selectedDevices}
                setSelectedDevices={setSelectedDevices}
                toggleSelect={toggleSelect}
                onSelectDevice={setSelectedDevice}
              />
            ))}

            {filteredDevices.length === 0 && (
              <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-12 text-center text-[var(--ui-text-text-tertiary)]">
                <Monitor size={48} className="mx-auto mb-3 text-[var(--ui-text-text-disabled)]" />
                <p className="font-medium">No devices found</p>
                <p className="text-sm mt-1">Try adjusting your filters or add devices via Import</p>
              </div>
            )}

            <div className="px-4 py-3 bg-[var(--ui-background-layer-layer-page-hover)] rounded-lg text-sm text-[var(--ui-text-text-tertiary)]">
              Showing {filteredDevices.length} of {devices.length} devices
            </div>
          </>
        );
      })()}

      {/* Detail Panel */}
      {selectedDevice && (
        <DeviceDetailPanel device={selectedDevice} onClose={() => setSelectedDevice(null)} onNavigateToPerson={onNavigateToPerson} />
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

// One program container — full-width table with its own pagination (long
// containers like the Merci beta fleet can run 70+ rows).
function ProgramDeviceGroup({ prog, rows, selectedDevices, setSelectedDevices, toggleSelect, onSelectDevice }: {
  prog: string;
  rows: Device[];
  selectedDevices: Set<string>;
  setSelectedDevices: (s: Set<string>) => void;
  toggleSelect: (id: string) => void;
  onSelectDevice: (d: Device) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const paged = rows.slice((current - 1) * pageSize, (current - 1) * pageSize + pageSize);
  const label = prog === 'unassigned' ? '⚠️ No Program' : `${rows[0]?.product ? rows[0].product + ' ' : ''}${prog.toUpperCase()}`;

  return (
    <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden mb-4">
      <div className="px-4 py-4 bg-[var(--ui-background-layer-layer-page-hover)] border-b border-[var(--ui-background-layer-border-border-layer-page)] flex items-center gap-3">
        <Tag color={prog === 'unassigned' ? 'red' : 'periwinkle'} size="regular">{label}</Tag>
        <span className="text-xs text-[var(--ui-text-text-placeholder)]">{rows.length} device(s)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--ui-background-layer-border-border-layer-page)]">
              <th className="px-4 py-2 text-left w-8">
                <Checkbox
                  checked={rows.every((d) => selectedDevices.has(d.id))}
                  onChange={() => { const ids = rows.map((d) => d.id); const allSelected = ids.every((id) => selectedDevices.has(id)); const next = new Set(selectedDevices); if (allSelected) { ids.forEach((id) => next.delete(id)); } else { ids.forEach((id) => next.add(id)); } setSelectedDevices(next); }}
                />
              </th>
              <th className="px-4 py-2 text-left font-semibold text-[var(--ui-text-text-tertiary)] uppercase text-xs">Serial Number</th>
              <th className="px-4 py-2 text-left font-semibold text-[var(--ui-text-text-tertiary)] uppercase text-xs">Internal Name</th>
              <th className="px-4 py-2 text-left font-semibold text-[var(--ui-text-text-tertiary)] uppercase text-xs">Phase</th>
              <th className="px-4 py-2 text-left font-semibold text-[var(--ui-text-text-tertiary)] uppercase text-xs">Firmware</th>
              <th className="px-4 py-2 text-left font-semibold text-[var(--ui-text-text-tertiary)] uppercase text-xs">Assigned To</th>
              <th className="px-4 py-2 text-left font-semibold text-[var(--ui-text-text-tertiary)] uppercase text-xs">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
            {paged.map((device) => (
              <tr key={device.id} className="hover:bg-[var(--ui-background-layer-layer-page-hover)] transition-colors cursor-pointer" onClick={() => onSelectDevice(device)}>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedDevices.has(device.id)} onChange={() => toggleSelect(device.id)} />
                </td>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  {device.network ? (
                    <a href={`https://insight.eero.com/networks/${device.network}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-medium text-[var(--ui-core-periwinkle-periwinkle-7)] hover:underline" title="Open this device's network in Insight">{device.serialNumber} ↗</a>
                  ) : (
                    <span className="font-mono text-xs font-medium text-[var(--ui-core-periwinkle-periwinkle-7)]" title="No network yet — device not online in Insight">{device.serialNumber}</span>
                  )}
                  {device.network && (
                    <div>
                      <a href={`https://admin.e2ro.com/networks/${device.network}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--ui-text-text-tertiary)] hover:underline hover:text-[var(--ui-core-periwinkle-periwinkle-6)]" title="Open this network in Admin">Admin ↗</a>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-[var(--ui-text-text-secondary)]">{device.internalName}</td>
                <td className="px-4 py-4 text-[var(--ui-text-text-secondary)]">{device.program?.toUpperCase() || '—'}</td>
                <td className="px-4 py-4 font-mono text-xs">{device.firmwareVersion || '—'}</td>
                <td className="px-4 py-4 text-[var(--ui-text-text-secondary)]">{device.assignedTo || device.checkedOutTo || '—'}</td>
                <td className="px-4 py-4"><StatusBadge status={device.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize && (
        <div className="border-t border-[var(--ui-background-layer-border-border-layer-page)] px-4 py-2">
          <Pagination
            pagination={{ totalItems: rows.length, totalPages, hasPreviousPage: current > 1, hasNextPage: current < totalPages }}
            currentPage={current}
            pageSize={pageSize}
            onPageChange={setPage}
            onNextPage={() => setPage((n) => Math.min(totalPages, n + 1))}
            onPreviousPage={() => setPage((n) => Math.max(1, n - 1))}
            onPageSizeChange={() => { /* fixed page size for device containers */ }}
            pageSizeOptions={[{ value: 15, label: '15' }]}
            ln10_label={{ prevBtn: 'Previous', nextBtn: 'Next', pageBtn: 'Page', itemsPerPage: 'Per page', counter: (s, e, t) => `Showing ${s}–${e} of ${t}` }}
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  const c = getStatusBadge(status);
  return (
    <Tag color={c.color} size="regular" showIcon>
      {c.label}
    </Tag>
  );
}
