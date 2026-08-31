'use client';

import { useState } from 'react';
import { usePackagesStore } from '@/store/packagesStore';
import {
  ServiceOrder,
  ServiceOrderStatus,
  ServiceOrderType,
  ServiceOrderPriority,
} from '@/types';
import { Kanban, Plus, ExternalLink, User, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Select, Tag, Card, Input, Segmented } from '@amzn/eero-web-design-components';
import { REGIONS, TagColor } from '@/constants';
import { timeAgo } from '@/constants';

const columns: { id: ServiceOrderStatus; label: string }[] = [
  { id: 'intake', label: 'INTAKE' },
  { id: 'triage', label: 'TRIAGE & INVESTIGATE' },
  { id: 'assigned', label: 'ASSIGNED' },
  { id: 'in_progress', label: 'IN PROGRESS' },
  { id: 'on_hold', label: 'ON HOLD' },
  { id: 'completed', label: 'COMPLETED' },
];

// Service order type → WDS Tag color.
const typeColors: Record<ServiceOrderType, TagColor> = {
  returned_to_eero: 'periwinkle',
  defective: 'red',
  end_of_program: 'orange',
  lost: 'grey',
  outbound_shipment: 'periwinkle',
  other: 'grey',
};

const typeLabels: Record<ServiceOrderType, string> = {
  returned_to_eero: 'Returned to eero',
  defective: 'Defective / Hardware issue',
  end_of_program: 'End of program phase',
  lost: 'Lost / Unrecoverable',
  outbound_shipment: 'Outbound Shipment',
  other: 'Other',
};

// Service order priority → WDS Tag color.
const priorityColors: Record<ServiceOrderPriority, TagColor> = {
  P0: 'red',
  P1: 'red',
  P2: 'orange',
  P3: 'yellow',
  P4: 'periwinkle',
  P5: 'grey',
};

const typeOptions: { value: ServiceOrderType; label: string }[] = [
  { value: 'returned_to_eero', label: 'Returned to eero' },
  { value: 'defective', label: 'Defective / Hardware issue' },
  { value: 'end_of_program', label: 'End of program phase' },
  { value: 'lost', label: 'Lost / Unrecoverable' },
  { value: 'outbound_shipment', label: 'Outbound Shipment' },
  { value: 'other', label: 'Other' },
];

const priorityFormOptions: { value: ServiceOrderPriority; label: string }[] = [
  { value: 'P0', label: 'P0 - Critical' },
  { value: 'P1', label: 'P1 - High' },
  { value: 'P2', label: 'P2 - Medium' },
  { value: 'P3', label: 'P3 - Normal' },
  { value: 'P4', label: 'P4 - Low' },
  { value: 'P5', label: 'P5 - Minimal' },
];

const priorityFilterOptions = [{ value: 'all', label: 'All priorities' }, ...(['P0', 'P1', 'P2', 'P3', 'P4', 'P5'] as ServiceOrderPriority[]).map((p) => ({ value: p, label: p }))];
const typeFilterOptions = [{ value: 'all', label: 'All types' }, ...typeOptions];
const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));
const regionFilterOptions = [{ value: 'all', label: 'All Regions' }, ...regionOptions];

function getTimeInColumn(columnEnteredAt: string): string {
  return timeAgo(columnEnteredAt, 'short');
}

export default function ServiceBoard() {
  const { serviceOrders, addServiceOrder, moveServiceOrder } = usePackagesStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterType, setFilterType] = useState<ServiceOrderType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<ServiceOrderPriority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  // New order form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<ServiceOrderType>('returned_to_eero');
  const [newPriority, setNewPriority] = useState<ServiceOrderPriority>('P2');
  const [newAssignee, setNewAssignee] = useState('');
  const [newSite, setNewSite] = useState('USA');
  const [newDeviceSerial, setNewDeviceSerial] = useState('');
  const [newJiraKey, setNewJiraKey] = useState('');
  const [newEta, setNewEta] = useState('');

  const filteredOrders = serviceOrders.filter((o) => {
    if (filterType !== 'all' && o.type !== filterType) return false;
    if (filterPriority !== 'all' && o.priority !== filterPriority) return false;
    if (filterAssignee !== 'all' && o.assignee !== filterAssignee) return false;
    if (filterRegion !== 'all' && o.site !== filterRegion) return false;
    return true;
  });

  const getColumnOrders = (status: ServiceOrderStatus) =>
    filteredOrders.filter((o) => o.status === status);

  const uniqueAssignees = Array.from(new Set(serviceOrders.map((o) => o.assignee).filter(Boolean)));
  const assigneeOptions = [{ value: 'all', label: 'All assignees' }, ...uniqueAssignees.map((a) => ({ value: a, label: a }))];

  const handleCreate = () => {
    const now = new Date().toISOString();
    const order: ServiceOrder = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: newDescription,
      type: newType,
      priority: newPriority,
      status: 'intake',
      assignee: newAssignee,
      requester: 'current_user',
      site: newSite,
      deviceSerial: newDeviceSerial || undefined,
      jiraKey: newJiraKey || undefined,
      jiraUrl: newJiraKey ? `https://eeroinc.atlassian.net/browse/${newJiraKey}` : undefined,
      eta: newEta || undefined,
      columnEnteredAt: now,
      createdAt: now,
      updatedAt: now,
    };
    addServiceOrder(order);
    resetForm();
  };

  const resetForm = () => {
    setShowNewForm(false);
    setNewTitle('');
    setNewDescription('');
    setNewType('returned_to_eero');
    setNewPriority('P2');
    setNewAssignee('');
    setNewSite('SFO38');
    setNewDeviceSerial('');
    setNewJiraKey('');
    setNewEta('');
  };

  const moveLeft = (order: ServiceOrder) => {
    const idx = columns.findIndex((c) => c.id === order.status);
    if (idx > 0) moveServiceOrder(order.id, columns[idx - 1].id);
  };

  const moveRight = (order: ServiceOrder) => {
    const idx = columns.findIndex((c) => c.id === order.status);
    if (idx < columns.length - 1) moveServiceOrder(order.id, columns[idx + 1].id);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ui-text-text-primary)] flex items-center gap-2">
            <Kanban className="w-5 h-5 text-[var(--ui-core-periwinkle-periwinkle-6)]" />
            Service Orders
          </h2>
          <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">
            Track lab work from request to close. Create an SO from a JIRA ticket or scratch, assign it, log progress, and close when done.
            <span className="text-[var(--ui-text-text-placeholder)] ml-1">Syncs with Beta epic via API.</span>
          </p>
          {/* Linked JIRA Epic */}
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] rounded-lg">
            <span className="text-xs text-[var(--ui-support-text-icon-support-info)] font-medium">JIRA Epic:</span>
            <a
              href="https://eeroinc.atlassian.net/browse/BPM-1886"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[var(--ui-core-periwinkle-periwinkle-6)] hover:underline flex items-center gap-1"
            >
              BPM-1886 — Dogfood & Beta Device Shipment Tracking
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'board' | 'table')}
            items={[
              { value: 'table', label: 'Table' },
              { value: 'board', label: 'Board' },
            ]}
          />
          <Button
            type="primary"
            size="medium"
            ariaLabel="New Service Order"
            onClick={() => setShowNewForm(true)}
            label={
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Service Order
              </span>
            }
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="w-48">
          <Select
            id="filter-type"
            value={filterType}
            onChange={(val) => setFilterType(val as ServiceOrderType | 'all')}
            options={typeFilterOptions}
          />
        </div>
        <div className="w-36">
          <Select
            id="filter-priority"
            value={filterPriority}
            onChange={(val) => setFilterPriority(val as ServiceOrderPriority | 'all')}
            options={priorityFilterOptions}
          />
        </div>
        <div className="w-40">
          <Select
            id="filter-assignee"
            value={filterAssignee}
            onChange={(val) => setFilterAssignee(val as string)}
            options={assigneeOptions}
          />
        </div>
        <div className="w-40">
          <Select
            id="filter-region"
            value={filterRegion}
            onChange={(val) => setFilterRegion(val as string)}
            options={regionFilterOptions}
          />
        </div>
      </div>

      {/* New Service Order Form */}
      {showNewForm && (
        <div className="mb-6">
          <Card size={3} title="Create Service Order">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Input
                  id="new-title"
                  label="Title"
                  layout="vertical"
                  value={newTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                  placeholder="e.g., Replace Xenia SFO38 OTA Rack - 02"
                />
              </div>
              <Select
                id="new-type"
                label="Type"
                layout="vertical"
                value={newType}
                onChange={(val) => setNewType(val as ServiceOrderType)}
                options={typeOptions}
              />
              <Select
                id="new-priority"
                label="Priority"
                layout="vertical"
                value={newPriority}
                onChange={(val) => setNewPriority(val as ServiceOrderPriority)}
                options={priorityFormOptions}
              />
              <Input
                id="new-assignee"
                label="Assignee"
                layout="vertical"
                value={newAssignee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignee(e.target.value)}
                placeholder="e.g., sidney"
              />
              <Select
                id="new-site"
                label="Site / Region"
                layout="vertical"
                value={newSite}
                onChange={(val) => setNewSite(val as string)}
                options={regionOptions}
              />
              <Input
                id="new-device-serial"
                label="Device Serial (optional)"
                layout="vertical"
                value={newDeviceSerial}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeviceSerial(e.target.value)}
                placeholder="Serial #"
              />
              <Input
                id="new-jira-key"
                label="JIRA Ticket (optional)"
                layout="vertical"
                value={newJiraKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewJiraKey(e.target.value)}
                placeholder="e.g., QA-17918"
              />
              <Input
                id="new-so-eta"
                label="ETA"
                layout="vertical"
                type="date"
                value={newEta}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEta(e.target.value)}
              />
              <div className="col-span-2 md:col-span-3">
                <Input
                  id="new-description"
                  label="Description"
                  layout="vertical"
                  value={newDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDescription(e.target.value)}
                  placeholder="What needs to be done..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button
                type="primary"
                size="medium"
                label="Create Service Order"
                disabled={!newTitle}
                onClick={handleCreate}
              />
              <Button type="default" size="medium" label="Cancel" onClick={resetForm} />
            </div>
          </Card>
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((col) => {
            const orders = getColumnOrders(col.id);
            return (
              <div key={col.id} className="flex-shrink-0 w-[260px]">
                {/* Column header */}
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-xs font-bold text-[var(--ui-text-text-tertiary)] uppercase tracking-wide">{col.label}</h3>
                  <span className="text-xs bg-[var(--ui-background-layer-layer-page-hover)] text-[var(--ui-text-text-tertiary)] px-1.5 py-0.5 rounded-full font-medium">
                    {orders.length}
                  </span>
                </div>
                {/* Column body */}
                <div className="bg-[var(--ui-background-layer-layer-page-hover)] rounded-xl p-2 min-h-[400px] space-y-2">
                  {orders.map((order) => (
                    <ServiceOrderCard
                      key={order.id}
                      order={order}
                      onMoveLeft={() => moveLeft(order)}
                      onMoveRight={() => moveRight(order)}
                      isFirst={columns.findIndex((c) => c.id === order.status) === 0}
                      isLast={columns.findIndex((c) => c.id === order.status) === columns.length - 1}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-[var(--ui-background-layer-layer-page)] border border-[var(--ui-background-layer-border-border-layer-page)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--ui-background-layer-layer-page-hover)] border-b border-[var(--ui-background-layer-border-border-layer-page)]">
                <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">TYPE</th>
                <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">TITLE</th>
                <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">PRIORITY</th>
                <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">ASSIGNEE</th>
                <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">SITE</th>
                <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">STATUS</th>
                <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">JIRA</th>
                <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">ETA</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--ui-text-text-placeholder)]">
                    No service orders found.
                  </td>
                </tr>
              )}
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--ui-background-layer-border-border-layer-page)] hover:bg-[var(--ui-background-layer-layer-page-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <Tag color={typeColors[order.type]} size="regular">{typeLabels[order.type]}</Tag>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--ui-text-text-primary)]">{order.title}</span>
                    {order.deviceSerial && (
                      <span className="text-xs text-[var(--ui-text-text-placeholder)] block font-mono">{order.deviceSerial}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Tag color={priorityColors[order.priority]} size="regular">{order.priority}</Tag>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--ui-text-text-secondary)]">{order.assignee || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--ui-text-text-secondary)]">{order.site}</td>
                  <td className="px-4 py-3">
                    <Tag color="grey" size="regular" className="capitalize">
                      {order.status.replace('_', ' ')}
                    </Tag>
                  </td>
                  <td className="px-4 py-3">
                    {order.jiraKey ? (
                      <a
                        href={order.jiraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--ui-core-periwinkle-periwinkle-6)] hover:underline flex items-center gap-1"
                      >
                        {order.jiraKey}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--ui-text-text-placeholder)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--ui-text-text-secondary)]">{order.eta || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Service Order Card Component ──────────────────────────────────────────────

interface ServiceOrderCardProps {
  order: ServiceOrder;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function ServiceOrderCard({ order, onMoveLeft, onMoveRight, isFirst, isLast }: ServiceOrderCardProps) {
  const { moveServiceOrder } = usePackagesStore();

  return (
    <div className="bg-[var(--ui-background-layer-layer-page)] rounded-lg border border-[var(--ui-background-layer-border-border-layer-page)] p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Type badge + Priority */}
      <div className="flex items-center justify-between mb-2 gap-1">
        <Tag color={typeColors[order.type]} size="regular">{typeLabels[order.type]}</Tag>
        <Tag color={priorityColors[order.priority]} size="regular">{order.priority}</Tag>
      </div>

      {/* Device serial */}
      {order.deviceSerial && (
        <p className="text-xs text-[var(--ui-text-text-placeholder)] font-mono mb-1 truncate">{order.deviceSerial}</p>
      )}

      {/* Title */}
      <p className="text-xs font-medium text-[var(--ui-text-text-primary)] mb-2 line-clamp-2">{order.title}</p>

      {/* Meta row — kept text-[10px]: dense kanban card, text-xs would overflow the 3 inline meta items on a 260px card */}
      <div className="flex items-center gap-2 text-[10px] text-[var(--ui-text-text-tertiary)] mb-2 flex-wrap">
        {order.assignee && (
          <span className="flex items-center gap-0.5">
            <User className="w-3 h-3" />
            {order.assignee}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <MapPin className="w-3 h-3" />
          {order.site}
        </span>
        <span className="flex items-center gap-0.5">
          <Clock className="w-3 h-3" />
          {getTimeInColumn(order.columnEnteredAt)}
        </span>
      </div>

      {/* JIRA link + ETA — kept text-[10px] for the tight kanban footer row */}
      <div className="flex items-center justify-between mb-2">
        {order.jiraKey ? (
          <a
            href={order.jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--ui-core-periwinkle-periwinkle-6)] hover:underline font-medium"
          >
            {order.jiraKey}
          </a>
        ) : (
          <span />
        )}
        {order.eta && (
          <span className="text-[10px] text-[var(--ui-text-text-placeholder)]">ETA {order.eta}</span>
        )}
      </div>

      {/* Move controls — dropdown + arrows */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--ui-background-layer-border-border-layer-page)]">
        <button
          onClick={onMoveLeft}
          disabled={isFirst}
          className="text-[var(--ui-text-text-placeholder)] hover:text-[var(--ui-text-text-secondary)] disabled:opacity-20 disabled:cursor-not-allowed p-1.5 rounded hover:bg-[var(--ui-background-layer-layer-page-hover)]"
          title="Move left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="max-w-[120px]">
          <Select
            id={`move-status-${order.id}`}
            value={order.status}
            onChange={(val) => moveServiceOrder(order.id, val as ServiceOrderStatus)}
            options={columns.map((col) => ({ value: col.id, label: col.label }))}
          />
        </div>
        <button
          onClick={onMoveRight}
          disabled={isLast}
          className="text-[var(--ui-text-text-placeholder)] hover:text-[var(--ui-text-text-secondary)] disabled:opacity-20 disabled:cursor-not-allowed p-1.5 rounded hover:bg-[var(--ui-background-layer-layer-page-hover)]"
          title="Move right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
