'use client';

// ─── TEMPORARY EDS COMPARISON DEMO ─────────────────────────────────────────────
// Shows the SAME Fetch device panel built two ways:
//   1. Current style — the app's existing hand-rolled Tailwind patterns
//   2. EDS/WDS — the eero Design System components (Card, TableV2, Button, Tag,
//      Search, Segmented) with eero tokens, Centra No2, periwinkle, etc.
// Nothing in the real app is changed. Delete src/app/eds-demo/ when done.

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Button,
  Card,
  Search,
  Segmented,
  Tag,
  TableV2,
  Tooltip,
  IconButton,
  ICONS,
} from '@amzn/eero-web-design-components';

// ── Shared demo data (shaped like real Fetch devices) ─────────────────────────
interface DemoDevice {
  serial: string;
  product: string;
  program: string;
  tester: string;
  region: string;
  status: 'online' | 'not_online' | 'pending_return';
}

const DEVICES: DemoDevice[] = [
  { serial: 'GGC54MX36114004L', product: 'Merci 10.2', program: 'BETA', tester: 'Shakeel Ahmad', region: 'Australia', status: 'online' },
  { serial: 'GGC54MX36114003G', product: 'Merci 10.2', program: 'BETA', tester: 'Mark Jones', region: 'Australia', status: 'online' },
  { serial: 'GGC4G70A611513GM', product: 'Foghorn PVT', program: 'PVT', tester: 'Raj Kai', region: 'United States', status: 'not_online' },
  { serial: 'GGC54MX361140051', product: 'Merci 10.2', program: 'BETA', tester: 'Sarah McLennan', region: 'United Kingdom', status: 'pending_return' },
  { serial: 'GGC54MX36114001N', product: 'Merci 10.2', program: 'BETA', tester: 'Patrick Evans', region: 'Australia', status: 'online' },
];

const STATUS_LABEL: Record<DemoDevice['status'], string> = {
  online: 'Online',
  not_online: 'Not Online',
  pending_return: 'Pending Return',
};

// ── 1) CURRENT FETCH STYLE (copied from the app's existing patterns) ──────────
function CurrentStylePanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Devices</h4>
          <p className="text-xs text-gray-500 mt-0.5">5 devices across 3 regions</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search serial, tester..."
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option>All Status</option>
            <option>Online</option>
          </select>
          <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add Device
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase text-xs">Serial</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase text-xs">Product</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase text-xs">Program</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase text-xs">Assigned To</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase text-xs">Region</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase text-xs">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {DEVICES.map((d) => (
            <tr key={d.serial} className="hover:bg-blue-50/50 transition-colors cursor-pointer">
              <td className="px-4 py-2.5 font-mono text-xs font-medium text-blue-700">{d.serial}</td>
              <td className="px-4 py-2.5 text-gray-600">{d.product}</td>
              <td className="px-4 py-2.5 text-gray-600">{d.program}</td>
              <td className="px-4 py-2.5 text-gray-600">{d.tester}</td>
              <td className="px-4 py-2.5 text-gray-600">{d.region}</td>
              <td className="px-4 py-2.5">
                <span className={`status-badge ${
                  d.status === 'online' ? 'status-in-stock' : d.status === 'not_online' ? 'status-checked-out' : 'bg-orange-100 text-orange-700'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {STATUS_LABEL[d.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 2) SAME PANEL IN EDS (WDS components + eero tokens) ───────────────────────
const TAG_FOR_STATUS: Record<DemoDevice['status'], { color: any; status: any }> = {
  online: { color: 'green', status: 'success' },
  not_online: { color: 'grey', status: 'default' },
  pending_return: { color: 'orange', status: 'warning' },
};

const columns: ColumnDef<DemoDevice>[] = [
  {
    accessorKey: 'serial',
    header: 'Serial',
    cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span>,
  },
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'program', header: 'Program' },
  { accessorKey: 'tester', header: 'Assigned To' },
  { accessorKey: 'region', header: 'Region' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as DemoDevice['status'];
      const t = TAG_FOR_STATUS[s];
      return (
        <Tag color={t.color} status={t.status} showIcon size="regular">
          {STATUS_LABEL[s]}
        </Tag>
      );
    },
  },
];

function EDSStylePanel() {
  const [segment, setSegment] = useState<string | number>('All');
  return (
    <Card
      title="Devices"
      size={10}
      extra={
        <div className="flex items-center gap-3">
          <Search id="eds-demo-search" placeholder="Search serial, tester..." />
          <Segmented
            options={['All', 'Online', 'Not Online']}
            value={segment}
            onChange={setSegment}
          />
          <Tooltip title="Sync from Databricks">
            <IconButton icon={ICONS.FUNCTIONAL_REFRESH} />
          </Tooltip>
          <Button type="primary" label="Add Device" />
        </div>
      }
    >
      <TableV2 data={DEVICES} columns={columns} enableSorting className="w-full" />
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function EDSDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-8">
      <div className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 inline-block">
        TEMPORARY DEMO — same device panel, two styling systems. Nothing in the real app changed. Delete <code>src/app/eds-demo/</code> when done.
      </div>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">1 · Current Fetch style</h2>
        <p className="text-sm text-gray-500 mb-3">Hand-rolled Tailwind — what the app uses today.</p>
        <CurrentStylePanel />
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">2 · Same panel in EDS</h2>
        <p className="text-sm text-gray-500 mb-3">
          WDS components: <code>Card · TableV2 (sortable — click headers) · Tag · Search · Segmented · IconButton · Button</code> — eero tokens, Centra No2, periwinkle.
        </p>
        <EDSStylePanel />
      </section>
    </div>
  );
}
