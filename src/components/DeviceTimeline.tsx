'use client';

import { useDeviceStore } from '@/store/deviceStore';

const actionColors: Record<string, string> = {
  checked_out: 'bg-yellow-400',
  checked_in: 'bg-green-400',
  field_updated: 'bg-blue-400',
  firmware_updated: 'bg-purple-400',
  deactivated: 'bg-red-400',
  jira_created: 'bg-orange-400',
  jira_closed: 'bg-gray-400',
  health_regression: 'bg-red-500',
  speed_test: 'bg-teal-400',
  overdue_reminder: 'bg-amber-400',
  created: 'bg-green-500',
};

const actionLabels: Record<string, string> = {
  checked_out: 'Checked Out',
  checked_in: 'Checked In',
  field_updated: 'Updated',
  firmware_updated: 'Firmware Update',
  deactivated: 'Deactivated',
  jira_created: 'JIRA Created',
  jira_closed: 'JIRA Closed',
  health_regression: 'Regression',
  speed_test: 'Speed Test',
  overdue_reminder: 'Reminder Sent',
  created: 'Created',
};

export default function DeviceTimeline({ deviceId }: { deviceId: string }) {
  const { getDeviceHistory } = useDeviceStore();
  const history = getDeviceHistory(deviceId);

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, idx) => (
        <div key={entry.id} className="flex gap-3">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${actionColors[entry.action] || 'bg-gray-300'} mt-1.5`} />
            {idx < history.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
          </div>

          {/* Content */}
          <div className="pb-4 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">
                {actionLabels[entry.action] || entry.action}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5 break-words">{entry.description}</p>
            {entry.user && (
              <p className="text-xs text-gray-400 mt-0.5">by {entry.user}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
