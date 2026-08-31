'use client';

import { useState, useEffect } from 'react';
import { Button, Modal } from '@amzn/eero-web-design-components';
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
    <Modal
      isOpen
      title={`You have ${needsFollowUp.length} device(s) needing follow-up reminders`}
      onCancel={() => setDismissed(true)}
      hideFooter
    >
      <div className="text-center mb-4">
        <span className="text-4xl">⏰</span>
      </div>
      <p className="text-sm text-[var(--ui-text-text-tertiary)] text-center mb-6">
        Have they been returned? If so, make sure to archive program/devices or brick them if necessary.
      </p>

      {/* Breakdown */}
      <div className="space-y-3 mb-6">
        {week2.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-lg">
            <span className="text-[var(--ui-core-red-red-6)] font-bold text-lg">🚨</span>
            <div>
              <p className="text-sm font-medium text-[var(--ui-support-text-support-error)]">{week2.length} device(s) overdue 2+ weeks</p>
              <p className="text-xs text-[var(--ui-core-red-red-6)]">Consider bricking or escalating directly with the tester</p>
            </div>
          </div>
        )}
        {week1.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-[var(--ui-support-fill-support-warning)] border border-[var(--ui-support-border-support-warning)] rounded-lg">
            <span className="text-[var(--ui-support-text-icon-support-warning)] font-bold text-lg">⏰</span>
            <div>
              <p className="text-sm font-medium text-[var(--ui-support-text-icon-support-warning)]">{week1.length} device(s) waiting 1–2 weeks</p>
              <p className="text-xs text-[var(--ui-support-text-icon-support-warning)]">Send a follow-up reminder email</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="default"
          label="Dismiss for Today"
          onClick={() => setDismissed(true)}
        />
        <Button
          type="primary"
          label="View Pending Returns →"
          onClick={() => { setDismissed(true); onNavigateToReturns(); }}
        />
      </div>
    </Modal>
  );
}
