'use client';

import { useState } from 'react';
import { useProgramsStore } from '@/store/programsStore';
import { useAuthStore } from '@/store/authStore';
import { ProgramOffering, ProgramOfferingStatus, ProgramSignup, ProgramPhase } from '@/types';
import { Button, Input, TextArea, Select, Tag, Card } from '@amzn/eero-web-design-components';
import { Rocket, Plus, Calendar, Users, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';

const STATUS_TAG_COLOR: Record<ProgramOfferingStatus, 'purple' | 'green' | 'grey'> = {
  upcoming: 'purple',
  open: 'green',
  closed: 'grey',
};

const SIGNUP_TAG_COLOR: Record<ProgramSignup['status'], 'periwinkle' | 'green' | 'orange' | 'grey'> = {
  interested: 'periwinkle',
  accepted: 'green',
  waitlisted: 'orange',
  declined: 'grey',
};

const OFFERING_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'closed', label: 'Closed' },
];

const OFFERING_STATUS_FORM_OPTIONS = [
  { value: 'open', label: 'Open for sign-up' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'closed', label: 'Closed' },
];

const SIGNUP_STATUS_OPTIONS = [
  { value: 'interested', label: 'Interested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'declined', label: 'Declined' },
];

const EMPTY_FORM = {
  name: '', product: '', description: '', status: 'open' as ProgramOfferingStatus,
  startDate: '', signupDeadline: '', capacity: '', requirements: '',
};

export default function ProgramSignupsTab() {
  const { offerings, signups, addOffering, updateOffering, deleteOffering, updateSignupStatus, getSignupsForProgram } = useProgramsStore();
  const { canEdit, currentUser } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [phases, setPhases] = useState<ProgramPhase[]>([{ name: '', startDate: '', endDate: '' }]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const updatePhase = (i: number, field: keyof ProgramPhase, value: string) => {
    setPhases((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  };
  const addPhase = () => setPhases((prev) => [...prev, { name: '', startDate: '', endDate: '' }]);
  const removePhase = (i: number) => setPhases((prev) => prev.filter((_, idx) => idx !== i));
  const addNamedPhase = (name: string) => {
    setPhases((prev) => {
      // If there's a single empty row, fill its name; otherwise append.
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [{ ...prev[0], name }];
      }
      if (prev.some((p) => p.name.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { name, startDate: '', endDate: '' }];
    });
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.product.trim()) return;
    const cleanPhases = phases.filter((p) => p.name.trim());
    addOffering({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      product: form.product.trim(),
      description: form.description.trim(),
      status: form.status,
      startDate: form.startDate || undefined,
      signupDeadline: form.signupDeadline || undefined,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      requirements: form.requirements.trim() || undefined,
      phases: cleanPhases.length ? cleanPhases : undefined,
      createdBy: currentUser?.name || 'Admin',
      createdAt: new Date().toISOString(),
    });
    setForm(EMPTY_FORM);
    setPhases([{ name: '', startDate: '', endDate: '' }]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ui-text-text-primary)] flex items-center gap-2">
            <Rocket className="w-5 h-5 text-[var(--ui-core-periwinkle-periwinkle-6)]" />
            Program Sign-ups
          </h2>
          <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">Create dogfood program offerings and review who has signed up. Replaces the Slack signup flow.</p>
        </div>
        {canEdit() && (
          <Button
            type="primary"
            onClick={() => setShowCreate(!showCreate)}
            ariaLabel="New Program"
            label={<span className="flex items-center gap-1.5"><Plus size={16} /> New Program</span>}
          />
        )}
      </div>

      {/* Create form */}
      {showCreate && canEdit() && (
        <Card size={3} title="Create a Program Offering">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="prog-name" label="Program Name *" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Foghorn Outdoor Dogfood" layout="vertical" />
            <Input id="prog-product" label="Product *" value={form.product} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, product: e.target.value })} placeholder="e.g. Foghorn" layout="vertical" />
            <div className="md:col-span-2">
              <TextArea id="prog-description" label="Description" value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What testers will be doing..." layout="vertical" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Status</label>
              <Select id="prog-status" value={form.status} onChange={(val: ProgramOfferingStatus) => setForm({ ...form, status: val })} options={OFFERING_STATUS_FORM_OPTIONS} />
            </div>
            <Input id="prog-capacity" type="number" min={1} label="Capacity" value={form.capacity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 40" layout="vertical" />
            <Input id="prog-start" type="date" label="Start Date" value={form.startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, startDate: e.target.value })} layout="vertical" />
            <Input id="prog-deadline" type="date" label="Sign-up Deadline" value={form.signupDeadline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, signupDeadline: e.target.value })} layout="vertical" />
            <div className="md:col-span-2">
              <Input id="prog-requirements" label="Requirements" value={form.requirements} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, requirements: e.target.value })} placeholder="e.g. Outdoor mounting location, 1G+ internet" layout="vertical" />
            </div>
          </div>

          {/* Phases — each with start + finish dates */}
          <div className="mt-5 border-t border-[var(--ui-background-layer-border-border-layer-page)] pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-[var(--ui-text-text-primary)]">Testing Phases</h4>
                <p className="text-xs text-[var(--ui-text-text-tertiary)]">Add each phase (EVT, DVT, etc.) with its start and finish dates. The finish date drives end-of-program return alerts for testers.</p>
              </div>
              <Button type="text" onClick={addPhase} ariaLabel="Add phase" label={<span className="flex items-center gap-1"><Plus size={14} /> Add phase</span>} />
            </div>

            {/* Quick-add standard phases */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-xs text-[var(--ui-text-text-placeholder)]">Quick add:</span>
              {['EVT', 'DVT', 'PVT'].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addNamedPhase(name)}
                  className="text-xs font-medium px-2 py-0.5 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-full text-[var(--ui-text-text-tertiary)] hover:border-[var(--ui-core-periwinkle-periwinkle-6)] hover:bg-[var(--ui-support-fill-support-info)] hover:text-[var(--ui-core-periwinkle-periwinkle-6)]"
                >
                  + {name}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {phases.map((p, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end bg-[var(--ui-background-layer-layer-page-hover)] rounded-lg p-2.5">
                  <Input id={`phase-name-${i}`} label="Phase name" value={p.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePhase(i, 'name', e.target.value)} placeholder="EVT" layout="vertical" />
                  <Input id={`phase-start-${i}`} type="date" label="Start date" value={p.startDate || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePhase(i, 'startDate', e.target.value)} layout="vertical" />
                  <Input id={`phase-end-${i}`} type="date" label="Finish date" value={p.endDate || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePhase(i, 'endDate', e.target.value)} layout="vertical" />
                  {phases.length > 1 && (
                    <Button type="text" onClick={() => removePhase(i)} ariaLabel="Remove phase" label={<X size={16} />} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button type="default" label="Cancel" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); setPhases([{ name: '', startDate: '', endDate: '' }]); }} />
            <Button type="primary" label="Create Program" onClick={handleCreate} disabled={!form.name.trim() || !form.product.trim()} />
          </div>
        </Card>
      )}

      {/* Offerings list */}
      {offerings.length === 0 ? (
        <Card size={3}>
          <div className="p-12 text-center">
            <Rocket size={40} className="mx-auto text-[var(--ui-text-text-disabled)] mb-3" />
            <p className="text-sm text-[var(--ui-text-text-tertiary)]">No program offerings yet. Create one to let dogfooders sign up.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {offerings.map((p) => {
            const programSignups = getSignupsForProgram(p.id);
            const isExpanded = expanded === p.id;
            return (
              <div key={p.id} className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--ui-text-text-primary)]">{p.name}</h3>
                        <Tag color={STATUS_TAG_COLOR[p.status]} size="regular">{p.status}</Tag>
                        <span className="text-xs text-[var(--ui-text-text-placeholder)]">{p.product}</span>
                      </div>
                      <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">{p.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ui-text-text-tertiary)] mt-2">
                        {p.startDate && <span className="flex items-center gap-1"><Calendar size={12} /> Starts {new Date(p.startDate).toLocaleDateString()}</span>}
                        {p.signupDeadline && <span>⏳ Deadline {new Date(p.signupDeadline).toLocaleDateString()}</span>}
                        <span className="flex items-center gap-1"><Users size={12} /> {programSignups.length}{p.capacity ? ` / ${p.capacity}` : ''} signed up</span>
                      </div>
                      {p.phases && p.phases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.phases.map((ph) => (
                            <Tag key={ph.name} color="grey" size="regular">
                              {ph.name}{ph.endDate ? ` · ends ${new Date(ph.endDate).toLocaleDateString()}` : ''}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                    {canEdit() && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-32">
                          <Select
                            id={`offering-status-${p.id}`}
                            value={p.status}
                            onChange={(val: ProgramOfferingStatus) => updateOffering(p.id, { status: val })}
                            options={OFFERING_STATUS_OPTIONS}
                            size="small"
                          />
                        </div>
                        <Button
                          type="text"
                          danger
                          onClick={() => { if (confirm(`Delete "${p.name}" and all its sign-ups?`)) deleteOffering(p.id); }}
                          ariaLabel="Delete program"
                          label={<Trash2 size={16} />}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="text"
                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                    ariaLabel={`${programSignups.length} sign-ups`}
                    label={<span className="flex items-center gap-1">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}{programSignups.length} sign-up{programSignups.length !== 1 ? 's' : ''}</span>}
                  />
                </div>

                {/* Signups */}
                {isExpanded && (
                  <div className="border-t border-[var(--ui-background-layer-border-border-layer-page)] bg-[var(--ui-background-layer-layer-page-hover)] px-5 py-4">
                    {programSignups.length === 0 ? (
                      <p className="text-sm text-[var(--ui-text-text-placeholder)] text-center py-4">No sign-ups yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="text-xs text-[var(--ui-text-text-tertiary)] uppercase">
                          <tr>
                            <th className="text-left pb-2">Name</th>
                            <th className="text-left pb-2">Email</th>
                            <th className="text-left pb-2">Note</th>
                            <th className="text-left pb-2">Signed up</th>
                            <th className="text-left pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
                          {programSignups.map((s) => (
                            <tr key={s.id}>
                              <td className="py-2 font-medium text-[var(--ui-text-text-primary)]">{s.name}</td>
                              <td className="py-2 text-[var(--ui-text-text-tertiary)]">{s.email}</td>
                              <td className="py-2 text-[var(--ui-text-text-tertiary)] max-w-[200px] truncate" title={s.note}>{s.note || '—'}</td>
                              <td className="py-2 text-[var(--ui-text-text-tertiary)] text-xs">{new Date(s.signedUpAt).toLocaleDateString()}</td>
                              <td className="py-2">
                                {canEdit() ? (
                                  <div className="w-36">
                                    <Select
                                      id={`signup-status-${s.id}`}
                                      value={s.status}
                                      onChange={(val: ProgramSignup['status']) => updateSignupStatus(s.id, val)}
                                      options={SIGNUP_STATUS_OPTIONS}
                                      size="small"
                                    />
                                  </div>
                                ) : (
                                  <Tag color={SIGNUP_TAG_COLOR[s.status]} size="regular">{s.status}</Tag>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
