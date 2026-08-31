'use client';

import { useState, useMemo } from 'react';
import { useAuthStore, User, DogfoderProfile } from '@/store/authStore';
import { Button, Input, TextArea, Select, Checkbox, Card } from '@amzn/eero-web-design-components';
import { Dog, Search } from 'lucide-react';

type OnboardingStatus = 'new' | 'contacted' | 'hardware_ordered' | 'waiting_scheduling' | 'scheduled_shapeshift' | 'complete' | 'unresponsive' | 'reclaim';

interface OnboardingRecord {
  email: string;
  name: string;
  status: OnboardingStatus;
  notes: string;
  hardwareOrder: string;
  trackingNumber: string;
  trackingStatus: string;
  appInviteSent: string;
  appProvisioned: boolean;
  networkLink: string;
  followUpDate: string;
  shapeshiftDate: string;
  outreachCount: number;
}

const STATUS_LABELS: Record<OnboardingStatus, string> = {
  new: 'New Registration',
  contacted: 'Contacted by Beta',
  hardware_ordered: 'Hardware Ordered',
  waiting_scheduling: 'Waiting on Scheduling',
  scheduled_shapeshift: 'Scheduled Shapeshift',
  complete: 'Complete',
  unresponsive: 'Unresponsive',
  reclaim: 'Reclaim Units',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default function DogfoodOnboarding() {
  const { users } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OnboardingStatus | 'all'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Local state for onboarding records (persisted per-session, would move to store/DB later)
  const [records, setRecords] = useState<Record<string, OnboardingRecord>>({});

  // Get all dogfooders from the user roster
  const dogfooders = useMemo(() => users.filter((u) => u.role === 'dogfoofer'), [users]);

  // Build combined view
  const rows = useMemo(() => {
    return dogfooders.map((user) => {
      const record = records[user.email] || {
        email: user.email,
        name: user.name,
        status: 'new' as OnboardingStatus,
        notes: '',
        hardwareOrder: '',
        trackingNumber: '',
        trackingStatus: '',
        appInviteSent: '',
        appProvisioned: false,
        networkLink: '',
        followUpDate: '',
        shapeshiftDate: '',
        outreachCount: 0,
      };
      return { ...record, user };
    });
  }, [dogfooders, records]);

  // Filter and search
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, filterStatus, search]);

  // Stats
  const stats = useMemo(() => ({
    total: rows.length,
    new: rows.filter((r) => r.status === 'new').length,
    contacted: rows.filter((r) => r.status === 'contacted').length,
    hardwareOrdered: rows.filter((r) => r.status === 'hardware_ordered').length,
    waitingScheduling: rows.filter((r) => r.status === 'waiting_scheduling').length,
    scheduled: rows.filter((r) => r.status === 'scheduled_shapeshift').length,
    complete: rows.filter((r) => r.status === 'complete').length,
    unresponsive: rows.filter((r) => r.status === 'unresponsive').length,
  }), [rows]);

  const updateRecord = (email: string, updates: Partial<OnboardingRecord>) => {
    setRecords((prev) => ({
      ...prev,
      [email]: { ...(prev[email] || { email, name: '', status: 'new', notes: '', hardwareOrder: '', trackingNumber: '', trackingStatus: '', appInviteSent: '', appProvisioned: false, networkLink: '', followUpDate: '', shapeshiftDate: '', outreachCount: 0 }), ...updates } as OnboardingRecord,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ui-text-text-primary)] flex items-center gap-2">
            <Dog className="w-5 h-5 text-[var(--ui-core-periwinkle-periwinkle-6)]" />
            Dogfood Onboarding Pipeline
          </h2>
          <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">Track dogfooders from registration through to fully onboarded.</p>
        </div>
      </div>

      {/* Stats cards — distinct status hues (decorative, no direct token equivalent) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total" count={stats.total} color="bg-gray-50 border-gray-200" />
        <StatCard label="New" count={stats.new} color="bg-purple-50 border-purple-200" onClick={() => setFilterStatus(filterStatus === 'new' ? 'all' : 'new')} active={filterStatus === 'new'} />
        <StatCard label="Contacted" count={stats.contacted} color="bg-blue-50 border-blue-200" onClick={() => setFilterStatus(filterStatus === 'contacted' ? 'all' : 'contacted')} active={filterStatus === 'contacted'} />
        <StatCard label="HW Ordered" count={stats.hardwareOrdered} color="bg-yellow-50 border-yellow-200" onClick={() => setFilterStatus(filterStatus === 'hardware_ordered' ? 'all' : 'hardware_ordered')} active={filterStatus === 'hardware_ordered'} />
        <StatCard label="Scheduling" count={stats.waitingScheduling} color="bg-orange-50 border-orange-200" onClick={() => setFilterStatus(filterStatus === 'waiting_scheduling' ? 'all' : 'waiting_scheduling')} active={filterStatus === 'waiting_scheduling'} />
        <StatCard label="Scheduled" count={stats.scheduled} color="bg-cyan-50 border-cyan-200" onClick={() => setFilterStatus(filterStatus === 'scheduled_shapeshift' ? 'all' : 'scheduled_shapeshift')} active={filterStatus === 'scheduled_shapeshift'} />
        <StatCard label="Complete" count={stats.complete} color="bg-green-50 border-green-200" onClick={() => setFilterStatus(filterStatus === 'complete' ? 'all' : 'complete')} active={filterStatus === 'complete'} />
        <StatCard label="Unresponsive" count={stats.unresponsive} color="bg-red-50 border-red-200" onClick={() => setFilterStatus(filterStatus === 'unresponsive' ? 'all' : 'unresponsive')} active={filterStatus === 'unresponsive'} />
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            id="onboarding-search"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            prefix={<Search size={16} className="text-[var(--ui-text-text-placeholder)]" />}
          />
        </div>
        {filterStatus !== 'all' && (
          <Button type="text" label="Clear filter" onClick={() => setFilterStatus('all')} />
        )}
        <span className="text-xs text-[var(--ui-text-text-placeholder)] ml-auto">{filteredRows.length} of {rows.length} shown</span>
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <Card size={3}>
          <div className="p-12 text-center">
            <Dog size={48} className="mx-auto text-[var(--ui-text-text-disabled)] mb-4" />
            <p className="text-[var(--ui-text-text-tertiary)]">{rows.length === 0 ? 'No dogfooders have registered yet.' : 'No results match your filter.'}</p>
          </div>
        </Card>
      ) : (
        <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--ui-background-layer-layer-page-hover)] text-xs text-[var(--ui-text-text-tertiary)] uppercase border-b border-[var(--ui-background-layer-border-border-layer-page)]">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone OS</th>
                <th className="px-4 py-3 text-left">Test Group</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Registered</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
              {filteredRows.map((row) => (
                <TableRow
                  key={row.email}
                  row={row}
                  expanded={expandedRow === row.email}
                  onToggle={() => setExpandedRow(expandedRow === row.email ? null : row.email)}
                  onUpdate={(updates) => updateRecord(row.email, updates)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, count, color, onClick, active }: { label: string; count: number; color: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-all ${color} ${active ? 'ring-2 ring-[var(--ui-core-periwinkle-periwinkle-6)]' : ''} ${onClick ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
    >
      <p className="text-xs text-[var(--ui-text-text-tertiary)]">{label}</p>
      <p className="text-xl font-bold text-[var(--ui-text-text-primary)]">{count}</p>
    </button>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function TableRow({ row, expanded, onToggle, onUpdate }: {
  row: OnboardingRecord & { user: User };
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<OnboardingRecord>) => void;
}) {
  const profile = row.user.profile;

  return (
    <>
      <tr className="hover:bg-[var(--ui-background-layer-layer-page-hover)] cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 font-medium text-[var(--ui-text-text-primary)]">{row.user.name}</td>
        <td className="px-4 py-3 text-[var(--ui-text-text-tertiary)]">{row.email}</td>
        <td className="px-4 py-3"><span className="text-xs">{profile?.phoneOS || '—'}</span></td>
        <td className="px-4 py-3"><span className="text-xs">{profile?.testGroup === 'Latest and greatest firmware' ? '🚀 Latest' : profile?.testGroup === 'More mature firmware' ? '🛡️ Mature' : '—'}</span></td>
        <td className="px-4 py-3">
          <div className="w-52" onClick={(e) => e.stopPropagation()}>
            <Select
              id={`onboarding-status-${row.email}`}
              value={row.status}
              onChange={(val: OnboardingStatus) => onUpdate({ status: val })}
              options={STATUS_OPTIONS}
              size="small"
            />
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-[var(--ui-text-text-tertiary)]">{profile?.registeredAt ? new Date(profile.registeredAt).toLocaleDateString() : '—'}</td>
        <td className="px-4 py-3 text-xs text-[var(--ui-text-text-tertiary)] max-w-[200px] truncate">{row.notes || '—'}</td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-[var(--ui-background-layer-layer-page-hover)] border-t border-[var(--ui-background-layer-border-border-layer-page)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" onClick={(e) => e.stopPropagation()}>
              {/* Column 1: Contact & Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Contact & Address</h4>
                <InfoRow label="Phone" value={profile?.phoneNumber} />
                <InfoRow label="Address" value={[profile?.streetAddress, profile?.aptUnit, profile?.city, profile?.state, profile?.zipCode].filter(Boolean).join(', ')} />
                {profile?.preferWorkAddress && <InfoRow label="Work Address" value={[profile?.workStreet, profile?.workFloor, profile?.workCity, profile?.workState, profile?.workZip].filter(Boolean).join(', ')} />}
                <InfoRow label="Production Email" value={profile?.productionEmail} />
                <InfoRow label="Sq. Feet" value={profile?.sqFeet} />
                <InfoRow label="Network" value={profile?.hasEeroNetwork} />
                {profile?.networkEmail && <InfoRow label="Network Email" value={profile.networkEmail} />}
              </div>

              {/* Column 2: Hardware & App */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Hardware & App Access</h4>
                <Input id={`onboarding-hw-${row.email}`} label="Hardware Order #" value={row.hardwareOrder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ hardwareOrder: e.target.value })} placeholder="SO-123456" layout="vertical" />
                <Input id={`onboarding-tracking-${row.email}`} label="Tracking #" value={row.trackingNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ trackingNumber: e.target.value })} placeholder="1Z884AR..." layout="vertical" />
                <Input id={`onboarding-invite-${row.email}`} type="date" label="App Invite Sent" value={row.appInviteSent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ appInviteSent: e.target.value })} layout="vertical" />
                <div className="mt-2">
                  <Checkbox checked={row.appProvisioned} onChange={(e: { target: { checked: boolean } }) => onUpdate({ appProvisioned: e.target.checked })} label="App provisioned & installed" />
                </div>
                <Input id={`onboarding-network-${row.email}`} label="Network Link" value={row.networkLink} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ networkLink: e.target.value })} placeholder="https://admin.e2ro.com/networks/..." layout="vertical" />
              </div>

              {/* Column 3: Scheduling & Notes */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Scheduling & Notes</h4>
                <Input id={`onboarding-followup-${row.email}`} type="date" label="Follow-up Date" value={row.followUpDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ followUpDate: e.target.value })} layout="vertical" />
                <Input id={`onboarding-shapeshift-${row.email}`} type="datetime-local" label="Shapeshift Scheduled" value={row.shapeshiftDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ shapeshiftDate: e.target.value })} layout="vertical" />
                <Input id={`onboarding-outreach-${row.email}`} type="number" min={0} label="Outreach Count" value={row.outreachCount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ outreachCount: parseInt(e.target.value) || 0 })} layout="vertical" />
                <TextArea id={`onboarding-notes-${row.email}`} label="Notes" value={row.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ notes: e.target.value })} rows={3} placeholder="Add notes..." layout="vertical" />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-[var(--ui-text-text-placeholder)]">{label}:</span>
      <span className="text-xs text-[var(--ui-text-text-secondary)] ml-1">{value}</span>
    </div>
  );
}
