'use client';

import { useDeviceStore } from '@/store/deviceStore';
import { useState } from 'react';

export default function JiraPanel({ deviceId }: { deviceId: string }) {
  const { devices, getJiraTicketsForDevice, createJiraTicket, closeJiraTicket } = useDeviceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [summary, setSummary] = useState('');

  const device = devices.find((d) => d.id === deviceId);
  const tickets = getJiraTicketsForDevice(deviceId);

  if (!device) return null;

  const handleCreate = () => {
    if (!summary.trim()) return;
    createJiraTicket({
      id: crypto.randomUUID(),
      key: `QA-${Math.floor(Math.random() * 90000) + 10000}`,
      deviceId,
      type: 'general',
      status: 'open',
      summary: summary.trim(),
      createdAt: new Date().toISOString(),
      linkedFirmware: device.firmwareVersion,
    });
    setSummary('');
    setShowCreate(false);
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  const typeLabels: Record<string, string> = {
    overdue_return: '📦 Overdue',
    device_issue: '🐛 Issue',
    firmware_regression: '📉 Regression',
    general: '📋 General',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">JIRA Tickets</h4>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {showCreate ? 'Cancel' : '+ Create'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Ticket summary..."
            className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm mb-2"
          />
          <button
            onClick={handleCreate}
            className="w-full px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Ticket
          </button>
        </div>
      )}

      {tickets.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-2 border border-gray-100 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-blue-600">{ticket.key}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>
                {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                  <button
                    onClick={() => closeJiraTicket(ticket.id)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{ticket.summary}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{typeLabels[ticket.type] || ticket.type}</span>
                {ticket.linkedFirmware && (
                  <span className="text-xs text-gray-400">· fw {ticket.linkedFirmware}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No tickets linked to this device</p>
      )}
    </div>
  );
}
