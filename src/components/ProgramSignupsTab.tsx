'use client';

import { useState } from 'react';
import { useProgramsStore } from '@/store/programsStore';
import { useAuthStore } from '@/store/authStore';
import { ProgramOffering, ProgramOfferingStatus, ProgramSignup, ProgramPhase } from '@/types';
import { Rocket, Plus, Calendar, Users, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';

const STATUS_BADGE: Record<ProgramOfferingStatus, string> = {
  upcoming: 'bg-purple-100 text-purple-700',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const SIGNUP_BADGE: Record<ProgramSignup['status'], string> = {
  interested: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  waitlisted: 'bg-yellow-100 text-yellow-700',
  declined: 'bg-gray-100 text-gray-500',
};

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

  const input = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-[#2c3e7a]" />
            Program Sign-ups
          </h2>
          <p className="text-sm text-gray-500 mt-1">Create dogfood program offerings and review who has signed up. Replaces the Slack signup flow.</p>
        </div>
        {canEdit() && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2c3e7a] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f5e]"
          >
            <Plus size={16} /> New Program
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && canEdit() && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Create a Program Offering</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Program Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Foghorn Outdoor Dogfood" className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
              <input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="e.g. Foghorn" className={input} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What testers will be doing..." className={`${input} resize-none`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProgramOfferingStatus })} className={input}>
                <option value="open">Open for sign-up</option>
                <option value="upcoming">Upcoming</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 40" className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sign-up Deadline</label>
              <input type="date" value={form.signupDeadline} onChange={(e) => setForm({ ...form, signupDeadline: e.target.value })} className={input} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Requirements</label>
              <input value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="e.g. Outdoor mounting location, 1G+ internet" className={input} />
            </div>
          </div>

          {/* Phases — each with start + finish dates */}
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Testing Phases</h4>
                <p className="text-xs text-gray-500">Add each phase (EVT, DVT, etc.) with its start and finish dates. The finish date drives end-of-program return alerts for testers.</p>
              </div>
              <button onClick={addPhase} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus size={14} /> Add phase
              </button>
            </div>

            {/* Quick-add standard phases */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-[11px] text-gray-400">Quick add:</span>
              {['EVT', 'DVT', 'PVT'].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addNamedPhase(name)}
                  className="text-[11px] font-medium px-2 py-0.5 border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  + {name}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {phases.map((p, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end bg-gray-50 rounded-lg p-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Phase name</label>
                    <input value={p.name} onChange={(e) => updatePhase(i, 'name', e.target.value)} placeholder="EVT" className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Start date</label>
                    <input type="date" value={p.startDate || ''} onChange={(e) => updatePhase(i, 'startDate', e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Finish date</label>
                    <input type="date" value={p.endDate || ''} onChange={(e) => updatePhase(i, 'endDate', e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" />
                  </div>
                  {phases.length > 1 && (
                    <button onClick={() => removePhase(i)} className="text-gray-400 hover:text-red-500 p-2" title="Remove phase">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); setPhases([{ name: '', startDate: '', endDate: '' }]); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} disabled={!form.name.trim() || !form.product.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">Create Program</button>
          </div>
        </div>
      )}

      {/* Offerings list */}
      {offerings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Rocket size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No program offerings yet. Create one to let dogfooders sign up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offerings.map((p) => {
            const programSignups = getSignupsForProgram(p.id);
            const isExpanded = expanded === p.id;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                        <span className="text-xs text-gray-400">{p.product}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                        {p.startDate && <span className="flex items-center gap-1"><Calendar size={12} /> Starts {new Date(p.startDate).toLocaleDateString()}</span>}
                        {p.signupDeadline && <span>⏳ Deadline {new Date(p.signupDeadline).toLocaleDateString()}</span>}
                        <span className="flex items-center gap-1"><Users size={12} /> {programSignups.length}{p.capacity ? ` / ${p.capacity}` : ''} signed up</span>
                      </div>
                      {p.phases && p.phases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.phases.map((ph) => (
                            <span key={ph.name} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {ph.name}{ph.endDate ? ` · ends ${new Date(ph.endDate).toLocaleDateString()}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {canEdit() && (
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={p.status}
                          onChange={(e) => updateOffering(p.id, { status: e.target.value as ProgramOfferingStatus })}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="open">Open</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button
                          onClick={() => { if (confirm(`Delete "${p.name}" and all its sign-ups?`)) deleteOffering(p.id); }}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Delete program"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                    className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {programSignups.length} sign-up{programSignups.length !== 1 ? 's' : ''}
                  </button>
                </div>

                {/* Signups */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    {programSignups.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No sign-ups yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="text-left pb-2">Name</th>
                            <th className="text-left pb-2">Email</th>
                            <th className="text-left pb-2">Note</th>
                            <th className="text-left pb-2">Signed up</th>
                            <th className="text-left pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {programSignups.map((s) => (
                            <tr key={s.id}>
                              <td className="py-2 font-medium text-gray-900">{s.name}</td>
                              <td className="py-2 text-gray-600">{s.email}</td>
                              <td className="py-2 text-gray-500 max-w-[200px] truncate" title={s.note}>{s.note || '—'}</td>
                              <td className="py-2 text-gray-500 text-xs">{new Date(s.signedUpAt).toLocaleDateString()}</td>
                              <td className="py-2">
                                {canEdit() ? (
                                  <select
                                    value={s.status}
                                    onChange={(e) => updateSignupStatus(s.id, e.target.value as ProgramSignup['status'])}
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer capitalize ${SIGNUP_BADGE[s.status]}`}
                                  >
                                    <option value="interested">Interested</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="waitlisted">Waitlisted</option>
                                    <option value="declined">Declined</option>
                                  </select>
                                ) : (
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SIGNUP_BADGE[s.status]}`}>{s.status}</span>
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
