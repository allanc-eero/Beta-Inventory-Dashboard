'use client';

import { useState, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Plus, Monitor } from 'lucide-react';
import { OptOutReason, OptOutRecord, Device } from '@/types';
import { Segmented, Input, TextArea, Select, Button, Tag, Checkbox, Modal } from '@amzn/eero-web-design-components';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import DeviceDetailPanel from './DeviceDetailPanel';
import OptBackInChecklistPanel from './OptBackInChecklistPanel';
import OptOutChecklistPanel from './OptOutChecklistPanel';
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

  const getStatusTagColor = (status: string): 'green' | 'grey' | 'orange' => {
    switch (status) {
      case 'online': return 'green';
      case 'deactivated': return 'grey';
      default: return 'orange';
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--ui-text-text-primary)]">People</h2>
          <div className="flex items-center gap-3">
            <Segmented
              value={activeView}
              onChange={(val) => setActiveView(val as 'active' | 'opted_out')}
              items={[
                { label: `Active (${derivedPeople.filter((p) => !optedOutEmails.has(p.email.toLowerCase())).length})`, value: 'active' },
                { label: `Opted Out (${optOuts.length})`, value: 'opted_out' },
              ]}
            />
            {canEdit() && (
              <Button
                type="primary"
                ariaLabel="Add Person"
                onClick={() => setShowAdd(true)}
                label={<span className="flex items-center gap-1.5"><Plus size={16} /> Add Person</span>}
              />
            )}
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input
            id="people-search"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
          />
        </div>

        {/* Add Person Form */}
        {showAdd && (
          <div className="bg-[var(--ui-background-layer-layer-page)] p-4 rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)]">
            <div className="grid grid-cols-3 gap-3">
              <Input id="add-person-name" layout="vertical" placeholder="Full name" value={newPerson.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPerson({ ...newPerson, name: e.target.value })} />
              <Input id="add-person-email" layout="vertical" placeholder="Email" value={newPerson.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPerson({ ...newPerson, email: e.target.value })} />
              <Input id="add-person-team" layout="vertical" placeholder="Team" value={newPerson.team} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPerson({ ...newPerson, team: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button type="default" label="Cancel" onClick={() => setShowAdd(false)} />
              <Button type="primary" label="Add" onClick={handleAdd} />
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
                    className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-5 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedPerson(person.email || person.name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--ui-support-fill-support-success)] rounded-full flex items-center justify-center">
                        <span className="text-[var(--ui-support-text-support-success)] font-semibold text-sm">
                          {person.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--ui-text-text-primary)] truncate">{person.name}</h3>
                        <p className="text-xs text-[var(--ui-text-text-tertiary)] truncate">{person.email}</p>
                        {(() => { const p = getTesterProfile(person.email); return p?.testerId ? <p className="text-xs text-[var(--ui-text-text-placeholder)] font-mono">{p.testerId}</p> : null; })()}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-[var(--ui-text-text-tertiary)]">
                      <Monitor size={14} />
                      <span>{person.devices.length} device(s)</span>
                      {person.devices.some((d) => d.status === 'deactivated') && (
                        <span className="text-xs text-[var(--ui-text-text-placeholder)]">· {person.devices.filter((d) => d.status === 'deactivated').length} archived</span>
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
                  <div key={record.id} className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--ui-background-layer-layer-page-hover)] rounded-full flex items-center justify-center">
                          <span className="text-[var(--ui-text-text-tertiary)] font-semibold text-sm">
                            {record.personName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--ui-text-text-primary)]">{record.personName}</h3>
                          <p className="text-xs text-[var(--ui-text-text-tertiary)]">{record.personEmail}</p>
                        </div>
                      </div>
                      <Tag color="grey" size="regular">Opted Out</Tag>
                    </div>
                    {record.selfInitiated && (
                      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ui-support-text-icon-support-warning)] bg-[var(--ui-support-fill-support-warning)] border border-[var(--ui-support-border-support-warning)] px-2 py-1 rounded-md">
                        🙋 Self-requested from portal — needs offboarding
                      </div>
                    )}
                    <div className="mt-3 space-y-1 text-xs text-[var(--ui-text-text-tertiary)]">
                      <p><span className="font-medium text-[var(--ui-text-text-secondary)]">Reason:</span> {OPT_OUT_REASONS.find((r) => r.value === record.reason)?.label || record.reason}</p>
                      {record.notes && <p><span className="font-medium text-[var(--ui-text-text-secondary)]">Notes:</span> {record.notes}</p>}
                      <p><span className="font-medium text-[var(--ui-text-text-secondary)]">Date:</span> {new Date(record.optOutDate).toLocaleDateString()}</p>
                      <p><span className="font-medium text-[var(--ui-text-text-secondary)]">Recorded by:</span> {record.recordedBy}</p>
                      <p><span className="font-medium text-[var(--ui-text-text-secondary)]">Program:</span> {record.program}</p>
                      {record.devicesAtOptOut.length > 0 && (
                        <p><span className="font-medium text-[var(--ui-text-text-secondary)]">Devices at opt-out:</span> {record.devicesAtOptOut.join(', ')}</p>
                      )}
                    </div>

                    {/* Offboarding checklist (incl. network reset) */}
                    {canEdit() && <OptOutChecklistPanel record={record} />}

                    {canEdit() && (
                      <div className="mt-3">
                        <Button type="default" label="✓ Opt Back In" onClick={() => setOptBackInRecord(record)} />
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-12 text-center">
                    <p className="text-[var(--ui-text-text-placeholder)] text-sm">No testers have opted out</p>
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
              className="text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] text-sm font-medium"
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
                  <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[var(--ui-support-fill-support-success)] rounded-full flex items-center justify-center">
                          <span className="text-[var(--ui-support-text-support-success)] font-bold text-lg">
                            {(personName || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[var(--ui-text-text-primary)]">{personName}</h2>
                            {profile?.testerId && (
                              <span className="font-mono"><Tag color="grey" size="regular">{profile.testerId}</Tag></span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">
                            {selectedPersonDevices.length} device(s) · {selectedPersonDevices.filter((d) => d.status === 'online').length} online · {selectedPersonDevices.filter((d) => d.status === 'deactivated').length} archived
                          </p>
                        </div>
                      </div>
                      {canEdit() && (
                        <Button type="default" label="Record Opt-Out" onClick={() => setShowOptOut(true)} />
                      )}
                    </div>
                  </div>

                  {/* Profile Details — Two Column */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Contact & Identity */}
                    <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-5">
                      <h4 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider mb-3 border-b border-[var(--ui-background-layer-border-border-layer-page)] pb-2">Contact & Identity</h4>
                      <div className="space-y-2.5">
                        <ProfileField label="PRIMARY EMAIL" value={profile?.email || selectedPerson || ''} />
                        <ProfileField label="CONTACT EMAIL" value={profile?.contactEmail || ''} />
                        <ProfileField label="ALTERNATE EMAIL" value={profile?.alternateEmail || ''} />
                        {(profile?.additionalEmails || []).length > 0 && (
                          <div className="flex items-baseline gap-3">
                            <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">OTHER EMAILS</span>
                            <div className="flex flex-wrap gap-1">
                              {profile!.additionalEmails.map((e) => (
                                <Tag key={e} color="grey" size="regular">{e}</Tag>
                              ))}
                            </div>
                          </div>
                        )}
                        <ProfileField label="COUNTRY" value={profile?.country || selectedPersonDevices[0]?.country || ''} />
                        <ProfileField label="LOCATION" value={profile?.location || selectedPersonDevices[0]?.location || ''} />
                      </div>
                    </div>

                    {/* Programs & Network */}
                    <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-5">
                      <h4 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider mb-3 border-b border-[var(--ui-background-layer-border-border-layer-page)] pb-2">Programs & Network</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-baseline gap-3">
                          <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">ACTIVE PROGRAMS</span>
                          <div className="flex flex-wrap gap-1">
                            {activePrograms.length > 0 ? activePrograms.map((p) => (
                              <Tag key={p} color="periwinkle" size="regular">{p}</Tag>
                            )) : <span className="text-sm text-[var(--ui-text-text-placeholder)]">None</span>}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">ALL PROGRAMS</span>
                          <div className="flex flex-wrap gap-1">
                            {(profile?.programs || []).map((p) => (
                              <Tag key={p} color="grey" size="regular">{p}</Tag>
                            ))}
                          </div>
                        </div>
                        {profile?.networkId ? (
                          <div className="flex items-baseline gap-3">
                            <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">INSIGHT NETWORK</span>
                            <a href={`https://insight.eero.com/eeros/${profile.networkId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] hover:underline font-medium">{profile.networkId} ↗</a>
                          </div>
                        ) : (
                          <ProfileField label="INSIGHT NETWORK" value="" />
                        )}
                        {profile?.adminId ? (
                          <div className="flex items-baseline gap-3">
                            <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">ADMIN ID</span>
                            <a href={`https://admin.e2ro.com/users/${profile.adminId.replace(/^UID0*/, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] hover:underline font-medium">{profile.adminId} ↗</a>
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
              <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-support-border-support-warning)] p-5">
                <h4 className="text-sm font-semibold text-[var(--ui-text-text-primary)] mb-3">Record Tester Opt-Out</h4>
                <p className="text-xs text-[var(--ui-text-text-tertiary)] mb-4">Complete all offboarding steps below, then confirm. This person will be moved to the "Opted Out" list.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Reason</label>
                    <Select
                      id="opt-reason"
                      value={optOutReason}
                      onChange={(val) => setOptOutReason(val as OptOutReason)}
                      options={OPT_OUT_REASONS.map((r) => ({ value: r.value, label: r.label }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Notes</label>
                    <TextArea id="opt-notes" value={optOutNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOptOutNotes(e.target.value)} placeholder="Additional context..." rows={3} />
                  </div>

                  {/* Offboarding checklist — manual steps only */}
                  <div className="border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg p-4 bg-[var(--ui-background-layer-layer-page-hover)]">
                    <h5 className="text-xs font-semibold text-[var(--ui-text-text-secondary)] uppercase tracking-wider mb-3">Offboarding Steps (required)</h5>
                    <div className="space-y-2.5">
                      <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--ui-background-layer-layer-page)] cursor-pointer">
                        <Checkbox checked={optOutAdminDone} onChange={(e: CheckboxChangeEvent) => setOptOutAdminDone(e.target.checked)} className="mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-[var(--ui-text-text-primary)] font-medium">Removed from eero Admin</span>
                          <p className="text-xs text-[var(--ui-text-text-tertiary)]">Reverted to default user role in admin panel</p>
                        </div>
                        {(() => { const p = getTesterProfile(selectedPerson || ''); const aid = p?.adminId || ''; const nid = p?.networkId || ''; const link = aid ? `https://admin.e2ro.com/users/${aid.replace(/^UID0*/, '')}` : nid ? `https://insight.eero.com/eeros/${nid}` : ''; return link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--ui-core-periwinkle-periwinkle-6)] hover:underline flex items-center gap-1 shrink-0">Open Admin ↗</a> : null; })()}
                      </label>
                      <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--ui-background-layer-layer-page)] cursor-pointer">
                        <Checkbox checked={optOutDevicesDone} onChange={(e: CheckboxChangeEvent) => setOptOutDevicesDone(e.target.checked)} className="mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-[var(--ui-text-text-primary)] font-medium">Devices offboarded</span>
                          <p className="text-xs text-[var(--ui-text-text-tertiary)]">All devices returned, deactivated, or reassigned</p>
                        </div>
                      </label>
                      {/* Qualtrics — automated, shown as status */}
                      <div className="flex items-start gap-3 p-2 rounded-lg bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)]">
                        <div className="flex-shrink-0 mt-0.5 text-[var(--ui-support-text-icon-support-info)]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm text-[var(--ui-support-text-icon-support-info)] font-medium">Qualtrics opt-out</span>
                          <p className="text-xs text-[var(--ui-support-text-icon-support-info)]">Handled automatically when you confirm — no action needed</p>
                          {optOutQualtricsStatus && <p className={`text-xs mt-1 font-medium ${optOutQualtricsStatus.startsWith('✓') ? 'text-[var(--ui-core-green-green-6)]' : 'text-[var(--ui-core-orange-orange-6)]'}`}>{optOutQualtricsStatus}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="default"
                      label="Cancel"
                      onClick={() => { setShowOptOut(false); setOptOutAdminDone(false); setOptOutQualtricsDone(false); setOptOutQualtricsStatus(''); setOptOutDevicesDone(false); }}
                    />
                    <Button
                      type="primary"
                      disabled={!optOutAdminDone || !optOutDevicesDone}
                      label={optOutAdminDone && optOutDevicesDone ? 'Confirm Opt-Out' : `Complete ${2 - [optOutAdminDone, optOutDevicesDone].filter(Boolean).length} step(s) first`}
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
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Person's Devices Table */}
            <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden">
              <h4 className="px-4 py-3 text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider border-b border-[var(--ui-background-layer-border-border-layer-page)] bg-[var(--ui-background-layer-layer-page-hover)]">
                Devices ({selectedPersonDevices.length})
              </h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--ui-background-layer-layer-page-hover)] border-b border-[var(--ui-background-layer-border-border-layer-page)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Serial</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
                  {selectedPersonDevices.map((d) => (
                    <tr key={d.id} className="hover:bg-[var(--ui-background-layer-layer-page-hover)] cursor-pointer" onClick={() => setViewDevice(d)}>
                      <td className="px-4 py-2 font-mono text-xs text-[var(--ui-core-periwinkle-periwinkle-6)]">{d.serialNumber}</td>
                      <td className="px-4 py-2 text-[var(--ui-text-text-secondary)]">{d.model}</td>
                      <td className="px-4 py-2">
                        <Tag color="periwinkle" size="regular">{d.program}</Tag>
                      </td>
                      <td className="px-4 py-2">
                        <Tag color={getStatusTagColor(d.status)} size="regular">{d.status.replace(/_/g, ' ')}</Tag>
                      </td>
                      <td className="px-4 py-2 text-[var(--ui-text-text-tertiary)]">{d.country || '—'}</td>
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
        <Modal
          isOpen
          title="⚠️ Possible Duplicate Detected"
          onCancel={() => { setDuplicateMatches([]); setPendingNewPerson(null); }}
          hideFooter
        >
          <p className="text-sm text-[var(--ui-text-text-tertiary)] mb-4">
            We found existing profiles that might be the same person as "<strong>{pendingNewPerson.name}</strong>" ({pendingNewPerson.email}). Would you like to merge into an existing profile or create a new one?
          </p>
          <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
            {duplicateMatches.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-3 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[var(--ui-text-text-primary)]">{match.name}</p>
                  <p className="text-xs text-[var(--ui-text-text-tertiary)]">{match.email} {match.testerId && `· ${match.testerId}`}</p>
                </div>
                <Button type="default" label="Merge Into This Profile" onClick={() => handleMergeIntoExisting(match.id)} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="default" label="Cancel" onClick={() => { setDuplicateMatches([]); setPendingNewPerson(null); }} />
            <Button type="primary" label="Create New Profile Anyway" onClick={handleCreateAnyway} />
          </div>
        </Modal>
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
      <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">{label}</span>
      <span className="text-sm text-[var(--ui-text-text-primary)]">{value || '—'}</span>
    </div>
  );
}
