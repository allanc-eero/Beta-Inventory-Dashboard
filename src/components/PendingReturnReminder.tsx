'use client';

import { useState, useEffect } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { daysSince } from '@/constants';

interface PendingReturnReminderProps {
  onNavigateToReturns: () => void;
}

export default function PendingReturnReminder({ onNavigateToReturns }: PendingReturnReminderProps) {
  const { devices } = useDeviceStore();
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false);

  const pendingDevices = devices.filter((d) => d.status === 'pending_return' && d.returnEmailSentAt);
  const needsFollowUp = pendingDevices.filter((d) => daysSince(d.returnEmailSentAt) >= 7);

  // Show once per session when there are devices needing follow-up
  useEffect(() => {
    if (needsFollowUp.length > 0 && !dismissed) {
      const sessionKey = `reminder-shown-${new Date().toDateString()}`;
      if (!sessionStorage.getItem(sessionKey)) {
        setShown(true);
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  }, [needsFollowUp.length, dismissed]);

  if (!shown || dismissed || needsFollowUp.length === 0) return null;

  const week1 = needsFollowUp.filter((d) => { const days = daysSince(d.returnEmailSentAt); return days >= 7 && days < 14; });
  const week2 = needsFollowUp.filter((d) => daysSince(d.returnEmailSentAt) >= 14);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setDismissed(true)} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="text-center mb-4">
          <span className="text-4xl">⏰</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
          You have {needsFollowUp.length} device(s) needing follow-up reminders
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Have they been returned? If so, make sure to archive program/devices or brick them if necessary.
        </p>

        {/* Breakdown */}
        <div className="space-y-3 mb-6">
          {week2.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-600 font-bold text-lg">🚨</span>
              <div>
                <p className="text-sm font-medium text-red-800">{week2.length} device(s) overdue 2+ weeks</p>
                <p className="text-xs text-red-600">Consider bricking or escalating directly with the tester</p>
              </div>
            </div>
          )}
          {week1.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-yellow-600 font-bold text-lg">⏰</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">{week1.length} device(s) waiting 1–2 weeks</p>
                <p className="text-xs text-yellow-600">Send a follow-up reminder email</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setDismissed(true)}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Dismiss for Today
          </button>
          <button
            onClick={() => { setDismissed(true); onNavigateToReturns(); }}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            View Pending Returns →
          </button>
        </div>
      </div>
    </div>
  );
}
