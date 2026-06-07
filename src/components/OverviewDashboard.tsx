'use client';

import { useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { usePackagesStore } from '@/store/packagesStore';
import AgentChat from './AgentChat';

// ─── Donut Chart Component ────────────────────────────────────────────────────
function DonutChart({ data, total, label }: { data: { name: string; value: number; color: string }[]; total: number; label: string }) {
  const size = 160;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.filter((d) => d.value > 0).map((segment) => {
            const segmentLength = (segment.value / total) * circumference;
            const currentOffset = offset;
            offset += segmentLength;
            return (
              <circle
                key={segment.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-currentOffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-500 uppercase">{label}</span>
        </div>
      </div>
      <div className="space-y-1">
        {data.filter((d) => d.value > 0).map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-700">{d.name}</span>
            <span className="text-gray-400 ml-auto">{d.value} {total > 0 ? `${Math.round((d.value / total) * 100)}%` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────
function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
        <div className="h-full rounded" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-6 text-right">{value}</span>
    </div>
  );
}

// ─── Status Segment Bar ───────────────────────────────────────────────────────
function StatusBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="h-6 bg-gray-100 rounded-lg" />;
  return (
    <div className="flex h-6 rounded-lg overflow-hidden bg-gray-100">
      {segments.filter((s) => s.value > 0).map((seg) => (
        <div
          key={seg.label}
          className="flex items-center justify-center text-[9px] font-bold text-white transition-all"
          style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color, minWidth: '24px' }}
          title={`${seg.label}: ${seg.value}`}
        >
          {seg.value}
          <span className="ml-1 hidden sm:inline font-normal">{seg.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OverviewDashboard() {
  const { devices, testerProfiles } = useDeviceStore();
  const { serviceOrders, shapeshiftJobs, inboundPackages, outboundPackages } = usePackagesStore();

  const stats = useMemo(() => {
    const online = devices.filter((d) => d.status === 'online').length;
    const notOnline = devices.filter((d) => d.status === 'not_online').length;
    const pendingReturn = devices.filter((d) => d.status === 'pending_return').length;
    const deactivated = devices.filter((d) => d.status === 'deactivated').length;
    const activePrograms = [...new Set(devices.filter((d) => d.status !== 'deactivated').map((d) => d.program))].length;
    return { total: devices.length, online, notOnline, pendingReturn, deactivated, activePrograms };
  }, [devices]);

  // Status breakdown for donut
  const statusData = useMemo(() => [
    { name: 'Online', value: stats.online, color: '#22c55e' },
    { name: 'Not Online', value: stats.notOnline, color: '#eab308' },
    { name: 'Pending Return', value: stats.pendingReturn, color: '#f97316' },
    { name: 'Deactivated', value: stats.deactivated, color: '#94a3b8' },
  ], [stats]);

  // Top regions
  const regionData = useMemo(() => {
    const map: Record<string, number> = {};
    devices.forEach((d) => { const c = d.country || 'Unknown'; map[c] = (map[c] || 0) + 1; });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [devices]);

  // Top models/products
  const modelData = useMemo(() => {
    const map: Record<string, number> = {};
    devices.forEach((d) => { const m = d.product || d.internalName || d.model || 'Unknown'; map[m] = (map[m] || 0) + 1; });
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [devices]);

  // Service orders breakdown
  const orderStats = useMemo(() => {
    const byStatus: Record<string, number> = { intake: 0, triage: 0, assigned: 0, in_progress: 0, on_hold: 0, completed: 0, cancelled: 0 };
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byAssignee: Record<string, number> = {};

    serviceOrders.forEach((o) => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      byType[o.type] = (byType[o.type] || 0) + 1;
      if (o.status !== 'completed' && o.status !== 'cancelled') {
        byPriority[o.priority] = (byPriority[o.priority] || 0) + 1;
        if (o.site) byRegion[o.site] = (byRegion[o.site] || 0) + 1;
        if (o.assignee) byAssignee[o.assignee] = (byAssignee[o.assignee] || 0) + 1;
      }
    });

    return { byStatus, byType, byPriority, byRegion, byAssignee, total: serviceOrders.length };
  }, [serviceOrders]);

  const typeColors: Record<string, string> = { swap: '#f97316', repair: '#dc2626', new_testbed: '#22c55e', outbound_shipment: '#3b82f6', other: '#6b7280' };
  const typeLabels: Record<string, string> = { swap: 'S · Swap', repair: 'R · Repair', new_testbed: 'N · New Testbed', outbound_shipment: 'T · Outbound Shipment', other: 'O · Other' };
  const priorityColors: Record<string, string> = { P0: '#dc2626', P1: '#ef4444', P2: '#f97316', P3: '#eab308', P4: '#3b82f6', P5: '#94a3b8' };

  const maxType = Math.max(...Object.values(orderStats.byType), 1);
  const maxPriority = Math.max(...Object.values(orderStats.byPriority), 1);
  const maxRegion = Math.max(...Object.values(orderStats.byRegion), 1);

  return (
    <div className="space-y-6">
      {/* AI Agent */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <AgentChat />
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Devices', value: stats.total, bg: 'bg-gray-900', text: 'text-white' },
          { label: 'Online', value: stats.online, bg: 'bg-white', text: 'text-green-600' },
          { label: 'Not Online', value: stats.notOnline, bg: 'bg-white', text: 'text-yellow-600' },
          { label: 'Pending Return', value: stats.pendingReturn, bg: 'bg-white', text: 'text-orange-600' },
          { label: 'Deactivated', value: stats.deactivated, bg: 'bg-white', text: 'text-gray-500' },
          { label: 'Programs Active', value: stats.activePrograms, bg: 'bg-white', text: 'text-blue-600' },
        ].map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl border border-gray-200 p-4`}>
            <p className={`text-3xl font-bold ${card.text}`}>{card.value}</p>
            <p className={`text-xs mt-1 ${card.bg === 'bg-gray-900' ? 'text-gray-300' : 'text-gray-500'}`}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Donut charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Breakdown</h3>
          <DonutChart data={statusData} total={stats.total} label="TOTAL" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Regions</h3>
          <DonutChart data={regionData} total={devices.length} label="REGIONS" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Models</h3>
          <DonutChart data={modelData} total={devices.length} label="MODELS" />
        </div>
      </div>

      {/* Service Orders section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-base font-bold text-gray-900">Service Orders</h3>
          <span className="text-sm text-gray-400">{orderStats.total} total</span>
        </div>

        {/* Segmented status bar with numbers above each segment */}
        {(() => {
          const segments = [
            { label: 'Open', value: (orderStats.byStatus.intake || 0) + (orderStats.byStatus.triage || 0) + (orderStats.byStatus.assigned || 0), color: '#2563eb' },
            { label: 'In progress', value: orderStats.byStatus.in_progress || 0, color: '#b45309' },
            { label: 'Complete', value: orderStats.byStatus.completed || 0, color: '#15803d' },
            { label: 'On hold', value: orderStats.byStatus.on_hold || 0, color: '#6b7280' },
            { label: 'Closed 30d', value: 0, color: '#a7f3d0' },
            { label: 'Cancelled', value: orderStats.byStatus.cancelled || 0, color: '#7f1d1d' },
          ];
          const total = Math.max(segments.reduce((s, seg) => s + seg.value, 0), 1);
          return (
            <div className="mb-6">
              {/* Numbers + labels above bar */}
              <div className="flex mb-1">
                {segments.map((seg) => {
                  const pct = (seg.value / total) * 100;
                  const width = seg.value > 0 ? Math.max(pct, 8) : (100 / segments.length);
                  return (
                    <div key={seg.label} style={{ width: `${width}%` }}>
                      <p className="text-lg font-bold text-gray-900">{seg.value}</p>
                      <p className="text-[11px] text-gray-500 -mt-0.5">{seg.label}</p>
                    </div>
                  );
                })}
              </div>
              {/* Colored bar */}
              <div className="flex h-5 rounded-sm overflow-hidden">
                {segments.map((seg) => {
                  const pct = (seg.value / total) * 100;
                  if (seg.value === 0 && total > 1) return <div key={seg.label} style={{ width: `${100 / segments.length}%`, backgroundColor: '#f3f4f6' }} />;
                  return <div key={seg.label} style={{ width: `${Math.max(pct, seg.value > 0 ? 4 : (100 / segments.length))}%`, backgroundColor: seg.value > 0 ? seg.color : '#f3f4f6' }} />;
                })}
              </div>
            </div>
          );
        })()}

        {/* Two columns — clean, aligned layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            {/* By Job Type */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase mb-4">By Job Type</h4>
              <div className="space-y-3">
                {[
                  { letter: 'S', label: 'Swap', key: 'swap', color: '#7c3aed' },
                  { letter: 'T', label: 'Outbound Shipment', key: 'outbound_shipment', color: '#1d4ed8' },
                  { letter: 'O', label: 'Other', key: 'other', color: '#374151' },
                ].map((type) => {
                  const count = orderStats.byType[type.key] || 0;
                  return (
                    <div key={type.key} className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 w-4">{type.letter}</span>
                      <span className="text-sm text-gray-600 w-36 shrink-0">· {type.label}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-sm overflow-hidden">
                        <div className="h-full rounded-sm" style={{ width: `${maxType > 0 ? (count / maxType) * 100 : 0}%`, backgroundColor: type.color }} />
                      </div>
                      <span className="text-sm text-gray-500 w-6 text-right">{count || ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Program */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase mb-3">By Program</h4>
              {(() => {
                const byProgram: Record<string, number> = {};
                serviceOrders.forEach((o) => { const ep = o.epicKey || 'Unknown'; byProgram[ep] = (byProgram[ep] || 0) + 1; });
                if (Object.keys(byProgram).length === 0) return <p className="text-sm text-gray-400">No data</p>;
                return (
                  <div className="space-y-1.5">
                    {Object.entries(byProgram).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([prog, count]) => (
                      <div key={prog} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{prog}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Top Assignees */}
            {Object.keys(orderStats.byAssignee).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase mb-3">Top Assignees (Open)</h4>
                <div className="space-y-1.5">
                  {Object.entries(orderStats.byAssignee).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => (
                    <p key={name} className="text-sm text-gray-600">{name}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            {/* By Priority */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase mb-4">By Priority (Open)</h4>
              <div className="space-y-2.5">
                {[
                  { key: 'P0', label: 'P0 — Emergency / Blocking', color: '#dc2626' },
                  { key: 'P1', label: 'P1 — Critical', color: '#ea580c' },
                  { key: 'P2', label: 'P2 — Corrective', color: '#ca8a04' },
                  { key: 'P3', label: 'P3 — Routine', color: '#16a34a' },
                  { key: 'P4', label: 'P4 — Low / Backlog', color: '#2563eb' },
                ].map((p) => {
                  const count = orderStats.byPriority[p.key] || 0;
                  return (
                    <div key={p.key} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 w-5 text-right">{count}</span>
                      <span className="text-sm text-gray-600 w-44 shrink-0">{p.label}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                        <div className="h-full rounded-sm" style={{ width: `${maxPriority > 0 ? (count / maxPriority) * 100 : 0}%`, backgroundColor: p.color }} />
                      </div>
                      <span className="text-sm text-gray-700 w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Site */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase mb-3">By Site (Open)</h4>
              {Object.keys(orderStats.byRegion).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(orderStats.byRegion).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([region, count]) => (
                    <div key={region} className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-gray-900 w-5">{count}</span>
                      <span className="text-gray-600">{region}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No data</p>
              )}
            </div>

            {/* Aging */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase mb-3">Aging (Open)</h4>
              {(() => {
                const now = Date.now();
                const openOrders = serviceOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
                const aging = { day1: 0, day3: 0, day7: 0, day7plus: 0 };
                openOrders.forEach((o) => {
                  const days = (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                  if (days < 1) aging.day1++;
                  else if (days < 3) aging.day3++;
                  else if (days < 7) aging.day7++;
                  else aging.day7plus++;
                });
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm"><span className="text-gray-600">&lt; 1 day</span><span className="font-medium text-gray-900">{aging.day1}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-gray-600">1–3 days</span><span className="font-medium text-gray-900">{aging.day3}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-gray-600">3–7 days</span><span className="font-medium text-gray-900">{aging.day7}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className={aging.day7plus > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>7+ days</span><span className={`font-medium ${aging.day7plus > 0 ? 'text-red-600' : 'text-gray-900'}`}>{aging.day7plus}</span></div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
