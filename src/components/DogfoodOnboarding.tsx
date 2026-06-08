'use client';

import { useState, useMemo } from 'react';
import { useAuthStore, User, DogfoderProfile } from '@/store/authStore';
import { Dog, Search, ChevronDown, ExternalLink } from 'lucide-react';

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

const STATUS_COLORS: Record<OnboardingStatus, string> = {
  new: 'bg-purple-100 text-purple-700',
  contacted: 'bg-blue-100 text-blue-700',
  hardware_ordered: 'bg-yellow-100 text-yellow-700',
  waiting_scheduling: 'bg-orange-100 text-orange-700',
  scheduled_shapeshift: 'bg-cyan-100 text-cyan-700',
  complete: 'bg-green-100 text-green-700',
  unresponsive: 'bg-red-100 text-red-700',
  reclaim: 'bg-gray-100 text-gray-700',
};

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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Dog className="w-5 h-5 text-[#2c3e7a]" />
            Dogfood Onboarding Pipeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track dogfooders from registration through to fully onboarded.</p>
        </div>
      </div>

      {/* Stats cards */}
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
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {filterStatus !== 'all' && (
          <button onClick={() => setFilterStatus('all')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Clear filter</button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filteredRows.length} of {rows.length} shown</span>
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Dog size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{rows.length === 0 ? 'No dogfooders have registered yet.' : 'No results match your filter.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
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
            <tbody className="divide-y divide-gray-100">
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
      className={`rounded-lg border p-3 text-left transition-all ${color} ${active ? 'ring-2 ring-blue-400' : ''} ${onClick ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{count}</p>
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
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 font-medium text-gray-900">{row.user.name}</td>
        <td className="px-4 py-3 text-gray-600">{row.email}</td>
        <td className="px-4 py-3"><span className="text-xs">{profile?.phoneOS || '—'}</span></td>
        <td className="px-4 py-3"><span className="text-xs">{profile?.testGroup === 'Latest and greatest firmware' ? '🚀 Latest' : profile?.testGroup === 'More mature firmware' ? '🛡️ Mature' : '—'}</span></td>
        <td className="px-4 py-3">
          <select
            value={row.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate({ status: e.target.value as OnboardingStatus })}
            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[row.status]}`}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{profile?.registeredAt ? new Date(profile.registeredAt).toLocaleDateString() : '—'}</td>
        <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{row.notes || '—'}</td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-gray-50 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Contact & Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Contact & Address</h4>
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Hardware & App Access</h4>
                <div>
                  <label className="text-xs text-gray-500">Hardware Order #</label>
                  <input type="text" value={row.hardwareOrder} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ hardwareOrder: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-xs" placeholder="SO-123456" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Tracking #</label>
                  <input type="text" value={row.trackingNumber} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ trackingNumber: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-xs" placeholder="1Z884AR..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500">App Invite Sent</label>
                  <input type="date" value={row.appInviteSent} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ appInviteSent: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-xs" />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                  <input type="checkbox" checked={row.appProvisioned} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ appProvisioned: e.target.checked })} className="rounded border-gray-300" />
                  App provisioned & installed
                </label>
                <div>
                  <label className="text-xs text-gray-500">Network Link</label>
                  <input type="text" value={row.networkLink} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ networkLink: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-xs" placeholder="https://admin.e2ro.com/networks/..." />
                </div>
              </div>

              {/* Column 3: Scheduling & Notes */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Scheduling & Notes</h4>
                <div>
                  <label className="text-xs text-gray-500">Follow-up Date</label>
                  <input type="date" value={row.followUpDate} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ followUpDate: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-xs" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Shapeshift Scheduled</label>
                  <input type="datetime-local" value={row.shapeshiftDate} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ shapeshiftDate: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-xs" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Outreach Count</label>
                  <input type="number" min={0} value={row.outreachCount} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ outreachCount: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-xs" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Notes</label>
                  <textarea value={row.notes} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ notes: e.target.value })} rows={3} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-xs resize-none" placeholder="Add notes..." />
                </div>
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
      <span className="text-xs text-gray-400">{label}:</span>
      <span className="text-xs text-gray-700 ml-1">{value}</span>
    </div>
  );
}
