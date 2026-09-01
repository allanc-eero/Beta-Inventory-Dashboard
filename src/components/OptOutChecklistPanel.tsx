'use client';

import { useState } from 'react';
import { OptOutRecord } from '@/types';
import { useDeviceStore } from '@/store/deviceStore';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle, Circle, ExternalLink, Bell } from 'lucide-react';

interface OptOutChecklistPanelProps {
  record: OptOutRecord;
}

export default function OptOutChecklistPanel({ record }: OptOutChecklistPanelProps) {
  const { updateOptOutChecklist, getTesterProfile } = useDeviceStore();
  const { currentUser } = useAuthStore();
  const [showCompleteNotice, setShowCompleteNotice] = useState(false);

  const checklist = record.checklist || {
    adminRemoved: false, qualtricsRemoved: false, devicesOffboarded: false, networkReset: false, allCompleted: false,
  };

  const profile = getTesterProfile(record.personEmail);
  const networkId = profile?.networkId || '';
  const adminId = profile?.adminId || '';
  const userName = currentUser?.name || 'Admin';

  const handleCheck = (field: 'adminRemoved' | 'qualtricsRemoved' | 'devicesOffboarded' | 'networkReset') => {
    updateOptOutChecklist(record.id, field, userName);
    // Check if all will be complete after this
    const updated = { ...checklist, [field]: true };
    if (updated.adminRemoved && updated.qualtricsRemoved && updated.devicesOffboarded && updated.networkReset) {
      setShowCompleteNotice(true);
      setTimeout(() => setShowCompleteNotice(false), 6000);
    }
  };

  const steps = [
    {
      key: 'adminRemoved' as const,
      label: 'Remove from eero Admin',
      description: 'Revert tester to default user role in admin panel',
      done: checklist.adminRemoved,
      doneAt: checklist.adminRemovedAt,
      doneBy: checklist.adminRemovedBy,
      link: adminId ? `https://admin.e2ro.com/users/${adminId.replace(/^UID0*/, '')}` : networkId ? `https://insight.eero.com/networks/${networkId}` : undefined,
      linkLabel: adminId ? 'Open in Admin' : networkId ? 'Open in Insight' : undefined,
    },
    {
      key: 'qualtricsRemoved' as const,
      label: 'Flag/Remove in Qualtrics',
      description: 'Mark as opted out in the Qualtrics mailing list so they don\'t receive future testing surveys',
      done: checklist.qualtricsRemoved,
      doneAt: checklist.qualtricsRemovedAt,
      doneBy: checklist.qualtricsRemovedBy,
      link: 'https://eero.qualtrics.com/directories',
      linkLabel: 'Open Qualtrics Directory',
    },
    {
      key: 'devicesOffboarded' as const,
      label: 'Offboard devices from tracker',
      description: 'Ensure all devices are returned, deactivated, or reassigned',
      done: checklist.devicesOffboarded,
      doneAt: checklist.devicesOffboardedAt,
      doneBy: checklist.devicesOffboardedBy,
      link: undefined,
      linkLabel: undefined,
    },
    {
      key: 'networkReset' as const,
      label: 'Reset network to default (off stage)',
      description: 'Move the network/group back to production and confirm it is no longer on the dogfood (stage) environment',
      done: checklist.networkReset,
      doneAt: checklist.networkResetAt,
      doneBy: checklist.networkResetBy,
      link: networkId ? `https://insight.eero.com/networks/${networkId}` : undefined,
      linkLabel: networkId ? 'Open in Insight' : undefined,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Offboarding Checklist</h4>
          <p className="text-xs text-gray-500 mt-0.5">Complete all steps to fully offboard this tester</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${checklist.allCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {checklist.allCompleted ? '✓ Complete' : `${completedCount}/${steps.length}`}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${checklist.allCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.key} className={`flex items-start gap-3 p-3 rounded-lg border ${step.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            {/* Checkbox */}
            <button
              onClick={() => !step.done && handleCheck(step.key)}
              disabled={step.done}
              className={`flex-shrink-0 mt-0.5 ${step.done ? 'text-green-600' : 'text-gray-300 hover:text-blue-500 cursor-pointer'}`}
            >
              {step.done ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${step.done ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {step.linkLabel}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              {step.done && step.doneAt && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Done by {step.doneBy} on {new Date(step.doneAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Action button for incomplete steps */}
            {!step.done && (
              <button
                onClick={() => handleCheck(step.key)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                Mark Done
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Completion notice */}
      {checklist.allCompleted && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            All offboarding steps complete
          </p>
          <p className="text-xs text-green-600 mt-1">
            Completed on {checklist.completedAt ? new Date(checklist.completedAt).toLocaleDateString() : 'N/A'}. This tester has been fully offboarded.
          </p>
        </div>
      )}

      {/* Toast-style notification when all steps are done */}
      {showCompleteNotice && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm bg-white border border-green-200 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Offboarding Complete</p>
              <p className="text-xs text-gray-500">{record.personName} has been fully offboarded from all systems.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
