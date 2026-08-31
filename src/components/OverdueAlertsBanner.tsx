'use client';

import { Button } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { useState } from 'react';

export default function OverdueAlertsBanner() {
  const { getOverdueDevices, sendOverdueReminder, acknowledgeOverdueAlert } = useDeviceStore();
  const [expanded, setExpanded] = useState(false);

  const overdueDevices = getOverdueDevices();
  const unacknowledged = overdueDevices.filter((a) => !a.acknowledged);

  if (unacknowledged.length === 0) return null;

  return (
    <div className="mb-4 bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[var(--ui-core-red-red-6)] text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-[var(--ui-support-text-support-error)]">
              {unacknowledged.length} device{unacknowledged.length !== 1 ? 's' : ''} overdue
            </p>
            <p className="text-xs text-[var(--ui-core-red-red-6)]">
              Devices past their return due date
            </p>
          </div>
        </div>
        <Button
          type="text"
          label={expanded ? 'Collapse' : 'View All'}
          onClick={() => setExpanded(!expanded)}
        />
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {unacknowledged.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between bg-[var(--ui-background-layer-layer-page)] p-3 rounded-lg border border-[var(--ui-support-border-support-error)]">
              <div>
                <p className="text-sm font-mono font-medium text-[var(--ui-text-text-primary)]">{alert.serialNumber}</p>
                <p className="text-xs text-[var(--ui-text-text-tertiary)]">
                  Assigned to {alert.assignedEmail} · {alert.daysOverdue} day{alert.daysOverdue !== 1 ? 's' : ''} overdue
                </p>
                {alert.remindersSent > 0 && (
                  <p className="text-xs text-[var(--ui-core-orange-orange-6)]">
                    {alert.remindersSent} reminder{alert.remindersSent !== 1 ? 's' : ''} sent
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  danger
                  label="Send Reminder"
                  onClick={() => sendOverdueReminder(alert.deviceId)}
                />
                <Button
                  type="default"
                  label="Dismiss"
                  onClick={() => acknowledgeOverdueAlert(alert.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
