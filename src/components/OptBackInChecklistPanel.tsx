'use client';

import { useState } from 'react';
import { OptOutRecord } from '@/types';
import { useDeviceStore } from '@/store/deviceStore';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle, Circle, ExternalLink, Bell, UserPlus } from 'lucide-react';

interface OptBackInChecklistPanelProps {
  record: OptOutRecord;
  onComplete: () => void;
  onCancel: () => void;
}

export default function OptBackInChecklistPanel({ record, onComplete, onCancel }: OptBackInChecklistPanelProps) {
  const { getTesterProfile, removeOptOut } = useDeviceStore();
  const { currentUser } = useAuthStore();

  const [adminReAdded, setAdminReAdded] = useState(false);
  const [qualtricsStatus, setQualtricsStatus] = useState('');
  const [showCompleteNotice, setShowCompleteNotice] = useState(false);

  const profile = getTesterProfile(record.personEmail);
  const networkId = profile?.networkId || '';
  const adminId = profile?.adminId || '';

  const allDone = adminReAdded;

  const handleConfirm = async () => {
    // Auto-trigger Qualtrics opt-back-in
    try {
      const res = await fetch('/api/qualtrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optBackIn', email: record.personEmail }),
      });
      const data = await res.json();
      setQualtricsStatus(data.success ? '✓ Re-subscribed in Qualtrics' : `⚠ ${data.error?.slice(0, 80) || 'Manual action needed'}`);
    } catch {
      setQualtricsStatus('⚠ API call failed');
    }

    removeOptOut(record.personEmail);
    setShowCompleteNotice(true);
    setTimeout(() => {
      setShowCompleteNotice(false);
      onComplete();
    }, 3000);
  };

  const steps = [
    {
      key: 'admin',
      label: 'Re-add as tester in eero Admin',
      description: 'Set their user role back to tester in the admin panel',
      done: adminReAdded,
      onCheck: () => setAdminReAdded(true),
      link: adminId ? `https://admin.e2ro.com/users/${adminId.replace(/^UID0*/, '')}` : networkId ? `https://insight.eero.com/networks/${networkId}` : undefined,
      linkLabel: adminId ? 'Open in Admin' : networkId ? 'Open in Insight' : undefined,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Opt Back In: {record.personName}</h2>
            <p className="text-xs text-gray-500">{record.personEmail}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Complete these steps to re-activate this tester in all systems before confirming.
        </p>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {steps.map((step) => (
            <div key={step.key} className={`flex items-start gap-3 p-3 rounded-lg border ${step.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => !step.done && step.onCheck()}
                disabled={step.done}
                className={`flex-shrink-0 mt-0.5 ${step.done ? 'text-green-600' : 'text-gray-300 hover:text-blue-500 cursor-pointer'}`}
              >
                {step.done ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
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
              </div>
              {!step.done && (
                <button
                  onClick={step.onCheck}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  Done
                </button>
              )}
            </div>
          ))}
          {/* Qualtrics — automated */}
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-blue-50 border-blue-100">
            <div className="flex-shrink-0 mt-0.5 text-blue-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">Qualtrics re-subscribe</p>
              <p className="text-xs text-blue-600">Handled automatically when you confirm</p>
              {qualtricsStatus && <p className={`text-xs mt-1 font-medium ${qualtricsStatus.startsWith('✓') ? 'text-green-600' : 'text-orange-600'}`}>{qualtricsStatus}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allDone}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {allDone ? 'Confirm Opt Back In ✓' : 'Complete admin step first'}
          </button>
        </div>
      </div>

      {/* Completion toast */}
      {showCompleteNotice && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm bg-white border border-green-200 rounded-xl shadow-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Tester Re-Activated</p>
              <p className="text-xs text-gray-500">{record.personName} has been opted back in to all systems.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
