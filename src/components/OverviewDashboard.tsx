'use client';

import { useMemo } from 'react';
import { Card } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';

// ─── Reusable Components ──────────────────────────────────────────────────────
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
  const { devices } = useDeviceStore();

  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const notOnline = devices.filter((d) => d.status === 'not_online').length;
  const countries = new Set(devices.map((d) => d.country).filter(Boolean)).size;
  const programs = new Set(devices.filter((d) => d.status !== 'deactivated').map((d) => d.program)).size;
  const people = new Set(devices.map((d) => d.assignedEmail).filter(Boolean)).size;

  const regionItems = useMemo(() => groupAndSort(devices, (d) => d.country || 'Unknown', REGION_COLORS), [devices]);
  const modelItems = useMemo(() => groupAndSort(devices, (d) => d.product || d.internalName || d.model || 'Unknown', MODEL_COLORS), [devices]);

  const statusItems = useMemo(() => [
    { name: 'Online', count: online, color: 'var(--ui-core-periwinkle-periwinkle-6)' },
    { name: 'Not Online', count: notOnline, color: 'var(--ui-core-gray-gray-6)' },
  ].filter((d) => d.count > 0), [online, notOnline]);

  return (
    <div className="space-y-4">
      {/* ROW 1: KPI strip — one card with evenly-spread columns (matches the other menus) */}
      <Card size={2}>
        <div className="flex flex-wrap gap-y-3">
          {[
            { label: 'Total Devices', value: total },
            { label: 'Online', value: online },
            { label: 'Not Online', value: notOnline },
            { label: 'Countries', value: countries },
            { label: 'Programs', value: programs },
            { label: 'People', value: people },
          ].map((s, i) => (
            <div key={s.label} className={`min-w-0 flex-1 basis-1/3 px-4 sm:basis-0 ${i > 0 ? 'border-l border-[var(--ui-background-layer-border-border-layer-page)]' : ''}`}>
              <p className="text-xs text-[var(--ui-text-text-tertiary)]">{s.label}</p>
              <p className="mt-0.5 text-lg font-semibold text-[var(--ui-text-text-primary)]">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ROW 2: Three Donut Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DonutChart title="Status Breakdown" items={statusItems} total={total} size={140} strokeWidth={24} centerLabel="Devices" />
        <DonutChart title="Top Regions" items={regionItems} total={total} size={120} strokeWidth={20} centerLabel="Regions" centerValue={regionItems.length} />
        <DonutChart title="Top Models" items={modelItems} total={total} size={120} strokeWidth={20} centerLabel="Top Model" centerValue={modelItems[0]?.name || '—'} />
      </div>
    </div>
  );
}
