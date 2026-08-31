'use client';

import { useMemo } from 'react';
import { Card } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { usePackagesStore } from '@/store/packagesStore';
import { daysSince, OVERDUE_DAYS } from '@/constants';

// ─── Reusable Components ──────────────────────────────────────────────────────
// KPI tile — follows the Insight stat-row pattern (WDS Card + flex-col metric).
function StatCard({ icon, value, label, iconBg }: { icon: string; value: number; label: string; iconBg: string }) {
  return (
    <Card size={2}>
      <div className="flex flex-col gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
          <span className="text-lg">{icon}</span>
        </div>
        <p className="text-2xl font-medium text-[var(--ui-text-text-primary)]">{value}</p>
        <p className="text-xs text-[var(--ui-text-text-tertiary)]">{label}</p>
      </div>
    </Card>
  );
}

function DonutChart({ title, items, total, size, strokeWidth, centerLabel, centerValue }: {
  title: string; items: { name: string; count: number; color: string }[]; total: number; size: number; strokeWidth: number; centerLabel: string; centerValue?: string | number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const arcData = items.map((item) => {
    const dash = total > 0 ? (item.count / total) * circ : 0;
    const arc = { dash, offset, color: item.color };
    offset += dash;
    return arc;
  });

  return (
    <Card size={3}>
      <p className="mb-4 text-xs font-bold uppercase text-[var(--ui-text-text-secondary)]">{title}</p>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--ui-core-gray-gray-2)" strokeWidth={strokeWidth} />
            {arcData.map((arc, i) => (
              <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={arc.color} strokeWidth={strokeWidth}
                strokeDasharray={`${arc.dash} ${circ - arc.dash}`} strokeDashoffset={-arc.offset} />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
            {(() => {
              const display = centerValue !== undefined ? centerValue : (total > 0 ? total.toLocaleString() : items.length);
              const isText = typeof display === 'string' && isNaN(Number(display));
              const fontSize = isText ? (display.length > 8 ? '11px' : '13px') : (size > 130 ? '20px' : '18px');
              return <span className="font-bold text-[var(--ui-text-text-primary)]" style={{ fontSize, lineHeight: 1.1 }}>{display}</span>;
            })()}
            <span className="mt-0.5 uppercase text-[var(--ui-text-text-tertiary)]" style={{ fontSize: size > 130 ? '9px' : '8px' }}>{centerLabel}</span>
          </div>
        </div>
        <div className="flex flex-col" style={{ gap: size > 130 ? '6px' : '4px', fontSize: size > 130 ? '12px' : '11px' }}>
          {items.map((item, i) => (
            <div key={i} className="flex items-center" style={{ gap: size > 130 ? '8px' : '6px' }}>
              <span className="inline-block shrink-0 rounded-[2px]" style={{ width: size > 130 ? '10px' : '8px', height: size > 130 ? '10px' : '8px', backgroundColor: item.color }} />
              <span className="text-[var(--ui-text-text-secondary)]">{item.name}</span>
              <b className="text-[var(--ui-text-text-primary)]">{item.count}</b>
              <span className="text-[var(--ui-core-gray-gray-5)]">{total > 0 ? Math.round((item.count / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function BarRow({ letter, label, width, color, count }: { letter: string; label: string; width: string; color: string; count?: number }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="w-3.5 text-sm font-bold text-[var(--ui-text-text-primary)]">{letter}</span>
      <span className="w-40 shrink-0 text-sm text-[var(--ui-text-text-secondary)]">· {label}</span>
      <div className="h-3.5 flex-1 overflow-hidden rounded-[2px] bg-[var(--ui-core-gray-gray-2)]">
        <div className="h-full rounded-[2px]" style={{ width: count === 0 ? '0%' : width, backgroundColor: color }} />
      </div>
      <span className="w-5 text-right text-xs text-[var(--ui-text-text-tertiary)]">{count ?? ''}</span>
    </div>
  );
}

function PriorityRow({ count, label, width, color, right }: { count: number; label: string; width: string; color: string; right: number }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <span className="w-5 text-right text-sm font-medium text-[var(--ui-text-text-primary)]">{count}</span>
      <span className="w-40 shrink-0 text-xs text-[var(--ui-text-text-secondary)]">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-[2px] bg-[var(--ui-core-gray-gray-2)]">
        <div className="h-full rounded-[2px]" style={{ width, backgroundColor: color }} />
      </div>
      <span className="w-5 text-right text-sm font-medium text-[var(--ui-text-text-primary)]">{right}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
// Chart series colors mapped to EDS core color tokens (no hardcoded hex).
const REGION_COLORS = [
  'var(--ui-core-periwinkle-periwinkle-6)', 'var(--ui-core-green-green-6)', 'var(--ui-core-orange-orange-5)',
  'var(--ui-core-red-red-6)', 'var(--ui-core-purple-purple-6)', 'var(--ui-core-turquoise-turquoise-6)',
  'var(--ui-core-ocean-blue-ocean-6)', 'var(--ui-core-yellow-yellow-5)', 'var(--ui-core-terracotta-terracotta-6)',
  'var(--ui-core-midnight-midnight-6)',
];
const MODEL_COLORS = [
  'var(--ui-core-midnight-midnight-8)', 'var(--ui-core-orange-orange-5)', 'var(--ui-core-green-green-6)',
  'var(--ui-core-red-red-6)', 'var(--ui-core-purple-purple-6)', 'var(--ui-core-turquoise-turquoise-6)',
  'var(--ui-core-ocean-blue-ocean-6)', 'var(--ui-core-yellow-yellow-5)', 'var(--ui-core-terracotta-terracotta-6)',
  'var(--ui-core-periwinkle-periwinkle-6)',
];

function groupAndSort(devices: any[], keyFn: (d: any) => string, colors: string[]) {
  const map: Record<string, number> = {};
  devices.forEach((d) => { const k = keyFn(d); map[k] = (map[k] || 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count], i) => ({ name, count, color: colors[i % colors.length] }));
}

export default function OverviewDashboard() {
  const { devices, jiraTickets } = useDeviceStore();
  const { serviceOrders, shapeshiftJobs } = usePackagesStore();

  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const notOnline = devices.filter((d) => d.status === 'not_online').length;
  const countries = new Set(devices.map((d) => d.country).filter(Boolean)).size;
  const programs = new Set(devices.filter((d) => d.status !== 'deactivated').map((d) => d.program)).size;
  const people = new Set(devices.map((d) => d.assignedEmail).filter(Boolean)).size;
  const overdue = devices.filter((d) => d.status === 'pending_return' && daysSince(d.returnEmailSentAt) >= OVERDUE_DAYS).length;

  const regionItems = useMemo(() => groupAndSort(devices, (d) => d.country || 'Unknown', REGION_COLORS), [devices]);
  const modelItems = useMemo(() => groupAndSort(devices, (d) => d.product || d.internalName || d.model || 'Unknown', MODEL_COLORS), [devices]);

  const statusItems = useMemo(() => [
    { name: 'Online', count: online, color: 'var(--ui-core-periwinkle-periwinkle-6)' },
    { name: 'Not Online', count: notOnline, color: 'var(--ui-core-gray-gray-6)' },
  ].filter((d) => d.count > 0), [online, notOnline]);

  // Service Orders — live from store
  const soOpen = serviceOrders.filter((o) => ['intake', 'triage', 'assigned'].includes(o.status)).length;
  const soInProgress = serviceOrders.filter((o) => o.status === 'in_progress').length;
  const soComplete = serviceOrders.filter((o) => o.status === 'completed').length;
  const soOnHold = serviceOrders.filter((o) => o.status === 'on_hold').length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const soClosed30d = serviceOrders.filter((o) => o.status === 'completed' && o.completedAt && o.completedAt >= thirtyDaysAgo).length;
  const soCancelled = serviceOrders.filter((o) => o.status === 'cancelled').length;
  const soTotal = serviceOrders.length;

  // By Job Type — live counts from service orders
  const returnedCount = serviceOrders.filter((o) => o.type === 'returned_to_eero').length;
  const defectiveCount = serviceOrders.filter((o) => o.type === 'defective').length;
  const endProgramCount = serviceOrders.filter((o) => o.type === 'end_of_program').length;
  const lostCount = serviceOrders.filter((o) => o.type === 'lost').length;
  const outboundShipments = serviceOrders.filter((o) => o.type === 'outbound_shipment').length;
  const otherCount = serviceOrders.filter((o) => o.type === 'other').length;
  const jobTypeMax = Math.max(returnedCount, defectiveCount, endProgramCount, lostCount, outboundShipments, otherCount, 1);

  // By Priority — live from JIRA tickets
  const openTickets = jiraTickets.filter((t) => t.status === 'open' || t.status === 'in_progress');
  const triageCount = openTickets.filter((t) => t.status === 'open').length;
  const onHoldCount = serviceOrders.filter((o) => o.status === 'on_hold').length;
  const intakeCount = serviceOrders.filter((o) => o.status === 'intake').length;
  const completedCount = jiraTickets.filter((t) => t.status === 'closed' || t.status === 'resolved').length;
  const backlogCount = jiraTickets.filter((t) => t.status === 'in_progress').length;
  const priorityMax = Math.max(triageCount, onHoldCount, intakeCount, completedCount, backlogCount, 1);

  // Top Assignees
  const topAssignees = useMemo(() => {
    const map: Record<string, number> = {};
    serviceOrders.filter((o) => !['completed', 'cancelled'].includes(o.status)).forEach((o) => { if (o.assignee) map[o.assignee] = (map[o.assignee] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [serviceOrders]);

  return (
    <div className="space-y-4">
      {/* ROW 1: Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <StatCard icon="💻" value={total} label="Total Devices" iconBg="var(--ui-core-periwinkle-periwinkle-2)" />
        <StatCard icon="✓" value={online} label="Online" iconBg="var(--ui-core-green-green-2)" />
        <StatCard icon="👥" value={notOnline} label="Not Online" iconBg="var(--ui-core-yellow-yellow-2)" />
        <StatCard icon="🌍" value={countries} label="Countries" iconBg="var(--ui-core-red-red-2)" />
        <StatCard icon="🔬" value={programs} label="Programs" iconBg="var(--ui-core-purple-purple-2)" />
        <StatCard icon="👤" value={people} label="People" iconBg="var(--ui-core-periwinkle-periwinkle-2)" />
        <StatCard icon="⚠️" value={overdue} label="Overdue" iconBg="var(--ui-core-yellow-yellow-2)" />
        <StatCard icon="⚡" value={shapeshiftJobs.filter((j) => j.status === 'success').length} label="Shapeshifted" iconBg="var(--ui-core-purple-purple-2)" />
      </div>

      {/* ROW 2: Three Donut Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DonutChart title="Status Breakdown" items={statusItems} total={total} size={140} strokeWidth={24} centerLabel="Devices" />
        <DonutChart title="Top Regions" items={regionItems} total={total} size={120} strokeWidth={20} centerLabel="Regions" centerValue={regionItems.length} />
        <DonutChart title="Top Models" items={modelItems} total={total} size={120} strokeWidth={20} centerLabel="Top Model" centerValue={modelItems[0]?.name || '—'} />
      </div>

      {/* ROW 3: Service Orders */}
      <Card
        size={5}
        title={
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium text-[var(--ui-text-text-primary)]">Service Orders</span>
            <span className="text-sm text-[var(--ui-text-text-tertiary)]">{soTotal} total</span>
          </div>
        }
      >
        {/* Segmented bar — always show all 6 segments with equal width, separated by gaps */}
        <div className="mb-1 flex h-7 gap-2">
          <div className="flex-1 rounded" style={{ backgroundColor: soOpen > 0 ? 'var(--ui-core-periwinkle-periwinkle-6)' : 'var(--ui-core-gray-gray-3)' }} />
          <div className="flex-1 rounded" style={{ backgroundColor: soInProgress > 0 ? 'var(--ui-core-orange-orange-6)' : 'var(--ui-core-gray-gray-3)' }} />
          <div className="flex-1 rounded" style={{ backgroundColor: soComplete > 0 ? 'var(--ui-core-green-green-6)' : 'var(--ui-core-gray-gray-3)' }} />
          <div className="flex-1 rounded" style={{ backgroundColor: soOnHold > 0 ? 'var(--ui-core-gray-gray-6)' : 'var(--ui-core-gray-gray-3)' }} />
          <div className="flex-1 rounded" style={{ backgroundColor: soClosed30d > 0 ? 'var(--ui-core-green-green-3)' : 'var(--ui-core-gray-gray-3)' }} />
          <div className="flex-1 rounded" style={{ backgroundColor: soCancelled > 0 ? 'var(--ui-core-red-red-8)' : 'var(--ui-core-gray-gray-3)' }} />
        </div>

        {/* Numbers */}
        <div className="mb-6 flex">
          <div className="flex-1"><span className="text-lg font-bold text-[var(--ui-core-periwinkle-periwinkle-6)]">{soOpen}</span><br /><span className="text-xs text-[var(--ui-text-text-tertiary)]">Open</span></div>
          <div className="flex-1"><span className="text-sm font-bold text-[var(--ui-text-text-primary)]">{soInProgress}</span><br /><span className="text-xs text-[var(--ui-text-text-tertiary)]">In progress</span></div>
          <div className="flex-1"><span className="text-sm font-bold text-[var(--ui-core-green-green-6)]">{soComplete}</span><br /><span className="text-xs text-[var(--ui-text-text-tertiary)]">Complete</span></div>
          <div className="flex-1"><span className="text-sm font-bold text-[var(--ui-text-text-primary)]">{soOnHold}</span><br /><span className="text-xs text-[var(--ui-text-text-tertiary)]">On hold</span></div>
          <div className="flex-1"><span className="text-xs text-[var(--ui-text-text-primary)]">{soClosed30d}</span><br /><span className="text-xs text-[var(--ui-text-text-tertiary)]">Closed 30d</span></div>
          <div className="flex-1"><span className="text-sm font-bold text-[var(--ui-core-red-red-8)]">{soCancelled}</span><br /><span className="text-xs text-[var(--ui-text-text-tertiary)]">Cancelled</span></div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-12">
          <div>
            <p className="mb-3 text-xs font-bold uppercase text-[var(--ui-text-text-primary)]">By Job Type</p>
            <BarRow letter="R" label="Returned to eero" width={`${(returnedCount / jobTypeMax) * 100}%`} color="var(--ui-core-periwinkle-periwinkle-6)" count={returnedCount} />
            <BarRow letter="D" label="Defective / Hardware" width={`${(defectiveCount / jobTypeMax) * 100}%`} color="var(--ui-core-red-red-6)" count={defectiveCount} />
            <BarRow letter="E" label="End of program phase" width={`${(endProgramCount / jobTypeMax) * 100}%`} color="var(--ui-core-orange-orange-5)" count={endProgramCount} />
            <BarRow letter="L" label="Lost / Unrecoverable" width={`${(lostCount / jobTypeMax) * 100}%`} color="var(--ui-core-midnight-midnight-7)" count={lostCount} />
            <BarRow letter="T" label="Outbound Shipment" width={`${(outboundShipments / jobTypeMax) * 100}%`} color="var(--ui-core-periwinkle-periwinkle-7)" count={outboundShipments} />
            <BarRow letter="O" label="Other" width={`${(otherCount / jobTypeMax) * 100}%`} color="var(--ui-core-gray-gray-6)" count={otherCount} />
            <p className="mb-2 mt-6 text-xs font-bold uppercase text-[var(--ui-text-text-primary)]">Top Assignees (Open)</p>
            {topAssignees.length === 0 && <p className="text-sm text-[var(--ui-core-gray-gray-5)]">No open assignments</p>}
            {topAssignees.map(([name], i) => <p key={i} className="my-0.5 text-sm text-[var(--ui-text-text-secondary)]">{name}</p>)}
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase text-[var(--ui-text-text-primary)]">By Priority (Open - JIRA)</p>
            <PriorityRow count={triageCount} label="P0 — Triage & Investigate" width={`${(triageCount / priorityMax) * 100}%`} color="var(--ui-core-red-red-6)" right={triageCount} />
            <PriorityRow count={onHoldCount} label="P1 — On Hold" width={`${(onHoldCount / priorityMax) * 100}%`} color="var(--ui-core-orange-orange-5)" right={onHoldCount} />
            <PriorityRow count={intakeCount} label="P2 — Intake" width={`${(intakeCount / priorityMax) * 100}%`} color="var(--ui-core-yellow-yellow-5)" right={intakeCount} />
            <PriorityRow count={completedCount} label="P3 — Completed" width={`${(completedCount / priorityMax) * 100}%`} color="var(--ui-core-green-green-6)" right={completedCount} />
            <PriorityRow count={backlogCount} label="P4 — Low / Backlog" width={`${(backlogCount / priorityMax) * 100}%`} color="var(--ui-core-periwinkle-periwinkle-6)" right={backlogCount} />
          </div>
        </div>
      </Card>
    </div>
  );
}
