'use client';

import { useDeviceStore } from '@/store/deviceStore';
import { useState } from 'react';

export default function OverdueAlertsBanner() {
  const { getOverdueDevices, sendOverdueReminder, acknowledgeOverdueAlert } = useDeviceStore();
  const [expanded, setExpanded] = useState(false);

  const overdueDevices = getOverdueDevices();
  const unacknowledged = overdueDevices.filter((a) => !a.acknowledged);

  if (unacknowledged.length === 0) return null;

  return (
    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-red-600 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-800">
              {unacknowledged.length} device{unacknowledged.length !== 1 ? 's' : ''} overdue
            </p>
            <p className="text-xs text-red-600">
              Devices past their return due date
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-red-700 hover:text-red-900 px-3 py-1 rounded-md hover:bg-red-100"
        >
          {expanded ? 'Collapse' : 'View All'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {unacknowledged.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100">
              <div>
                <p className="text-sm font-mono font-medium text-gray-900">{alert.serialNumber}</p>
                <p className="text-xs text-gray-600">
                  Assigned to {alert.assignedEmail} · {alert.daysOverdue} day{alert.daysOverdue !== 1 ? 's' : ''} overdue
                </p>
                {alert.remindersSent > 0 && (
                  <p className="text-xs text-orange-600">
                    {alert.remindersSent} reminder{alert.remindersSent !== 1 ? 's' : ''} sent
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => sendOverdueReminder(alert.deviceId)}
                  className="px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Send Reminder
                </button>
                <button
                  onClick={() => acknowledgeOverdueAlert(alert.id)}
                  className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
