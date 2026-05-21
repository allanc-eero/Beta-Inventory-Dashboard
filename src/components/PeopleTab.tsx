'use client';

import { useState, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Search, Plus, Monitor } from 'lucide-react';
import { OptOutReason, Device } from '@/types';
import DeviceDetailPanel from './DeviceDetailPanel';

const OPT_OUT_REASONS: { value: OptOutReason; label: string }[] = [
  { value: 'no_longer_interested', label: 'No longer interested in testing' },
  { value: 'moving', label: 'Moving / relocating' },
  { value: 'device_issues', label: 'Too many device issues' },
  { value: 'time_constraints', label: 'Time constraints' },
  { value: 'other', label: 'Other' },
];

export default function PeopleTab() {
  const { devices, people, addPerson, addOptOut, getOptOuts } = useDeviceStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [newPerson, setNewPerson] = useState({ name: '', email: '', team: '' });
  const [showOptOut, setShowOptOut] = useState(false);
  const [optOutReason, setOptOutReason] = useState<OptOutReason>('no_longer_interested');
  const [optOutNotes, setOptOutNotes] = useState('');
  const [activeView, setActiveView] = useState<'active' | 'opted_out'>('active');
  const [viewDevice, setViewDevice] = useState<Device | null>(null);

  const optOuts = getOptOuts();
  const optedOutEmails = new Set(optOuts.map((o) => o.personEmail.toLowerCase()));

  // Derive people from device assignments — deduplicated by email (master key)
  const derivedPeople = useMemo(() => {
    const personMap = new Map<string, { name: string; email: string; devices: typeof devices }>();

    devices.forEach((d) => {
      const email = d.assignedEmail?.toLowerCase().trim();
      const name = d.assignedTo || d.checkedOutTo;
      if (!email && !name) return;

      const key = email || name.toLowerCase().trim();

      if (!personMap.has(key)) {
        personMap.set(key, { name: name || email || '', email: email || '', devices: [] });
      } else {
        const existing = personMap.get(key)!;
        if (name && name.includes(' ') && !existing.name.includes(' ')) {
          existing.name = name;
        }
      }
      personMap.get(key)!.devices.push(d);
    });

    people.forEach((p) => {
      const key = p.email.toLowerCase();
      if (!personMap.has(key)) {
        personMap.set(key, { name: p.name, email: p.email, devices: [] });
      }
    });

    return Array.from(personMap.values());
  }, [devices, people]);

  const filteredPeople = useMemo(() => {
    if (!search) return derivedPeople;
    const q = search.toLowerCase();
    return derivedPeople.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [derivedPeople, search]);

  const selectedPersonDevices = useMemo(() => {
    if (!selectedPerson) return [];
    const key = selectedPerson.toLowerCase();
    return devices.filter(
      (d) =>
        d.assignedEmail?.toLowerCase() === key ||
        d.assignedTo?.toLowerCase() === key ||
        d.checkedOutTo?.toLowerCase() === key
    );
  }, [devices, selectedPerson]);

  const handleAdd = () => {
    if (!newPerson.name || !newPerson.email) return;
    addPerson({
      id: crypto.randomUUID(),
      name: newPerson.name,
      email: newPerson.email,
      team: newPerson.team,
      devices: [],
    });
    setNewPerson({ name: '', email: '', team: '' });
    setShowAdd(false);
  };

  const handleOptOut = () => {
    const person = derivedPeople.find(
      (p) => p.email.toLowerCase() === selectedPerson?.toLowerCase() || p.name.toLowerCase() === selectedPerson?.toLowerCase()
    );
    if (!person) return;

    addOptOut({
      id: crypto.randomUUID(),
      personEmail: person.email,
      personName: person.name,
      reason: optOutReason,
      notes: optOutNotes,
      optOutDate: new Date().toISOString(),
      recordedBy: 'Admin',
      program: selectedPersonDevices[0]?.program || 'unknown',
      devicesAtOptOut: selectedPersonDevices.map((d) => d.serialNumber),
    });

    setShowOptOut(false);
    setOptOutReason('no_longer_interested');
    setOptOutNotes('');
    setSelectedPerson(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-700';
      case 'deactivated': return 'bg-gray-100 text-gray-600';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">People</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeView === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >
                Active ({derivedPeople.filter((p) => !optedOutEmails.has(p.email.toLowerCase())).length})
              </button>
              <button
                onClick={() => setActiveView('opted_out')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeView === 'opted_out' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >
                Opted Out ({optOuts.length})
              </button>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Person
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Add Person Form */}
        {showAdd && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              <input type="text" placeholder="Full name" value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email" value={newPerson.email} onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Team" value={newPerson.team} onChange={(e) => setNewPerson({ ...newPerson, team: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!selectedPerson ? (
          <>
            {/* Active People */}
            {activeView === 'active' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPeople.filter((p) => !optedOutEmails.has(p.email.toLowerCase())).map((person) => (
                  <div
                    key={person.email || person.name}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedPerson(person.email || person.name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-semibold text-sm">
                          {person.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{person.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                      <Monitor size={14} />
                      <span>{person.devices.length} device(s)</span>
                      {person.devices.some((d) => d.status === 'deactivated') && (
                        <span className="text-xs text-gray-400">· {person.devices.filter((d) => d.status === 'deactivated').length} archived</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Opted Out People */}
            {activeView === 'opted_out' && (
              <div className="space-y-3">
                {optOuts.length > 0 ? optOuts.map((record) => (
                  <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 font-semibold text-sm">
                            {record.personName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{record.personName}</h3>
                          <p className="text-xs text-gray-500">{record.personEmail}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Opted Out</span>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-gray-600">
                      <p><span className="font-medium text-gray-700">Reason:</span> {OPT_OUT_REASONS.find((r) => r.value === record.reason)?.label || record.reason}</p>
                      {record.notes && <p><span className="font-medium text-gray-700">Notes:</span> {record.notes}</p>}
                      <p><span className="font-medium text-gray-700">Date:</span> {new Date(record.optOutDate).toLocaleDateString()}</p>
                      <p><span className="font-medium text-gray-700">Recorded by:</span> {record.recordedBy}</p>
                      <p><span className="font-medium text-gray-700">Program:</span> {record.program}</p>
                      {record.devicesAtOptOut.length > 0 && (
                        <p><span className="font-medium text-gray-700">Devices at opt-out:</span> {record.devicesAtOptOut.join(', ')}</p>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <p className="text-gray-400 text-sm">No testers have opted out</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Person Detail View */
          <div className="space-y-4">
            <button
              onClick={() => setSelectedPerson(null)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← All people
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedPerson}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPersonDevices.length} device(s) · {selectedPersonDevices.filter((d) => d.status === 'online').length} online · {selectedPersonDevices.filter((d) => d.status === 'deactivated').length} archived
                  </p>
                </div>
                <button
                  onClick={() => setShowOptOut(true)}
                  className="px-4 py-2 text-sm font-medium text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50"
                >
                  Record Opt-Out
                </button>
              </div>
            </div>

            {/* Opt-Out Form */}
            {showOptOut && (
              <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Record Tester Opt-Out</h4>
                <p className="text-xs text-gray-500 mb-4">This person will be moved to the "Opted Out" list. Their data and device history are preserved.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                    <select value={optOutReason} onChange={(e) => setOptOutReason(e.target.value as OptOutReason)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      {OPT_OUT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <textarea value={optOutNotes} onChange={(e) => setOptOutNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20" placeholder="Additional context..." />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowOptOut(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleOptOut} className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700">Confirm Opt-Out</button>
                  </div>
                </div>
              </div>
            )}

            {/* Person's Devices Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serial</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedPersonDevices.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50/50 cursor-pointer" onClick={() => setViewDevice(d)}>
                      <td className="px-4 py-2 font-mono text-xs text-blue-700">{d.serialNumber}</td>
                      <td className="px-4 py-2">{d.model}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{d.program}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(d.status)}`}>
                          {d.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{d.country || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Device Detail Panel */}
      {viewDevice && <DeviceDetailPanel device={viewDevice} onClose={() => setViewDevice(null)} />}
    </>
  );
}
