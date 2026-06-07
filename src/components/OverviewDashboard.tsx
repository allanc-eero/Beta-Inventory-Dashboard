'use client';

import { useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';

// ─── Reusable Components ──────────────────────────────────────────────────────

function StatCard({ icon, value, label, iconBg }: { icon: string; value: number; label: string; iconBg: string }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <p style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{value}</p>
      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{label}</p>
    </div>
  );
}

function DonutChart({ title, items, total, size, strokeWidth, centerLabel }: {
  title: string; items: { name: string; count: number; color: string }[]; total: number; size: number; strokeWidth: number; centerLabel: string;
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
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#374151', margin: '0 0 16px 0' }}>{title}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
            {arcData.map((arc, i) => (
              <circle key={i} cx={size/2} cy={size/2} r={radius} fill="none" stroke={arc.color} strokeWidth={strokeWidth}
                strokeDasharray={`${arc.dash} ${circ - arc.dash}`} strokeDashoffset={-arc.offset} />
            ))}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: size > 130 ? '20px' : '18px', fontWeight: 700 }}>{total > 0 ? total.toLocaleString() : items.length}</span>
            <span style={{ fontSize: size > 130 ? '9px' : '8px', color: '#6b7280', textTransform: 'uppercase' }}>{centerLabel}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: size > 130 ? '6px' : '4px', fontSize: size > 130 ? '12px' : '11px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: size > 130 ? '8px' : '6px' }}>
              <span style={{ width: size > 130 ? '10px' : '8px', height: size > 130 ? '10px' : '8px', backgroundColor: item.color, borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: '#374151' }}>{item.name}</span>
              <b>{item.count}</b>
              <span style={{ color: '#9ca3af' }}>{total > 0 ? Math.round((item.count / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarRow({ letter, label, width, color }: { letter: string; label: string; width: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, width: '14px' }}>{letter}</span>
      <span style={{ fontSize: '13px', color: '#4b5563', width: '160px', flexShrink: 0 }}>· {label}</span>
      <div style={{ flex: 1, height: '14px', backgroundColor: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width, backgroundColor: color, borderRadius: '2px' }} />
      </div>
    </div>
  );
}

function PriorityRow({ count, label, width, color, right }: { count: number; label: string; width: string; color: string; right: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <span style={{ fontSize: '13px', fontWeight: 500, width: '20px', textAlign: 'right' }}>{count}</span>
      <span style={{ fontSize: '12px', color: '#4b5563', width: '160px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '12px', backgroundColor: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width, backgroundColor: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 500, width: '20px', textAlign: 'right' }}>{right}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const REGION_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#ec4899', '#0891b2', '#65a30d', '#e11d48', '#f97316'];
const MODEL_COLORS = ['#1e3a5f', '#d97706', '#059669', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#ec4899', '#e11d48', '#f97316'];

function groupAndSort(devices: any[], keyFn: (d: any) => string, colors: string[]) {
  const map: Record<string, number> = {};
  devices.forEach((d) => { const k = keyFn(d); map[k] = (map[k] || 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count], i) => ({ name, count, color: colors[i % colors.length] }));
}

export default function OverviewDashboard() {
  const { devices } = useDeviceStore();

  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const notOnline = devices.filter((d) => d.status === 'not_online').length;
  const countries = new Set(devices.map((d) => d.country).filter(Boolean)).size;
  const programs = new Set(devices.filter((d) => d.status !== 'deactivated').map((d) => d.program)).size;
  const people = new Set(devices.map((d) => d.assignedEmail).filter(Boolean)).size;
  const overdue = devices.filter((d) => d.status === 'pending_return' && d.returnEmailSentAt && (Date.now() - new Date(d.returnEmailSentAt).getTime()) >= 14 * 24 * 60 * 60 * 1000).length;

  const regionItems = useMemo(() => groupAndSort(devices, (d) => d.country || 'Unknown', REGION_COLORS), [devices]);
  const modelItems = useMemo(() => groupAndSort(devices, (d) => d.product || d.internalName || d.model || 'Unknown', MODEL_COLORS), [devices]);

  const statusItems = useMemo(() => [
    { name: 'Online', count: online, color: '#3b82f6' },
    { name: 'Not Online', count: notOnline, color: '#6b7280' },
  ].filter((d) => d.count > 0), [online, notOnline]);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px', backgroundColor: '#f9fafb' }}>
      {/* ROW 1: Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="💻" value={total} label="Total Devices" iconBg="#dbeafe" />
        <StatCard icon="✓" value={online} label="Online" iconBg="#d1fae5" />
        <StatCard icon="👥" value={notOnline} label="Not Online" iconBg="#fef3c7" />
        <StatCard icon="🌍" value={countries} label="Countries" iconBg="#fee2e2" />
        <StatCard icon="🔬" value={programs} label="Programs" iconBg="#ede9fe" />
        <StatCard icon="👤" value={people} label="People" iconBg="#dbeafe" />
        <StatCard icon="⚠️" value={overdue} label="Overdue" iconBg="#fef3c7" />
      </div>

      {/* ROW 2: Three Donut Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <DonutChart title="Status Breakdown" items={statusItems} total={total} size={140} strokeWidth={24} centerLabel="Total" />
        <DonutChart title="Top Regions" items={regionItems} total={total} size={120} strokeWidth={20} centerLabel="Regions" />
        <DonutChart title="Top Models" items={modelItems} total={total} size={120} strokeWidth={20} centerLabel="Models" />
      </div>

      {/* ROW 3: Service Orders */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700 }}>Service Orders</span>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>31 total</span>
        </div>

        {/* Segmented bar */}
        <div style={{ display: 'flex', gap: '3px', height: '28px', marginBottom: '4px' }}>
          <div style={{ width: '50%', backgroundColor: '#3b82f6', borderRadius: '4px' }} />
          <div style={{ width: '15%', backgroundColor: '#b45309', borderRadius: '4px' }} />
          <div style={{ width: '22%', backgroundColor: '#16a34a', borderRadius: '4px' }} />
          <div style={{ width: '13%', backgroundColor: '#bbf7d0', borderRadius: '4px' }} />
        </div>

        {/* Numbers */}
        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <div style={{ width: '50%' }}><span style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb' }}>22</span><br /><span style={{ fontSize: '11px', color: '#6b7280' }}>Open</span></div>
          <div style={{ width: '15%' }}><span style={{ fontSize: '14px', fontWeight: 700 }}>6</span><br /><span style={{ fontSize: '11px', color: '#6b7280' }}>In progress</span></div>
          <div style={{ width: '22%' }}><span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>10</span><br /><span style={{ fontSize: '11px', color: '#6b7280' }}>Complete</span></div>
          <div style={{ width: '13%' }}><span style={{ fontSize: '12px' }}>7</span><br /><span style={{ fontSize: '10px', color: '#6b7280' }}>Closed 30d</span></div>
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>By Job Type</p>
            <BarRow letter="R" label="New Devices" width="80%" color="#dc2626" />
            <BarRow letter="N" label="Bricked Devices" width="65%" color="#16a34a" />
            <BarRow letter="S" label="Archived Devices" width="40%" color="#7c3aed" />
            <BarRow letter="P" label="Program Regions" width="30%" color="#1d4ed8" />
            <BarRow letter="T" label="Outbound Shipment" width="15%" color="#1e3a5f" />
            <BarRow letter="O" label="Inbound Shipments" width="5%" color="#374151" />
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginTop: '24px', marginBottom: '8px' }}>Top Assignees (Open)</p>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No open assignments</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>By Priority (Open - JIRA)</p>
            <PriorityRow count={10} label="P0 — Triage & Investigate" width="100%" color="#dc2626" right={9} />
            <PriorityRow count={3} label="P1 — On Hold" width="55%" color="#ea580c" right={7} />
            <PriorityRow count={10} label="P2 — Intake" width="100%" color="#ca8a04" right={6} />
            <PriorityRow count={4} label="P3 — Completed" width="40%" color="#16a34a" right={5} />
            <PriorityRow count={3} label="P4 — Low / Backlog" width="30%" color="#3b82f6" right={22} />
          </div>
        </div>
      </div>
    </div>
  );
}
