'use client';

import { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { SalesforceCase } from '@/types';

interface SalesforcePanelProps {
  deviceId: string;
  deviceSerial: string;
}

export default function SalesforcePanel({ deviceId, deviceSerial }: SalesforcePanelProps) {
  const { devices } = useDeviceStore();
  // In production: fetch cases from Salesforce API by device serial
  // For now: simulated empty state (no cases until API is connected)
  const [cases] = useState<SalesforceCase[]>([]);

  const statusColors: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-700',
    'Open': 'bg-yellow-100 text-yellow-700',
    'In Progress': 'bg-orange-100 text-orange-700',
    'Escalated': 'bg-red-100 text-red-700',
    'Closed': 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Salesforce Cases</h4>
        <span className="text-xs text-gray-400">{cases.length} case(s)</span>
      </div>

      {cases.length === 0 ? (
        <p className="text-xs text-gray-400">No Salesforce cases linked to this device</p>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <div key={c.id} className="p-2 border border-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-medium text-gray-900">#{c.caseNumber}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 truncate">{c.subject}</p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
              {c.jiraTicketKey && (
                <p className="text-xs text-purple-600 mt-0.5">→ Escalated to {c.jiraTicketKey}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-300 mt-3 italic">API integration required for live data</p>
    </div>
  );
}
