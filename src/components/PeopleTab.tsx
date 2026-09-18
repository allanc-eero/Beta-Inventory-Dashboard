'use client';

import { useState, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Plus } from 'lucide-react';
import { OptOutReason, OptOutRecord, Device, TesterProfile } from '@/types';
import { Segmented, Input, TextArea, Select, Button, Tag, Checkbox, Modal, Pagination } from '@amzn/eero-web-design-components';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import DeviceDetailPanel from './DeviceDetailPanel';
import OptBackInChecklistPanel from './OptBackInChecklistPanel';
import OptOutChecklistPanel from './OptOutChecklistPanel';
import { useAuthStore } from '@/store/authStore';
import { adminUserUrl, insightNetworkUrl, initials, resolveEnv, EeroEnv } from '@/lib/format';

const OPT_OUT_REASONS: { value: OptOutReason; label: string }[] = [
  { value: 'no_longer_interested', label: 'No longer interested in testing' },
  { value: 'moving', label: 'Moving / relocating' },
  { value: 'device_issues', label: 'Too many device issues' },
  { value: 'time_constraints', label: 'Time constraints' },
  { value: 'other', label: 'Other' },
];

export default function PeopleTab({ initialSelectedPerson, onClearSelection }: { initialSelectedPerson?: string | null; onClearSelection?: () => void }) {
  const { devices, people, testerProfiles, addPerson, addOptOut, getOptOuts, removeOptOut, getTesterProfile, findDuplicateProfiles, mergeProfiles, upsertTesterProfile } = useDeviceStore();
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
  const [activeView, setActiveView] = useState<'active' | 'opted_out' | 'possible_duplicates'>('active');
  const [dismissedDupes, setDismissedDupes] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewDevice, setViewDevice] = useState<Device | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [pendingNewPerson, setPendingNewPerson] = useState<{ name: string; email: string; team: string } | null>(null);
  const [optBackInRecord, setOptBackInRecord] = useState<OptOutRecord | null>(null);
  // Profile edit mode — fix a mislinked account / correct any tester field.
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileEdit, setProfileEdit] = useState<Partial<TesterProfile>>({});
  const onProfileEditChange = (field: keyof TesterProfile, v: string) => setProfileEdit((prev) => ({ ...prev, [field]: v }));
  const startEditProfile = () => {
    const p = getTesterProfile(selectedPerson || '');
    setProfileEdit({
      name: p?.name || '', contactEmail: p?.contactEmail || '', alternateEmail: p?.alternateEmail || '',
      country: p?.country || '', location: p?.location || '', networkId: p?.networkId || '',
      adminId: p?.adminId || '', internetSpeed: p?.internetSpeed || '',
    });
    setEditingProfile(true);
  };
  const saveEditProfile = () => {
    const email = getTesterProfile(selectedPerson || '')?.email || selectedPerson || '';
    if (email) upsertTesterProfile({ email, ...profileEdit });
    setEditingProfile(false);
  };

  const optOuts = getOptOuts();
  const optedOutEmails = new Set(optOuts.map((o) => o.personEmail.toLowerCase()));

  // Derive people from device assignments + roster, deduplicated by IDENTITY.
  // The key is the person's CANONICAL email: if an email is a known alias of a
  // tester profile (additionalEmails), we collapse to that profile's primary
  // email so the same person under multiple known emails is ONE card. This only
  // merges emails already proven to be the same person (recorded aliases) —
  // fuzzy name/location matches are handled by the Add Person duplicate review,
  // never auto-merged, to avoid collapsing two different real testers.
  const derivedPeople = useMemo(() => {
    const personMap = new Map<string, { name: string; email: string; devices: typeof devices }>();

    // Resolve any email to its canonical (primary) identity via tester profiles.
    const canonical = (email?: string, name?: string): { key: string; email: string; name?: string } => {
      const e = email?.toLowerCase().trim() || '';
      if (e) {
        const prof = getTesterProfile(e);
        if (prof?.email) return { key: prof.email.toLowerCase(), email: prof.email.toLowerCase(), name: prof.name || undefined };
        return { key: e, email: e };
      }
      return { key: (name || '').toLowerCase().trim(), email: '' };
    };

    devices.forEach((d) => {
      const rawEmail = d.assignedEmail?.toLowerCase().trim();
      const name = d.assignedTo || d.checkedOutTo;
      if (!rawEmail && !name) return;

      const c = canonical(rawEmail, name);
      if (!c.key) return;

      if (!personMap.has(c.key)) {
        personMap.set(c.key, { name: c.name || name || c.email || '', email: c.email, devices: [] });
      } else {
        const existing = personMap.get(c.key)!;
        if (name && name.includes(' ') && !existing.name.includes(' ')) existing.name = name;
      }
      personMap.get(c.key)!.devices.push(d);
    });

    people.forEach((p) => {
      const c = canonical(p.email, p.name);
      if (!personMap.has(c.key)) {
        personMap.set(c.key, { name: c.name || p.name, email: c.email || p.email, devices: [] });
      }
    });

    return Array.from(personMap.values());
  }, [devices, people, testerProfiles, getTesterProfile]);

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

  // Group the selected person's devices by program (past + active), plus any
  // roster-only programs from their profile that never shipped a device — the
  // cross-program history reference for this tester.
  const personProgramGroups = useMemo(() => {
    const map = new Map<string, Device[]>();
    selectedPersonDevices.forEach((d) => {
      const key = deviceProgramLabel(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    // Roster-only programs from the profile (participated but no device shipped).
    const seen = new Set([...map.keys()].map((k) => normalizeProgramKey(k)));
    const prof = selectedPerson ? getTesterProfile(selectedPerson) : undefined;
    (prof?.programs || []).forEach((p) => {
      if (!seen.has(normalizeProgramKey(p))) map.set(p, []);
    });
    return Array.from(map.entries()).map(([name, devs]) => ({ name, devices: devs }));
  }, [selectedPersonDevices, selectedPerson, testerProfiles, getTesterProfile]);

  // ── Possible-duplicate detection ───────────────────────────────────────────
  // Finds pairs of people that look like the SAME person but sit on different
  // cards (different canonical emails, no recorded alias yet). Uses name (exact
  // or 2+ word overlap) plus a corroborating signal (same location or a shared
  // device network). We only auto-collapse recorded aliases elsewhere; these are
  // surfaced for a human to confirm-merge, never merged silently — so two truly
  // different people who share a name are never fused by accident.
  const dupePairKey = (a: string, b: string) => [a, b].sort().join('|');

  const duplicateCandidates = useMemo(() => {
    const norm = (s: string) => (s || '').toLowerCase().trim();
    const words = (n: string) => norm(n).split(/\s+/).filter((w) => w.length > 2);
    const locOf = (p: { email: string; devices: Device[] }) =>
      norm(getTesterProfile(p.email)?.location || p.devices.find((d) => d.location)?.location || '');
    const netsOf = (p: { devices: Device[] }) => new Set(p.devices.map((d) => d.network).filter(Boolean));

    const out: { a: (typeof derivedPeople)[number]; b: (typeof derivedPeople)[number]; reasons: string[]; confidence: 'high' | 'medium' }[] = [];
    const list = derivedPeople;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const A = list[i], B = list[j];
        const aId = A.email || A.name, bId = B.email || B.name;
        if (norm(A.email) && norm(A.email) === norm(B.email)) continue; // already one identity
        if (dismissedDupes.has(dupePairKey(aId, bId))) continue;

        const exactName = !!norm(A.name) && norm(A.name) === norm(B.name);
        const aW = words(A.name), bW = words(B.name);
        const nameOverlap = aW.filter((w) => bW.includes(w)).length >= 2;
        if (!exactName && !nameOverlap) continue; // name is the required anchor

        const aLoc = locOf(A), bLoc = locOf(B);
        const sharedLoc = !!aLoc && aLoc === bLoc;
        const aNet = netsOf(A);
        const sharedNet = [...netsOf(B)].some((n) => aNet.has(n));

        const reasons: string[] = [];
        reasons.push(exactName ? 'Same name' : 'Similar name');
        if (sharedLoc) reasons.push('Same location');
        if (sharedNet) reasons.push('Shared network');

        let confidence: 'high' | 'medium' | null = null;
        if ((exactName && (sharedLoc || sharedNet)) || (sharedNet && nameOverlap)) confidence = 'high';
        else if (exactName || (nameOverlap && sharedLoc)) confidence = 'medium';
        if (confidence) out.push({ a: A, b: B, reasons, confidence });
      }
    }
    return out.sort((x, y) => (x.confidence === y.confidence ? 0 : x.confidence === 'high' ? -1 : 1));
  }, [derivedPeople, testerProfiles, getTesterProfile, dismissedDupes, devices]);

  // Confirm: fold B's email into A's profile as an alias. Canonical dedup then
  // collapses them into a single card automatically (and stays collapsed).
  const handleMergeDuplicate = (a: { name: string; email: string }, b: { name: string; email: string }) => {
    if (!a.email) return;
    let target = getTesterProfile(a.email);
    if (!target) {
      upsertTesterProfile({ email: a.email, name: a.name, programs: [] });
      target = getTesterProfile(a.email);
    }
    if (target) mergeProfiles(target.id, b.email || b.name);
  };

  const handleDismissDuplicate = (a: { name: string; email: string }, b: { name: string; email: string }) => {
    setDismissedDupes((prev) => new Set(prev).add(dupePairKey(a.email || a.name, b.email || b.name)));
  };

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
              onChange={(val) => setActiveView(val as 'active' | 'opted_out' | 'possible_duplicates')}
              items={[
                { label: `Active (${derivedPeople.filter((p) => !optedOutEmails.has(p.email.toLowerCase())).length})`, value: 'active' },
                { label: `Opted Out (${optOuts.length})`, value: 'opted_out' },
                { label: `Possible Duplicates (${duplicateCandidates.length})`, value: 'possible_duplicates' },
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
            {/* Active People — full-width compact rows */}
            {activeView === 'active' && (() => {
              const activePeople = filteredPeople.filter((p) => !optedOutEmails.has(p.email.toLowerCase()));
              const totalPages = Math.max(1, Math.ceil(activePeople.length / pageSize));
              const current = Math.min(page, totalPages);
              const pageStart = (current - 1) * pageSize;
              const pagePeople = activePeople.slice(pageStart, pageStart + pageSize);
              return (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-[var(--ui-text-text-secondary)]">{activePeople.length} {activePeople.length === 1 ? 'person' : 'people'}</p>
                  <div className="flex flex-col gap-3">
                    {pagePeople.map((person) => {
                      const online = person.devices.filter((d) => d.status === 'online').length;
                      const archived = person.devices.filter((d) => d.status === 'deactivated').length;
                      const programCount = programCountFor(person.devices, getTesterProfile(person.email)?.programs || []);
                      return (
                        <div
                          key={person.email || person.name}
                          className="flex items-center gap-x-4 rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] bg-[var(--ui-background-layer-layer-page)] px-6 py-6 cursor-pointer hover:bg-[var(--ui-background-layer-layer-page-hover)] transition-colors"
                          onClick={() => setSelectedPerson(person.email || person.name)}
                        >
                          <div className="flex min-w-0 flex-[2] items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ui-support-fill-support-success)]">
                              <span className="text-xs font-semibold text-[var(--ui-support-text-support-success)]">{initials(person.name)}</span>
                            </div>
                            <div className="min-w-0 leading-tight">
                              <p className="truncate text-sm font-medium text-[var(--ui-text-text-primary)]">{person.name}</p>
                              <p className="truncate text-xs text-[var(--ui-text-text-tertiary)]">{person.email}</p>
                            </div>
                          </div>
                          <div className="flex-1 leading-tight">
                            <p className="text-xs text-[var(--ui-text-text-tertiary)]">Programs</p>
                            <p className="truncate text-sm font-medium text-[var(--ui-text-text-primary)]">{programCount}</p>
                          </div>
                          <div className="flex-1 leading-tight">
                            <p className="text-xs text-[var(--ui-text-text-tertiary)]">Devices</p>
                            <p className="text-sm font-medium text-[var(--ui-text-text-primary)]">{person.devices.length} <span className="text-xs font-normal text-[var(--ui-text-text-tertiary)]">{archived > 0 ? `· ${archived} archived` : ''}</span></p>
                          </div>
                          <div className="flex-1 leading-tight">
                            <p className="text-xs text-[var(--ui-text-text-tertiary)]">Online</p>
                            <p className="text-sm font-medium text-[var(--ui-text-text-primary)]">{online}</p>
                          </div>
                        </div>
                      );
                    })}
                    {activePeople.length === 0 && (
                      <div className="rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] bg-[var(--ui-background-layer-layer-page)] p-8 text-center text-sm text-[var(--ui-text-text-placeholder)]">No people found</div>
                    )}
                  </div>
                  {activePeople.length > pageSize && (
                    <Pagination
                      pagination={{ totalItems: activePeople.length, totalPages, hasPreviousPage: current > 1, hasNextPage: current < totalPages }}
                      currentPage={current}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onNextPage={() => setPage((n) => Math.min(totalPages, n + 1))}
                      onPreviousPage={() => setPage((n) => Math.max(1, n - 1))}
                      onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                      pageSizeOptions={[{ value: 25, label: '25' }, { value: 50, label: '50' }, { value: 100, label: '100' }]}
                      maxVisiblePages={5}
                      ln10_label={{ prevBtn: 'Previous', nextBtn: 'Next', pageBtn: 'Page', itemsPerPage: 'Per page', counter: (s, e, t) => `Showing ${s}–${e} of ${t}` }}
                    />
                  )}
                </div>
              );
            })()}

            {/* Opted Out People */}
            {activeView === 'opted_out' && (
              <div className="space-y-3">
                {optOuts.length > 0 ? optOuts.map((record) => (
                  <div key={record.id} className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--ui-background-layer-layer-page-hover)] rounded-full flex items-center justify-center">
                          <span className="text-[var(--ui-text-text-tertiary)] font-semibold text-sm">
                            {initials(record.personName)}
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

            {/* Possible Duplicates — same person on two cards, pending review */}
            {activeView === 'possible_duplicates' && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--ui-text-text-tertiary)]">
                  Likely the same person on separate cards. Confirming a merge links their emails so it collapses to one card and stays that way. Exact-identity matches are merged automatically — these need your OK because they match on name plus location/network, which isn&apos;t proof on its own.
                </p>
                {duplicateCandidates.length > 0 ? duplicateCandidates.map(({ a, b, reasons, confidence }) => (
                  <div key={dupePairKey(a.email || a.name, b.email || b.name)} className="rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] bg-[var(--ui-background-layer-layer-page)] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--ui-text-text-primary)]">Possible duplicate</span>
                        <Tag color={confidence === 'high' ? 'orange' : 'yellow'} size="regular">{confidence === 'high' ? 'High confidence' : 'Needs review'}</Tag>
                      </div>
                      <span className="text-xs text-[var(--ui-text-text-tertiary)]">{reasons.join(' · ')}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[a, b].map((p, idx) => (
                        <div key={idx} className="rounded-lg border border-[var(--ui-background-layer-border-border-layer-page)] p-3">
                          <p className="truncate text-sm font-medium text-[var(--ui-text-text-primary)]">{p.name}{idx === 0 && <span className="ml-1.5 text-xs font-normal text-[var(--ui-text-text-tertiary)]">(kept)</span>}</p>
                          <p className="truncate text-xs text-[var(--ui-text-text-tertiary)]">{p.email || '—'}</p>
                          <p className="mt-1 text-xs text-[var(--ui-text-text-tertiary)]">{p.devices.length} device(s)</p>
                        </div>
                      ))}
                    </div>
                    {canEdit() && (
                      <div className="flex justify-end gap-2 mt-3">
                        <Button type="default" label="Not a match" onClick={() => handleDismissDuplicate(a, b)} />
                        <Button type="primary" label={`Merge into ${a.name}`} onClick={() => handleMergeDuplicate(a, b)} />
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-12 text-center">
                    <p className="text-[var(--ui-text-text-placeholder)] text-sm">No possible duplicates found</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Person Detail View — Expanded Profile */
          <div className="space-y-4">
            <button
              onClick={() => { setSelectedPerson(null); setEditingProfile(false); }}
              className="text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] text-sm font-medium"
            >
              ← All people
            </button>

            {(() => {
              const profile = getTesterProfile(selectedPerson || '');
              const personName = profile?.name || selectedPersonDevices[0]?.assignedTo || selectedPerson;
              const activePrograms = [...new Set(selectedPersonDevices.filter((d) => d.status !== 'deactivated').map((d) => d.program))];
              // Route this person's Insight/Admin links to the right cloud: if any of
              // their devices is dogfood/stage, use stage; otherwise prod.
              const dfDevice = selectedPersonDevices.find((d) => d.environment === 'stage' || (d.program || '').toLowerCase().includes('dogfood'));
              const personEnv: EeroEnv = dfDevice ? resolveEnv(dfDevice.environment, dfDevice.program) : 'prod';
              const personInsightUrl = profile?.networkId ? insightNetworkUrl(profile.networkId, personEnv) : '';
              const personAdminUrl = profile?.adminId ? adminUserUrl(profile.adminId, personEnv) : '';

              return (
                <>
                  {/* Profile Header */}
                  <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[var(--ui-support-fill-support-success)] rounded-full flex items-center justify-center">
                          <span className="text-[var(--ui-support-text-support-success)] font-bold text-lg">
                            {initials(personName)}
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
                        <div className="flex items-center gap-2">
                          {editingProfile ? (
                            <>
                              <Button type="default" label="Cancel" onClick={() => setEditingProfile(false)} />
                              <Button type="primary" label="Save" onClick={saveEditProfile} />
                            </>
                          ) : (
                            <>
                              <Button type="default" label="Edit profile" onClick={startEditProfile} />
                              <Button type="default" label="Record Opt-Out" onClick={() => setShowOptOut(true)} />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Details — Two Column */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Contact & Identity */}
                    <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-5">
                      <h4 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider mb-3 border-b border-[var(--ui-background-layer-border-border-layer-page)] pb-2">Contact & Identity</h4>
                      <div className="space-y-2.5">
                        {editingProfile ? (
                          <>
                            <EditableRow label="NAME" field="name" value={profileEdit.name || ''} onChange={onProfileEditChange} />
                            <ProfileField label="PRIMARY EMAIL" value={profile?.email || selectedPerson || ''} />
                            <EditableRow label="CONTACT EMAIL" field="contactEmail" value={profileEdit.contactEmail || ''} onChange={onProfileEditChange} />
                            <EditableRow label="ALTERNATE EMAIL" field="alternateEmail" value={profileEdit.alternateEmail || ''} onChange={onProfileEditChange} />
                            <EditableRow label="COUNTRY" field="country" value={profileEdit.country || ''} onChange={onProfileEditChange} />
                            <EditableRow label="LOCATION" field="location" value={profileEdit.location || ''} onChange={onProfileEditChange} />
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
                        {editingProfile ? (
                          <>
                            <EditableRow label="INSIGHT NETWORK" field="networkId" value={profileEdit.networkId || ''} onChange={onProfileEditChange} />
                            <EditableRow label="ADMIN ID" field="adminId" value={profileEdit.adminId || ''} onChange={onProfileEditChange} />
                            <EditableRow label="INTERNET SPEED" field="internetSpeed" value={profileEdit.internetSpeed || ''} onChange={onProfileEditChange} />
                          </>
                        ) : (
                          <>
                            {profile?.networkId ? (
                              <div className="flex items-baseline gap-3">
                                <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">INSIGHT NETWORK</span>
                                {personInsightUrl
                                  ? <a href={personInsightUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] hover:underline font-medium" title={`Open in Insight (${personEnv})`}>{profile.networkId} ↗</a>
                                  : <span className="text-sm text-[var(--ui-text-text-secondary)]" title="Stage Insight URL not configured yet">{profile.networkId}</span>}
                              </div>
                            ) : (
                              <ProfileField label="INSIGHT NETWORK" value="" />
                            )}
                            {profile?.adminId ? (
                              <div className="flex items-baseline gap-3">
                                <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">ADMIN ID</span>
                                {personAdminUrl
                                  ? <a href={personAdminUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] hover:underline font-medium" title={`Open in Admin (${personEnv})`}>{profile.adminId} ↗</a>
                                  : <span className="text-sm text-[var(--ui-text-text-secondary)]" title="Stage Admin URL not configured yet">{profile.adminId}</span>}
                              </div>
                            ) : (
                              <ProfileField label="ADMIN ID" value="" />
                            )}
                            <ProfileField label="INTERNET SPEED" value={profile?.internetSpeed || ''} />
                          </>
                        )}
                        {profile?.testerId && <ProfileField label="TESTER ID" value={profile.testerId} />}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Program History — every program this tester has been part of, past + active */}
            <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-5">
              <h4 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase tracking-wider mb-3 border-b border-[var(--ui-background-layer-border-border-layer-page)] pb-2">
                Program History ({personProgramGroups.length})
              </h4>
              {personProgramGroups.length === 0 ? (
                <p className="text-sm text-[var(--ui-text-text-placeholder)]">No program history yet.</p>
              ) : (
                <div className="space-y-2">
                  {personProgramGroups.map((g) => {
                    const active = g.devices.some((d) => d.status === 'online' || d.status === 'not_online');
                    const label = g.devices.length === 0 ? 'Roster only' : active ? 'Active' : 'Closed';
                    const color = label === 'Active' ? 'green' : label === 'Closed' ? 'grey' : 'periwinkle';
                    return (
                      <div key={g.name} className="rounded-lg border border-[var(--ui-background-layer-border-border-layer-page)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-[var(--ui-text-text-primary)]">{g.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--ui-text-text-tertiary)]">{g.devices.length} device{g.devices.length !== 1 ? 's' : ''}</span>
                            <Tag color={color} size="regular">{label}</Tag>
                          </div>
                        </div>
                        {g.devices.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {g.devices.map((d) => (
                              <button key={d.id} onClick={() => setViewDevice(d)} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ui-background-layer-border-border-layer-page)] px-2 py-1 hover:bg-[var(--ui-background-layer-layer-page-hover)]">
                                <span className="font-mono text-xs text-[var(--ui-core-periwinkle-periwinkle-6)]">{d.serialNumber}</span>
                                <Tag color={getStatusTagColor(d.status)} size="regular">{d.status.replace(/_/g, ' ')}</Tag>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
                        {(() => { const p = getTesterProfile(selectedPerson || ''); const aid = p?.adminId || ''; const nid = p?.networkId || ''; const df = selectedPersonDevices.find((d) => d.environment === 'stage' || (d.program || '').toLowerCase().includes('dogfood')); const env = df ? resolveEnv(df.environment, df.program) : 'prod'; const link = aid ? adminUserUrl(aid, env) : nid ? insightNetworkUrl(nid, env) : ''; return link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--ui-core-periwinkle-periwinkle-6)] hover:underline flex items-center gap-1 shrink-0">Open Admin ↗</a> : null; })()}
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

function EditableRow({ label, field, value, onChange }: {
  label: string; field: keyof TesterProfile; value: string; onChange: (field: keyof TesterProfile, v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--ui-text-text-tertiary)] uppercase w-36 shrink-0 font-medium">{label}</span>
      <div className="flex-1">
        <Input id={`edit-profile-${String(field)}`} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value)} />
      </div>
    </div>
  );
}

const normalizeProgramKey = (s: string) => s.toLowerCase().replace(/\s+/g, '');

// The program NAME a device belongs to. Survey-flow devices (id "prog-…") carry
// the real program name in testbedName; for others testbedName is a network
// group, so fall back to the product + program label (matches the Devices menu).
function deviceProgramLabel(d: Device) {
  return (d.id.startsWith('prog-') && d.testbedName)
    ? d.testbedName
    : ([d.product, (d.program || '').toUpperCase()].filter(Boolean).join(' ').trim() || 'Unknown');
}

// Count of distinct programs a person is part of (devices + roster) — the People row summary.
function programCountFor(devices: Device[], programs: string[] = []) {
  const keys = new Set<string>();
  devices.forEach((d) => keys.add(normalizeProgramKey(deviceProgramLabel(d))));
  programs.forEach((p) => keys.add(normalizeProgramKey(p)));
  return keys.size;
}
