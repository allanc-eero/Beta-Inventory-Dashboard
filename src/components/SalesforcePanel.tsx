'use client';

import { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { SalesforceCase } from '@/types';
import { Card, Tag } from '@amzn/eero-web-design-components';

type TagColor = 'grey' | 'navy' | 'periwinkle' | 'green' | 'orange' | 'red' | 'turquoise' | 'ocean' | 'purple' | 'terracotta' | 'yellow';

interface SalesforcePanelProps {
  deviceId: string;
  deviceSerial: string;
}

export default function SalesforcePanel({ deviceId, deviceSerial }: SalesforcePanelProps) {
  const { devices } = useDeviceStore();
  // In production: fetch cases from Salesforce API by device serial
  // For now: simulated empty state (no cases until API is connected)
  const [cases] = useState<SalesforceCase[]>([]);

  const statusColors: Record<string, TagColor> = {
    'New': 'periwinkle',
    'Open': 'orange',
    'In Progress': 'orange',
    'Escalated': 'red',
    'Closed': 'grey',
  };

  return (
    <Card
      size={2}
      title={
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--ui-text-text-primary)]">Salesforce Cases</span>
          <span className="text-xs text-[var(--ui-text-text-placeholder)]">{cases.length} case(s)</span>
        </div>
      }
    >
      {cases.length === 0 ? (
        <p className="text-xs text-[var(--ui-text-text-placeholder)]">No Salesforce cases linked to this device</p>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <div key={c.id} className="p-2 border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-medium text-[var(--ui-text-text-primary)]">#{c.caseNumber}</span>
                <Tag color={statusColors[c.status] || 'grey'} size="regular">{c.status}</Tag>
              </div>
              <p className="text-xs text-[var(--ui-text-text-tertiary)] truncate">{c.subject}</p>
              <p className="text-xs text-[var(--ui-text-text-placeholder)] mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
              {c.jiraTicketKey && (
                <p className="text-xs text-[var(--ui-core-periwinkle-periwinkle-6)] mt-0.5">→ Escalated to {c.jiraTicketKey}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--ui-text-text-disabled)] mt-3 italic">API integration required for live data</p>
    </Card>
  );
}
