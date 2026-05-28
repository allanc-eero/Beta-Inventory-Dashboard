'use client';

/**
 * DEMO COMPONENT — "Today" Briefing View
 * 
 * This replaces the stat cards + sync button + overdue banner with a single
 * intelligent summary of what needs attention right now.
 * 
 * TO ENABLE: In src/app/page.tsx, add:
 *   import TodayBriefing from '@/components/TodayBriefing';
 *   Then replace the <DashboardStats>, <NetworkSyncButton>, and <OverdueAlertsBanner>
 *   with: <TodayBriefing onNavigate={handleSetActiveTab} />
 * 
 * TO REMOVE: Delete this file and revert page.tsx. No other files are affected.
 */

import { useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { TabType } from '@/types';

interface TodayBriefingProps {
  onNavigate: (tab: TabType) => void;
}

export default function TodayBriefing({ onNavigate }: TodayBriefingProps) {
  const { devices, getOptOuts } = useDeviceStore();

  const briefing = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const twoWeeksMs = 14 * oneDayMs;

    // Pending returns overdue 2+ weeks
    const overdueReturns = devices.filter((d) =>
      d.status === 'pending_return' && d.returnEmailSentAt &&
      (now - new Date(d.returnEmailSentAt).getTime()) >= twoWeeksMs
    );

    // Pending returns needing follow-up (1-2 weeks)
    const needsFollowUp = devices.filter((d) =>
      d.status === 'pending_return' && d.returnEmailSentAt &&
      (now - new Date(d.returnEmailSentAt).getTime()) >= oneWeekMs &&
      (now - new Date(d.returnEmailSentAt).getTime()) < twoWeeksMs
    );

    // All pending returns
    const pendingReturns = devices.filter((d) => d.status === 'pending_return');

    // Devices that came online recently (last 24h based on updatedAt)
    const recentlyOnline = devices.filter((d) =>
      d.status === 'online' && d.updatedAt &&
      (now - new Date(d.updatedAt).getTime()) < oneDayMs
    );

    // Recent opt-outs
    const optOuts = getOptOuts();
    const recentOptOuts = optOuts.filter((o) =>
      (now - new Date(o.optOutDate).getTime()) < oneDayMs * 7
    );

    // Programs in progress (partially closed)
    const programsInProgress = [...new Set(
      devices.filter((d) => d.status === 'deactivated' || d.status === 'pending_return')
        .map((d) => d.program)
    )].filter((prog) => {
      const progDevices = devices.filter((d) => d.program === prog);
      return progDevices.some((d) => d.status !== 'deactivated' && d.status !== 'pending_return');
    });

    const totalActions = overdueReturns.length + needsFollowUp.length + (programsInProgress.length > 0 ? 1 : 0);

    return { overdueReturns, needsFollowUp, pendingReturns, recentlyOnline, recentOptOuts, programsInProgress, totalActions };
  }, [devices, getOptOuts]);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}.</h1>
        {briefing.totalActions > 0 ? (
          <p className="text-sm text-gray-600 mt-1">{briefing.totalActions} item{briefing.totalActions !== 1 ? 's' : ''} need your attention today.</p>
        ) : (
          <p className="text-sm text-green-600 mt-1 font-medium">✓ Everything looks good. No urgent actions needed.</p>
        )}
      </div>

      {/* Action Cards */}
      <div className="space-y-3">
        {/* Overdue returns — highest priority */}
        {briefing.overdueReturns.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-800">🚨 {briefing.overdueReturns.length} device(s) overdue for return (2+ weeks)</p>
              <p className="text-xs text-red-600 mt-0.5">These testers haven't returned their devices. Send urgent reminders or brick.</p>
            </div>
            <button onClick={() => onNavigate('shipments')} className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
              View Overdue →
            </button>
          </div>
        )}

        {/* Follow-up needed */}
        {briefing.needsFollowUp.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-800">⏰ {briefing.needsFollowUp.length} device(s) need follow-up reminders (1 week)</p>
              <p className="text-xs text-yellow-600 mt-0.5">Return emails were sent over a week ago with no response.</p>
            </div>
            <button onClick={() => onNavigate('shipments')} className="px-4 py-2 text-xs font-medium text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-100">
              Send Reminders →
            </button>
          </div>
        )}

        {/* Programs in progress */}
        {briefing.programsInProgress.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-800">📋 {briefing.programsInProgress.length} program(s) partially closed</p>
              <p className="text-xs text-blue-600 mt-0.5">Programs: {briefing.programsInProgress.join(', ')} — still have unprocessed devices.</p>
            </div>
            <button onClick={() => onNavigate('testbeds')} className="px-4 py-2 text-xs font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100">
              Continue →
            </button>
          </div>
        )}

        {/* Pending returns (informational) */}
        {briefing.pendingReturns.length > 0 && briefing.overdueReturns.length === 0 && briefing.needsFollowUp.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-800">📦 {briefing.pendingReturns.length} device(s) pending return</p>
              <p className="text-xs text-orange-600 mt-0.5">Return emails sent. Waiting for devices to come back.</p>
            </div>
            <button onClick={() => onNavigate('shipments')} className="px-4 py-2 text-xs font-medium text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-100">
              View →
            </button>
          </div>
        )}

        {/* Recent opt-outs */}
        {briefing.recentOptOuts.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">👋 {briefing.recentOptOuts.length} tester(s) opted out this week</p>
              <p className="text-xs text-gray-500 mt-0.5">{briefing.recentOptOuts.map((o) => o.personName).join(', ')}</p>
            </div>
            <button onClick={() => onNavigate('people')} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
              View →
            </button>
          </div>
        )}

        {/* Devices came online */}
        {briefing.recentlyOnline.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800">✓ {briefing.recentlyOnline.length} device(s) came online recently</p>
              <p className="text-xs text-green-600 mt-0.5">Network sync detected new connections.</p>
            </div>
            <button onClick={() => onNavigate('devices')} className="px-4 py-2 text-xs font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-100">
              View →
            </button>
          </div>
        )}
      </div>

      {/* Quick stats — compact, secondary */}
      <div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
        <span>{devices.length} total devices</span>
        <span>{devices.filter((d) => d.status === 'online').length} online</span>
        <span>{devices.filter((d) => d.status === 'not_online').length} offline</span>
        <span>{new Set(devices.map((d) => d.country).filter(Boolean)).size} countries</span>
      </div>
    </div>
  );
}
