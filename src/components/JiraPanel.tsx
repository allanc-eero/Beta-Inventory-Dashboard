'use client';

import { useDeviceStore } from '@/store/deviceStore';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { Card, Button, Input, Tag } from '@amzn/eero-web-design-components';

type TagColor = 'grey' | 'navy' | 'periwinkle' | 'green' | 'orange' | 'red' | 'turquoise' | 'ocean' | 'purple' | 'terracotta' | 'yellow';

export default function JiraPanel({ deviceId }: { deviceId: string }) {
  const { devices, getJiraTicketsForDevice, createJiraTicket, closeJiraTicket } = useDeviceStore();
  const { canEdit } = useAuthStore();
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

  const statusColors: Record<string, TagColor> = {
    open: 'periwinkle',
    in_progress: 'orange',
    resolved: 'green',
    closed: 'grey',
  };

  const typeLabels: Record<string, string> = {
    overdue_return: '📦 Overdue',
    device_issue: '🐛 Issue',
    firmware_regression: '📉 Regression',
    general: '📋 General',
  };

  return (
    <Card
      size={2}
      title={
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--ui-text-text-primary)]">JIRA Tickets</span>
          {canEdit() && (
            <Button
              type="text"
              label={showCreate ? 'Cancel' : '+ Create'}
              onClick={() => setShowCreate(!showCreate)}
            />
          )}
        </div>
      }
    >
      {showCreate && (
        <div className="mb-3 p-3 bg-[var(--ui-background-layer-layer-page-hover)] rounded-lg border border-[var(--ui-background-layer-border-border-layer-page)]">
          <Input
            id="jira-summary"
            value={summary}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSummary(e.target.value)}
            placeholder="Ticket summary..."
            layout="vertical"
          />
          <div className="mt-2">
            <Button type="primary" label="Create Ticket" fullWidth onClick={handleCreate} />
          </div>
        </div>
      )}

      {tickets.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-2 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-[var(--ui-core-periwinkle-periwinkle-6)]">{ticket.key}</span>
                  <Tag color={statusColors[ticket.status] || 'grey'} size="regular">{ticket.status}</Tag>
                </div>
                {canEdit() && (ticket.status === 'open' || ticket.status === 'in_progress') && (
                  <Button type="text" label="Close" onClick={() => closeJiraTicket(ticket.id)} />
                )}
              </div>
              <p className="text-xs text-[var(--ui-text-text-tertiary)] mt-1">{ticket.summary}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--ui-text-text-placeholder)]">{typeLabels[ticket.type] || ticket.type}</span>
                {ticket.linkedFirmware && (
                  <span className="text-xs text-[var(--ui-text-text-placeholder)]">· fw {ticket.linkedFirmware}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--ui-text-text-placeholder)]">No tickets linked to this device</p>
      )}
    </Card>
  );
}
