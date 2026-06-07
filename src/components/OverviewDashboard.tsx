'use client';

import { useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { usePackagesStore } from '@/store/packagesStore';
import AgentChat from './AgentChat';

export default function OverviewDashboard() {
  const { devices } = useDeviceStore();
  const { serviceOrders } = usePackagesStore();

  // ─── Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    notOnline: devices.filter((d) => d.status === 'not_online').length,
    pendingReturn: devices.filter((d) => d.status === 'pending_return').length,
    deactivated: devices.filter((d) => d.status === 'deactivated').length,
    programs: [...new Set(devices.filter((d) => d.status !== 'deactivated').map((d) => d.program))].length,
  }), [devices]);

  // ─── Donut data ─────────────────────────────────────────────────────
  const statusData = useMemo(() => [
    { name: 'Online', value: stats.online, color: '#3b82f6' },
    { name: 'Not Online', value: stats.notOnline, color: '#6b7280' },
    { name: 'Pending Return', value: stats.pendingReturn, color: '#f59e0b' },
    { name: 'Deactivated', value: stats.deactivated, color: '#10b981' },
  ], [stats]);

  const regionData = useMemo(() => {
    const map: Record<string, number> = {};
    devices.forEach((d) => { const c = d.country || 'Unknown'; map[c] = (map[c] || 0) + 1; });
    const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#ec4899', '#0891b2', '#65a30d', '#e11d48', '#4f46e5'];
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [devices]);

  const modelData = useMemo(() => {
    const map: Record<string, number> = {};
    devices.forEach((d) => { const m = d.product || d.internalName || d.model || 'Unknown'; map[m] = (map[m] || 0) + 1; });
    const colors = ['#1e3a5f', '#d97706', '#059669', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#ec4899', '#e11d48', '#4f46e5'];
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [devices]);

  // ─── Service orders ─────────────────────────────────────────────────
  const orderStats = useMemo(() => {
    const open = serviceOrders.filter((o) => ['intake', 'triage', 'assigned'].includes(o.status)).length;
    const inProgress = serviceOrders.filter((o) => o.status === 'in_progress').length;
    const complete = serviceOrders.filter((o) => o.status === 'completed').length;
    const onHold = serviceOrders.filter((o) => o.status === 'on_hold').length;
    const cancelled = serviceOrders.filter((o) => o.status === 'cancelled').length;

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byAssignee: Record<string, number> = {};
    serviceOrders.forEach((o) => {
      byType[o.type] = (byType[o.type] || 0) + 1;
      if (!['completed', 'cancelled'].includes(o.status)) {
        byPriority[o.priority] = (byPriority[o.priority] || 0) + 1;
        if (o.site) byRegion[o.site] = (byRegion[o.site] || 0) + 1;
        if (o.assignee) byAssignee[o.assignee] = (byAssignee[o.assignee] || 0) + 1;
      }
    });

    return { total: serviceOrders.length, open, inProgress, complete, onHold, cancelled, byType, byPriority, byRegion, byAssignee };
  }, [serviceOrders]);

  const maxType = Math.max(...Object.values(orderStats.byType), 1);
  const maxPriority = Math.max(...Object.values(orderStats.byPriority), 1);

  return (
    <div className="space-y-6">
      {/* AI Agent */}
      <AgentChat />

      {/* ═══ SECTION 1: Stat Cards ═══ */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-[11px] text-gray-400 uppercase font-medium">Total Devices</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[11px] text-gray-500 uppercase font-medium">Online</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.online}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[11px] text-gray-500 uppercase font-medium">Not Online</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.notOnline}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[11px] text-gray-500 uppercase font-medium">Pending Return</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingReturn}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[11px] text-gray-500 uppercase font-medium">Deactivated</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.deactivated}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[11px] text-gray-500 uppercase font-medium">Programs Active</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.programs}</p>
        </div>
      </div>

      {/* ═══ SECTION 2: Three Donut Charts ═══ */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-bold text-gray-900 uppercase mb-4">Status Breakdown</p>
          <Donut data={statusData} total={stats.total} label="TOTAL" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-bold text-gray-900 uppercase mb-4">Top Regions</p>
          <Donut data={regionData} total={devices.length} label="REGIONS" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-bold text-gray-900 uppercase mb-4">Top Models</p>
          <Donut data={modelData} total={devices.length} label="MODELS" />
        </div>
      </div>

      {/* ═══ SECTION 3: Service Orders ═══ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-baseline gap-3 mb-5">
          <p className="text-base font-bold text-gray-900">Service Orders</p>
          <span className="text-sm text-gray-400">{orderStats.total} total</span>
        </div>

        {/* Segmented colored bar with numbers+labels above */}
        {(() => {
          const segs = [
            { value: orderStats.open, label: 'Open', color: '#2563eb' },
            { value: orderStats.inProgress, label: 'In progress', color: '#b45309' },
            { value: orderStats.complete, label: 'Complete', color: '#15803d' },
            { value: orderStats.onHold, label: 'On hold', color: '#6b7280' },
            { value: 0, label: 'Closed 30d', color: '#86efac' },
            { value: orderStats.cancelled, label: 'Cancelled', color: '#991b1b' },
          ];
          const total = Math.max(segs.reduce((s, seg) => s + seg.value, 0), 1);
          return (
            <div className="relative mb-8">
              {/* Numbers + labels row */}
              <div className="flex">
                {segs.map((seg, i) => (
                  <div key={i} style={{ width: `${100 / segs.length}%` }} className="pr-4">
                    {seg.value > 0 && <p className="text-xl font-bold text-gray-900">{seg.value}</p>}
                    {seg.value > 0 && <p className="text-[11px] text-gray-500">{seg.label}</p>}
                  </div>
                ))}
              </div>
              {/* Colored bar */}
              <div className="flex h-6 rounded-sm overflow-hidden mt-2">
                {segs.map((seg, i) => {
                  if (total <= 1 && i === 0) return <div key={i} className="flex-1" style={{ backgroundColor: seg.color }} />;
                  const pct = (seg.value / total) * 100;
                  if (seg.value === 0) return <div key={i} style={{ width: `${100/segs.length}%`, backgroundColor: '#f3f4f6' }} />;
                  return <div key={i} style={{ width: `${pct}%`, backgroundColor: seg.color }} />;
                })}
              </div>
              {/* Labels below for zero-value segments */}
              <div className="flex mt-1">
                {segs.map((seg, i) => (
                  <div key={i} style={{ width: `${100 / segs.length}%` }}>
                    {seg.value === 0 && <p className="text-[10px] text-gray-400">{seg.label}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-12">
          {/* LEFT: By Job Type + Assignees */}
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase mb-4">By Job Type</p>
            <table className="w-full">
              <tbody>
                {[
                  { letter: 'S', label: 'Swap', key: 'swap', color: '#7c3aed' },
                  { letter: 'T', label: 'Outbound Shipment', key: 'outbound_shipment', color: '#1d4ed8' },
                  { letter: 'O', label: 'Other', key: 'other', color: '#374151' },
                ].map((t) => {
                  const count = orderStats.byType[t.key] || 0;
                  return (
                    <tr key={t.key} className="h-8">
                      <td className="text-sm font-bold text-gray-900 w-6 align-middle">{t.letter}</td>
                      <td className="text-sm text-gray-600 w-40 align-middle whitespace-nowrap">· {t.label}</td>
                      <td className="align-middle">
                        <div className="h-5 bg-gray-100 rounded-sm overflow-hidden">
                          <div className="h-full" style={{ width: `${count / maxType * 100}%`, backgroundColor: t.color }} />
                        </div>
                      </td>
                      <td className="text-sm text-gray-500 w-8 text-right align-middle">{count || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {Object.keys(orderStats.byAssignee).length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-bold text-gray-900 uppercase mb-2">Top Assignees (Open)</p>
                {Object.entries(orderStats.byAssignee).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => (
                  <p key={name} className="text-sm text-gray-600 mb-0.5">{name}</p>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: By Priority + By Site */}
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase mb-4">By Priority (Open)</p>
            <table className="w-full">
              <tbody>
                {[
                  { key: 'P0', label: 'P0 — Emergency / Blocking', color: '#dc2626' },
                  { key: 'P1', label: 'P1 — Critical', color: '#ea580c' },
                  { key: 'P2', label: 'P2 — Corrective', color: '#ca8a04' },
                  { key: 'P3', label: 'P3 — Routine', color: '#16a34a' },
                  { key: 'P4', label: 'P4 — Low / Backlog', color: '#2563eb' },
                ].map((p) => {
                  const count = orderStats.byPriority[p.key] || 0;
                  return (
                    <tr key={p.key} className="h-7">
                      <td className="text-sm text-gray-700 w-6 text-right align-middle">{count}</td>
                      <td className="text-sm text-gray-600 pl-2 w-44 align-middle whitespace-nowrap">{p.label}</td>
                      <td className="align-middle px-2">
                        <div className="h-4 bg-gray-100 rounded-sm overflow-hidden">
                          <div className="h-full" style={{ width: `${count / maxPriority * 100}%`, backgroundColor: p.color }} />
                        </div>
                      </td>
                      <td className="text-sm text-gray-700 w-6 text-right align-middle">{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-8">
              <p className="text-xs font-bold text-gray-900 uppercase mb-2">By Site (Open)</p>
              {Object.keys(orderStats.byRegion).length > 0 ? (
                Object.entries(orderStats.byRegion).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([region, count]) => (
                  <div key={region} className="flex gap-3 text-sm mb-0.5">
                    <span className="font-medium w-5 text-right">{count}</span>
                    <span className="text-gray-600">{region}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DONUT CHART
// ═══════════════════════════════════════════════════════════════════════════════
function Donut({ data, total, label }: { data: { name: string; value: number; color: string }[]; total: number; label: string }) {
  const size = 140;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.filter((d) => d.value > 0).map((d) => {
            const len = (d.value / total) * circ;
            const cur = offset;
            offset += len;
            return <circle key={d.name} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color} strokeWidth={stroke} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-cur} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{total}</span>
          <span className="text-[9px] text-gray-500 uppercase">{label}</span>
        </div>
      </div>
      <div className="space-y-1 min-w-0">
        {data.filter((d) => d.value > 0).map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-700 truncate">{d.name}</span>
            <span className="text-gray-400 ml-auto whitespace-nowrap">{d.value} {Math.round((d.value/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// End of file
