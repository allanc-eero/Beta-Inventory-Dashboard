'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, Tag, Input } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { Device } from '@/types';
import DeviceDetailPanel from './DeviceDetailPanel';

interface SearchModalProps {
  onClose: () => void;
}

type ResultType = 'device' | 'device_archived' | 'person' | 'person_opted_out' | 'program_archived' | 'shipment';

type SearchResult = {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'grey' | 'green' | 'orange' | 'periwinkle' | 'red' | 'yellow' | 'navy';
  device?: Device;
};

export default function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [viewDevice, setViewDevice] = useState<Device | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { devices, getClosedPrograms, getOptOuts, shipments } = useDeviceStore();

  const closedPrograms = getClosedPrograms();
  const optOuts = getOptOuts();

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const all: SearchResult[] = [];

    // Active devices
    devices
      .filter((d) => d.status !== 'deactivated')
      .filter((d) =>
        d.serialNumber.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.internalName?.toLowerCase().includes(q) ||
        d.assignedTo?.toLowerCase().includes(q) ||
        d.assignedEmail?.toLowerCase().includes(q) ||
        d.mac?.toLowerCase().includes(q) ||
        d.country?.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .forEach((d) => {
        all.push({
          type: 'device',
          id: d.id,
          title: d.serialNumber,
          subtitle: `${d.model} · ${d.assignedTo || d.assignedEmail || 'Unassigned'}`,
          badge: d.status === 'online' ? 'Online' : 'Not Online',
          badgeColor: d.status === 'online' ? 'green' : 'orange',
          device: d,
        });
      });

    // Archived/deactivated devices
    devices
      .filter((d) => d.status === 'deactivated')
      .filter((d) =>
        d.serialNumber.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.assignedTo?.toLowerCase().includes(q) ||
        d.assignedEmail?.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .forEach((d) => {
        all.push({
          type: 'device_archived',
          id: d.id,
          title: d.serialNumber,
          subtitle: `${d.model} · ${d.assignedTo || d.assignedEmail || 'Unassigned'}`,
          badge: 'Archived',
          badgeColor: 'grey',
          device: d,
        });
      });

    // Active people (derived from devices)
    const personMap = new Map<string, { name: string; email: string; deviceCount: number }>();
    devices.forEach((d) => {
      const email = d.assignedEmail?.toLowerCase();
      const name = d.assignedTo || d.checkedOutTo;
      if (email || name) {
        const key = email || name.toLowerCase();
        if (!personMap.has(key)) personMap.set(key, { name: name || email || '', email: email || '', deviceCount: 0 });
        personMap.get(key)!.deviceCount++;
      }
    });

    Array.from(personMap.values())
      .filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((p) => {
        all.push({
          type: 'person',
          id: p.email,
          title: p.name,
          subtitle: p.email,
          badge: `${p.deviceCount} device(s)`,
          badgeColor: 'periwinkle',
        });
      });

    // Opted-out people
    optOuts
      .filter((o) => o.personName.toLowerCase().includes(q) || o.personEmail.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((o) => {
        all.push({
          type: 'person_opted_out',
          id: o.id,
          title: o.personName,
          subtitle: o.personEmail,
          badge: 'Opted Out',
          badgeColor: 'orange',
        });
      });

    // Closed/archived programs
    closedPrograms
      .filter((cp) => cp.program.toLowerCase().includes(q) || cp.actions.some((a) => a.serial.toLowerCase().includes(q)))
      .slice(0, 3)
      .forEach((cp) => {
        all.push({
          type: 'program_archived',
          id: cp.id,
          title: `Program: ${cp.program}`,
          subtitle: `Closed ${new Date(cp.closedAt).toLocaleDateString()} · ${cp.totalDevices} devices`,
          badge: 'Archived',
          badgeColor: 'grey',
        });
      });

    // Shipments
    shipments
      .filter((s) =>
        s.serials.some((sn) => sn.toLowerCase().includes(q)) ||
        s.fileName?.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .forEach((s) => {
        all.push({
          type: 'shipment',
          id: s.id,
          title: s.fileName || `Shipment ${new Date(s.createdAt).toLocaleDateString()}`,
          subtitle: `${s.serials.length} devices · ${s.carrier} · ${s.origin || ''} → ${s.destination}`,
          badge: s.status === 'in_transit' ? 'In Transit' : 'Delivered',
          badgeColor: s.status === 'in_transit' ? 'periwinkle' : 'green',
        });
      });

    return all;
  }, [query, devices, closedPrograms, optOuts, shipments]);

  const typeLabels: Record<ResultType, string> = {
    device: '📱 Devices',
    device_archived: '📦 Archived Devices',
    person: '👤 People',
    person_opted_out: '👤 Opted Out',
    program_archived: '📋 Archived Programs',
    shipment: '🚚 Shipments',
  };

  // Group results by type
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  return (
    <>
      <Modal isOpen title="Search" onCancel={onClose} hideFooter>
        {/* Search input */}
        <div className="mb-4">
          <Input
            id="global-search"
            ref={inputRef}
            placeholder="Search devices, people, programs, shipments..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[450px] overflow-y-auto">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="mb-3">
                <p className="text-xs font-semibold text-[var(--ui-text-text-placeholder)] uppercase tracking-wider px-1 py-1">
                  {typeLabels[type as ResultType]} ({items.length})
                </p>
                {items.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      if (result.device) {
                        setViewDevice(result.device);
                        onClose();
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--ui-background-layer-layer-page-hover)] transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--ui-text-text-primary)] truncate">{result.title}</p>
                      <p className="text-xs text-[var(--ui-text-text-tertiary)] truncate">{result.subtitle}</p>
                    </div>
                    {result.badge && (
                      <Tag color={result.badgeColor || 'grey'} size="regular">
                        {result.badge}
                      </Tag>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-8 text-center text-[var(--ui-text-text-tertiary)]">
            <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-[var(--ui-text-text-placeholder)] mt-1">Try searching by serial number, name, email, or program</p>
          </div>
        )}

        {!query && (
          <div className="p-6 text-center text-[var(--ui-text-text-placeholder)] text-sm">
            <p>Search across all devices, people, archived programs, and shipments</p>
            <p className="text-xs mt-2 text-[var(--ui-text-text-disabled)]">Includes deactivated devices and opted-out testers</p>
          </div>
        )}
      </Modal>

      {/* Device Detail Panel (opens when clicking a device result) */}
      {viewDevice && <DeviceDetailPanel device={viewDevice} onClose={() => setViewDevice(null)} />}
    </>
  );
}
