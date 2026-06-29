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
import { REGIONS } from '@/constants';
import { timeAgo } from '@/constants';

const columns: { id: ServiceOrderStatus; label: string }[] = [
  { id: 'intake', label: 'INTAKE' },
  { id: 'triage', label: 'TRIAGE & INVESTIGATE' },
  { id: 'assigned', label: 'ASSIGNED' },
  { id: 'in_progress', label: 'IN PROGRESS' },
  { id: 'on_hold', label: 'ON HOLD' },
  { id: 'completed', label: 'COMPLETED' },
];

const typeColors: Record<ServiceOrderType, string> = {
  returned_to_eero: 'bg-blue-500 text-white',
  defective: 'bg-red-600 text-white',
  end_of_program: 'bg-orange-500 text-white',
  lost: 'bg-gray-700 text-white',
  outbound_shipment: 'bg-blue-500 text-white',
  other: 'bg-gray-500 text-white',
};

const typeLabels: Record<ServiceOrderType, string> = {
  returned_to_eero: 'Returned to eero',
  defective: 'Defective / Hardware issue',
  end_of_program: 'End of program phase',
  lost: 'Lost / Unrecoverable',
  outbound_shipment: 'Outbound Shipment',
  other: 'Other',
};

const priorityColors: Record<ServiceOrderPriority, string> = {
  P0: 'bg-red-600 text-white',
  P1: 'bg-red-500 text-white',
  P2: 'bg-orange-500 text-white',
  P3: 'bg-yellow-500 text-white',
  P4: 'bg-blue-400 text-white',
  P5: 'bg-gray-400 text-white',
};

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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Kanban className="w-5 h-5 text-[#2c3e7a]" />
            Service Orders
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track lab work from request to close. Create an SO from a JIRA ticket or scratch, assign it, log progress, and close when done.
            <span className="text-gray-400 ml-1">Syncs with Beta epic via API.</span>
          </p>
          {/* Linked JIRA Epic */}
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-xs text-blue-700 font-medium">JIRA Epic:</span>
            <a
              href="https://eeroinc.atlassian.net/browse/BPM-1886"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              BPM-1886 — Dogfood & Beta Device Shipment Tracking
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'table' ? 'bg-[#2c3e7a] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'board' ? 'bg-[#2c3e7a] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Board
            </button>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c3e7a] text-white rounded-lg text-xs font-medium hover:bg-[#1e2f5e] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Service Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ServiceOrderType | 'all')}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600"
        >
          <option value="all">All types</option>
          <option value="returned_to_eero">Returned to eero</option>
          <option value="defective">Defective / Hardware issue</option>
          <option value="end_of_program">End of program phase</option>
          <option value="lost">Lost / Unrecoverable</option>
          <option value="outbound_shipment">Outbound Shipment</option>
          <option value="other">Other</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as ServiceOrderPriority | 'all')}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600"
        >
          <option value="all">All priorities</option>
          <option value="P0">P0</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
          <option value="P5">P5</option>
        </select>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600"
        >
          <option value="all">All assignees</option>
          {uniqueAssignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600"
        >
          <option value="all">All Regions</option>
          <option value="USA">USA</option>
          <option value="CA">CA</option>
          <option value="EU">EU</option>
          <option value="UK">UK</option>
          <option value="AUS">AUS</option>
          <option value="NZ">NZ</option>
          <option value="JPN">JPN</option>
          <option value="SG">SG</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* New Service Order Form */}
      {showNewForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Create Service Order</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Replace Xenia SFO38 OTA Rack - 02"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ServiceOrderType)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="returned_to_eero">Returned to eero</option>
                <option value="defective">Defective / Hardware issue</option>
                <option value="end_of_program">End of program phase</option>
                <option value="lost">Lost / Unrecoverable</option>
                <option value="outbound_shipment">Outbound Shipment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as ServiceOrderPriority)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="P0">P0 - Critical</option>
                <option value="P1">P1 - High</option>
                <option value="P2">P2 - Medium</option>
                <option value="P3">P3 - Normal</option>
                <option value="P4">P4 - Low</option>
                <option value="P5">P5 - Minimal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Assignee</label>
              <input
                type="text"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                placeholder="e.g., sidney"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Site / Region</label>
              <select
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="USA">USA</option>
                <option value="CA">CA</option>
                <option value="EU">EU</option>
                <option value="UK">UK</option>
                <option value="AUS">AUS</option>
                <option value="NZ">NZ</option>
                <option value="JPN">JPN</option>
                <option value="SG">SG</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Device Serial (optional)</label>
              <input
                type="text"
                value={newDeviceSerial}
                onChange={(e) => setNewDeviceSerial(e.target.value)}
                placeholder="Serial #"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">JIRA Ticket (optional)</label>
              <input
                type="text"
                value={newJiraKey}
                onChange={(e) => setNewJiraKey(e.target.value)}
                placeholder="e.g., QA-17918"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">ETA</label>
              <input
                type="date"
                value={newEta}
                onChange={(e) => setNewEta(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What needs to be done..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={!newTitle}
              className="px-4 py-2 bg-[#2c3e7a] text-white rounded-lg text-xs font-medium hover:bg-[#1e2f5e] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Service Order
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
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
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{col.label}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                    {orders.length}
                  </span>
                </div>
                {/* Column body */}
                <div className="bg-gray-100 rounded-xl p-2 min-h-[400px] space-y-2">
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">TYPE</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">TITLE</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">PRIORITY</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ASSIGNEE</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">SITE</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">STATUS</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">JIRA</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ETA</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    No service orders found.
                  </td>
                </tr>
              )}
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeColors[order.type]}`}>
                      {typeLabels[order.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">{order.title}</span>
                    {order.deviceSerial && (
                      <span className="text-xs text-gray-400 block font-mono">{order.deviceSerial}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityColors[order.priority]}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.assignee || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.site}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.jiraKey ? (
                      <a
                        href={order.jiraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {order.jiraKey}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.eta || '—'}</td>
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
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Type badge + Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeColors[order.type]}`}>
          {typeLabels[order.type]}
        </span>
        <span className={`text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${priorityColors[order.priority]}`}>
          {order.priority}
        </span>
      </div>

      {/* Device serial */}
      {order.deviceSerial && (
        <p className="text-[10px] text-gray-400 font-mono mb-1 truncate">{order.deviceSerial}</p>
      )}

      {/* Title */}
      <p className="text-xs font-medium text-gray-900 mb-2 line-clamp-2">{order.title}</p>

      {/* Meta row */}
      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2 flex-wrap">
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

      {/* JIRA link + ETA */}
      <div className="flex items-center justify-between mb-2">
        {order.jiraKey ? (
          <a
            href={order.jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-600 hover:underline font-medium"
          >
            {order.jiraKey}
          </a>
        ) : (
          <span />
        )}
        {order.eta && (
          <span className="text-[10px] text-gray-400">ETA {order.eta}</span>
        )}
      </div>

      {/* Move controls — dropdown + arrows */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button
          onClick={onMoveLeft}
          disabled={isFirst}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed p-1.5 rounded hover:bg-gray-100"
          title="Move left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <select
          value={order.status}
          onChange={(e) => moveServiceOrder(order.id, e.target.value as ServiceOrderStatus)}
          className="text-[10px] border border-gray-200 rounded px-1.5 py-1 text-gray-600 bg-gray-50 hover:bg-white cursor-pointer max-w-[120px]"
        >
          {columns.map((col) => (
            <option key={col.id} value={col.id}>{col.label}</option>
          ))}
        </select>
        <button
          onClick={onMoveRight}
          disabled={isLast}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed p-1.5 rounded hover:bg-gray-100"
          title="Move right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
