'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
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
  badgeColor?: string;
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
          badgeColor: d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
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
          badgeColor: 'bg-gray-100 text-gray-600',
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
          badgeColor: 'bg-blue-100 text-blue-700',
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
          badgeColor: 'bg-orange-100 text-orange-700',
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
          badgeColor: 'bg-gray-100 text-gray-600',
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
          badgeColor: s.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700',
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
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search size={20} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search devices, people, programs, shipments..."
              className="flex-1 text-base outline-none placeholder:text-gray-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-[450px] overflow-y-auto p-2">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{result.title}</p>
                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      {result.badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${result.badgeColor}`}>
                          {result.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">Try searching by serial number, name, email, or program</p>
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-gray-400 text-sm">
              <p>Search across all devices, people, archived programs, and shipments</p>
              <p className="text-xs mt-2 text-gray-300">Includes deactivated devices and opted-out testers</p>
            </div>
          )}
        </div>
      </div>

      {/* Device Detail Panel (opens when clicking a device result) */}
      {viewDevice && <DeviceDetailPanel device={viewDevice} onClose={() => setViewDevice(null)} />}
    </>
  );
}
