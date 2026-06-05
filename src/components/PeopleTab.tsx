'use client';

import { useState, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Search, Plus, Monitor } from 'lucide-react';
import { OptOutReason, OptOutRecord, Device } from '@/types';
import DeviceDetailPanel from './DeviceDetailPanel';
import OptBackInChecklistPanel from './OptBackInChecklistPanel';
import { useAuthStore } from '@/store/authStore';

const OPT_OUT_REASONS: { value: OptOutReason; label: string }[] = [
  { value: 'no_longer_interested', label: 'No longer interested in testing' },
  { value: 'moving', label: 'Moving / relocating' },
  { value: 'device_issues', label: 'Too many device issues' },
  { value: 'time_constraints', label: 'Time constraints' },
  { value: 'other', label: 'Other' },
];

export default function PeopleTab({ initialSelectedPerson, onClearSelection }: { initialSelectedPerson?: string | null; onClearSelection?: () => void }) {
  const { devices, people, addPerson, addOptOut, getOptOuts, removeOptOut, getTesterProfile, findDuplicateProfiles, mergeProfiles, upsertTesterProfile } = useDeviceStore();
  const { canEdit, currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(initialSelectedPerson || null);
  const [newPerson, setNewPerson] = useState({ name: '', email: '', team: '' });
  const [showOptOut, setShowOptOut] = useState(false);
  const [optOutReason, setOptOutReason] = useState<OptOutReason>('no_longer_interested');
  const [optOutNotes, setOptOutNotes] = useState('');
  const [optOutAdminDone, setOptOutAdminDone] = useState(false);
  const [optOutQualtricsDone, setOptOutQualtricsDone] = useState(false);
  const [optOutQualtricsStatus, setOptOutQualtricsStatus] = useState('');
  const [optOutDevicesDone, setOptOutDevicesDone] = useState(false);
  const [activeView, setActiveView] = useState<'active' | 'opted_out'>('active');
  const [viewDevice, setViewDevice] = useState<Device | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [pendingNewPerson, setPendingNewPerson] = useState<{ name: string; email: string; team: string } | null>(null);
  const [optBackInRecord, setOptBackInRecord] = useState<OptOutRecord | null>(null);

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

    // Check for duplicate profiles
    const duplicates = findDuplicateProfiles(newPerson.name, newPerson.email);
    if (duplicates.length > 0) {
      setDuplicateMatches(duplicates);
      setPendingNewPerson(newPerson);
      return;
    }

    // No duplicates — create new
    addPerson({ id: crypto.randomUUID(), name: newPerson.name, email: newPerson.email, team: newPerson.team, devices: [] });
    upsertTesterProfile({ email: newPerson.email, name: newPerson.name, programs: [] });
    setNewPerson({ name: '', email: '', team: '' });
    setShowAdd(false);
  };

  const handleMergeIntoExisting = (targetId: string) => {
    if (!pendingNewPerson) return;
    mergeProfiles(targetId, pendingNewPerson.email);
    setDuplicateMatches([]);
    setPendingNewPerson(null);
    setNewPerson({ name: '', email: '', team: '' });
    setShowAdd(false);
  };

  const handleCreateAnyway = () => {
    if (!pendingNewPerson) return;
    addPerson({ id: crypto.randomUUID(), name: pendingNewPerson.name, email: pendingNewPerson.email, team: pendingNewPerson.team, devices: [] });
    upsertTesterProfile({ email: pendingNewPerson.email, name: pendingNewPerson.name, programs: [] });
    setDuplicateMatches([]);
    setPendingNewPerson(null);
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
    setOptOutAdminDone(false);
    setOptOutQualtricsDone(false);
    setOptOutQualtricsStatus('');
    setOptOutDevicesDone(false);
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
            {canEdit() && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Person
              </button>
            )}
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
                        {(() => { const p = getTesterProfile(person.email); return p?.testerId ? <p className="text-xs text-gray-400 font-mono">{p.testerId}</p> : null; })()}
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
                    {canEdit() && (
                      <button
                        onClick={() => setOptBackInRecord(record)}
                        className="mt-3 px-4 py-1.5 text-xs font-medium text-green-700 border border-green-300 rounded-md hover:bg-green-50"
                      >
                        ✓ Opt Back In
                      </button>
                    )}
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
          /* Person Detail View — Expanded Profile */
          <div className="space-y-4">
            <button
              onClick={() => setSelectedPerson(null)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← All people
            </button>

            {(() => {
              const profile = getTesterProfile(selectedPerson || '');
              const personName = profile?.name || selectedPersonDevices[0]?.assignedTo || selectedPerson;
              const activePrograms = [...new Set(selectedPersonDevices.filter((d) => d.status !== 'deactivated').map((d) => d.program))];

              return (
                <>
                  {/* Profile Header */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-bold text-lg">
                            {(personName || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">{personName}</h2>
                            {profile?.testerId && (
                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{profile.testerId}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {selectedPersonDevices.length} device(s) · {selectedPersonDevices.filter((d) => d.status === 'online').length} online · {selectedPersonDevices.filter((d) => d.status === 'deactivated').length} archived
                          </p>
                        </div>
                      </div>
                      {canEdit() && (
                        <button
                          onClick={() => setShowOptOut(true)}
                          className="px-4 py-2 text-sm font-medium text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50"
                        >
                          Record Opt-Out
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profile Details — Two Column */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Contact & Identity */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">Contact & Identity</h4>
                      <div className="space-y-2.5">
                        <ProfileField label="PRIMARY EMAIL" value={profile?.email || selectedPerson || ''} />
                        <ProfileField label="CONTACT EMAIL" value={profile?.contactEmail || ''} />
                        <ProfileField label="ALTERNATE EMAIL" value={profile?.alternateEmail || ''} />
                        {(profile?.additionalEmails || []).length > 0 && (
                          <div className="flex items-baseline gap-3">
                            <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">OTHER EMAILS</span>
                            <div className="flex flex-wrap gap-1">
                              {profile!.additionalEmails.map((e) => (
                                <span key={e} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{e}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <ProfileField label="COUNTRY" value={profile?.country || selectedPersonDevices[0]?.country || ''} />
                        <ProfileField label="LOCATION" value={profile?.location || selectedPersonDevices[0]?.location || ''} />
                      </div>
                    </div>

                    {/* Programs & Network */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">Programs & Network</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-baseline gap-3">
                          <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">ACTIVE PROGRAMS</span>
                          <div className="flex flex-wrap gap-1">
                            {activePrograms.length > 0 ? activePrograms.map((p) => (
                              <span key={p} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{p}</span>
                            )) : <span className="text-sm text-gray-400">None</span>}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">ALL PROGRAMS</span>
                          <div className="flex flex-wrap gap-1">
                            {(profile?.programs || []).map((p) => (
                              <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p}</span>
                            ))}
                          </div>
                        </div>
                        {profile?.networkId ? (
                          <div className="flex items-baseline gap-3">
                            <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">INSIGHT NETWORK</span>
                            <a href={`https://insight.eero.com/eeros/${profile.networkId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">{profile.networkId} ↗</a>
                          </div>
                        ) : (
                          <ProfileField label="INSIGHT NETWORK" value="" />
                        )}
                        {profile?.adminId ? (
                          <div className="flex items-baseline gap-3">
                            <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">ADMIN ID</span>
                            <a href={`https://admin.e2ro.com/users/${profile.adminId.replace(/^UID0*/, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">{profile.adminId} ↗</a>
                          </div>
                        ) : (
                          <ProfileField label="ADMIN ID" value="" />
                        )}
                        <ProfileField label="INTERNET SPEED" value={profile?.internetSpeed || ''} />
                        {profile?.testerId && <ProfileField label="TESTER ID" value={profile.testerId} />}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Opt-Out Form */}
            {showOptOut && (
              <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Record Tester Opt-Out</h4>
                <p className="text-xs text-gray-500 mb-4">Complete all offboarding steps below, then confirm. This person will be moved to the "Opted Out" list.</p>
                <div className="space-y-4">
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

                  {/* Offboarding checklist — manual steps only */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Offboarding Steps (required)</h5>
                    <div className="space-y-2.5">
                      <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
                        <input type="checkbox" checked={optOutAdminDone} onChange={(e) => setOptOutAdminDone(e.target.checked)} className="rounded border-gray-300 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-gray-900 font-medium">Removed from eero Admin</span>
                          <p className="text-xs text-gray-500">Reverted to default user role in admin panel</p>
                        </div>
                        {(() => { const p = getTesterProfile(selectedPerson || ''); const aid = p?.adminId || ''; const nid = p?.networkId || ''; const link = aid ? `https://admin.e2ro.com/users/${aid.replace(/^UID0*/, '')}` : nid ? `https://insight.eero.com/eeros/${nid}` : ''; return link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0">Open Admin ↗</a> : null; })()}
                      </label>
                      <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
                        <input type="checkbox" checked={optOutDevicesDone} onChange={(e) => setOptOutDevicesDone(e.target.checked)} className="rounded border-gray-300 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-gray-900 font-medium">Devices offboarded</span>
                          <p className="text-xs text-gray-500">All devices returned, deactivated, or reassigned</p>
                        </div>
                      </label>
                      {/* Qualtrics — automated, shown as status */}
                      <div className="flex items-start gap-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex-shrink-0 mt-0.5 text-blue-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm text-blue-800 font-medium">Qualtrics opt-out</span>
                          <p className="text-xs text-blue-600">Handled automatically when you confirm — no action needed</p>
                          {optOutQualtricsStatus && <p className={`text-xs mt-1 font-medium ${optOutQualtricsStatus.startsWith('✓') ? 'text-green-600' : 'text-orange-600'}`}>{optOutQualtricsStatus}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowOptOut(false); setOptOutAdminDone(false); setOptOutQualtricsDone(false); setOptOutQualtricsStatus(''); setOptOutDevicesDone(false); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button
                      onClick={async () => {
                        // Auto-trigger Qualtrics opt-out
                        try {
                          const person = derivedPeople.find((p) => p.email.toLowerCase() === selectedPerson?.toLowerCase() || p.name.toLowerCase() === selectedPerson?.toLowerCase());
                          if (person?.email) {
                            const res = await fetch('/api/qualtrics', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'optOut', email: person.email, reason: optOutReason, optOutDate: new Date().toISOString(), recordedBy: currentUser?.name || 'Admin' }),
                            });
                            const data = await res.json();
                            setOptOutQualtricsStatus(data.success ? '✓ Opted out of Qualtrics directory' : `⚠ ${data.error?.slice(0, 80) || 'Manual action needed'}`);
                          }
                        } catch { setOptOutQualtricsStatus('⚠ API call failed'); }
                        // Proceed with opt-out regardless
                        handleOptOut();
                      }}
                      disabled={!optOutAdminDone || !optOutDevicesDone}
                      className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {optOutAdminDone && optOutDevicesDone ? 'Confirm Opt-Out' : `Complete ${2 - [optOutAdminDone, optOutDevicesDone].filter(Boolean).length} step(s) first`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Person's Devices Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <h4 className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                Devices ({selectedPersonDevices.length})
              </h4>
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

      {/* Duplicate Detection Modal */}
      {duplicateMatches.length > 0 && pendingNewPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setDuplicateMatches([]); setPendingNewPerson(null); }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">⚠️ Possible Duplicate Detected</h3>
            <p className="text-sm text-gray-500 mb-4">
              We found existing profiles that might be the same person as "<strong>{pendingNewPerson.name}</strong>" ({pendingNewPerson.email}). Would you like to merge into an existing profile or create a new one?
            </p>
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
              {duplicateMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{match.name}</p>
                    <p className="text-xs text-gray-500">{match.email} {match.testerId && `· ${match.testerId}`}</p>
                  </div>
                  <button
                    onClick={() => handleMergeIntoExisting(match.id)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    Merge Into This Profile
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDuplicateMatches([]); setPendingNewPerson(null); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateAnyway} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900">Create New Profile Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Device Detail Panel */}
      {viewDevice && <DeviceDetailPanel device={viewDevice} onClose={() => setViewDevice(null)} />}

      {/* Opt Back In Checklist */}
      {optBackInRecord && (
        <OptBackInChecklistPanel
          record={optBackInRecord}
          onComplete={() => setOptBackInRecord(null)}
          onCancel={() => setOptBackInRecord(null)}
        />
      )}
    </>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs text-gray-500 uppercase w-36 shrink-0 font-medium">{label}</span>
      <span className="text-sm text-gray-900">{value || '—'}</span>
    </div>
  );
}
