'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDeviceStore } from '@/store/deviceStore';
import { useProgramsStore } from '@/store/programsStore';
import { OptOutReason } from '@/types';
import { getTrackingUrl, isDomesticCountry } from '@/constants';
import { Wifi, Smartphone, Bug, Video, LayoutDashboard, LogOut, Layers, Upload, BookOpen, ExternalLink, MessageSquare, Mail, FileText, PlayCircle, PartyPopper, X, UserCog, Save, DoorOpen, CheckCircle, Circle, Rocket, Calendar, Users, PackageCheck } from 'lucide-react';

type PortalTab = 'dashboard' | 'devices' | 'programs' | 'report' | 'learn' | 'profile' | 'leave' | 'signup' | 'returns';

export default function DogfooderPortal() {
  const { currentUser, logout, markWelcomeSeen, updateProfile } = useAuthStore();
  const { devices, addOptOut, getOptOuts, updateDevice, addHistoryEntry, getClosedPrograms } = useDeviceStore();
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [showWelcome, setShowWelcome] = useState(!currentUser?.profile?.welcomeSeen);

  const dismissWelcome = (goTo?: PortalTab) => {
    markWelcomeSeen();
    setShowWelcome(false);
    if (goTo) setActiveTab(goTo);
  };

  // Filter devices assigned to this user (by email match)
  const myDevices = devices.filter(
    (d) => {
      const email = currentUser?.email?.toLowerCase();
      const name = currentUser?.name?.toLowerCase();
      return (
        d.assignedEmail?.toLowerCase() === email ||
        d.contactEmail?.toLowerCase() === email ||
        d.assignedTo?.toLowerCase() === name ||
        d.checkedOutTo?.toLowerCase() === name
      );
    }
  );

  // Get unique programs from assigned devices
  const myPrograms = [...new Set(myDevices.map((d) => d.program).filter(Boolean))];

  // ── End-of-program detection (device-driven) ──
  // A return is only surfaced when the dogfooder actually HOLDS devices for a
  // program phase that's ending. Devices are linked via the uploaded list
  // (ingestion → email match), so only picked-and-assigned testers see returns.
  // Signing up alone populates nothing here — that's just an expression of interest.
  const { offerings } = useProgramsStore();
  const endingReturns = useMemo(() => {
    const now = Date.now();
    const SOON_MS = 21 * 24 * 60 * 60 * 1000;
    const results: { offering: any; phase: any; devices: any[]; daysLeft: number }[] = [];

    offerings.forEach((off) => {
      (off.phases || []).forEach((ph: any) => {
        if (!ph.endDate) return;
        const end = new Date(ph.endDate).getTime();
        const daysLeft = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
        if (end - now > SOON_MS) return; // not ending soon

        // Devices the user actually holds that belong to this offering/phase
        const matched = myDevices.filter((d) => {
          const prodMatch = off.product && d.product && off.product.toLowerCase() === d.product.toLowerCase();
          const phaseMatch = d.program && ph.name && d.program.toLowerCase() === ph.name.toLowerCase();
          return (prodMatch || phaseMatch) && d.status !== 'deactivated' && d.status !== 'pending_return';
        });

        // Only surface if they hold matching devices (i.e., they were picked &
        // the list was uploaded). No devices → nothing populates.
        if (matched.length > 0) {
          results.push({ offering: off, phase: ph, devices: matched, daysLeft });
        }
      });
    });
    return results;
  }, [offerings, myDevices]);

  // Other devices on same network(s) as mine
  const myNetworks = [...new Set(myDevices.map((d) => d.network).filter(Boolean))];
  const networkDevices = devices.filter(
    (d) =>
      d.network &&
      myNetworks.includes(d.network) &&
      d.assignedEmail?.toLowerCase() !== currentUser?.email?.toLowerCase() &&
      d.assignedTo?.toLowerCase() !== currentUser?.name?.toLowerCase()
  );

  const tabs: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'learn', label: 'Learn', icon: <BookOpen size={16} /> },
    { id: 'devices', label: 'Devices', icon: <Smartphone size={16} /> },
    { id: 'programs', label: 'My Programs', icon: <Layers size={16} /> },
    { id: 'signup', label: 'Join', icon: <Rocket size={16} /> },
    { id: 'returns', label: 'Returns', icon: <PackageCheck size={16} /> },
    { id: 'report', label: 'Report', icon: <Bug size={16} /> },
    { id: 'profile', label: 'Profile', icon: <UserCog size={16} /> },
    { id: 'leave', label: 'Leave', icon: <DoorOpen size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* First-time welcome modal */}
      {showWelcome && (
        <WelcomeModal
          name={currentUser?.name || ''}
          onClose={() => dismissWelcome()}
          onGoToLearn={() => dismissWelcome('learn')}
          onBrowsePrograms={() => dismissWelcome('signup')}
        />
      )}
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi size={24} className="text-[#2c3e7a]" strokeWidth={1.5} />
          <span className="text-lg font-bold text-gray-900">Dogfood Portal</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Dogfooder</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{currentUser?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Tab navigation */}
      <div className="fixed top-[57px] left-0 right-0 z-40 bg-white border-b border-gray-100">
        <div className="flex gap-1 max-w-[1280px] mx-auto px-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#2c3e7a] text-[#2c3e7a]'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[1280px] mx-auto px-6 py-6 mt-[105px]">
        {activeTab === 'dashboard' && (
          <DashboardView
            name={currentUser?.name || ''}
            deviceCount={myDevices.length}
            programCount={myPrograms.length}
            programs={myPrograms}
            endingReturns={endingReturns}
            onGoToReturns={() => setActiveTab('returns')}
          />
        )}
        {activeTab === 'learn' && <LearnView />}
        {activeTab === 'devices' && <DevicesView devices={myDevices} networkDevices={networkDevices} />}
        {activeTab === 'programs' && <ProgramsView programs={myPrograms} devices={myDevices} closedPrograms={getClosedPrograms().map((cp) => cp.program)} />}
        {activeTab === 'signup' && <JoinProgramView userName={currentUser?.name || ''} userEmail={currentUser?.email || ''} />}
        {activeTab === 'returns' && (
          <ReturnsView
            userName={currentUser?.name || ''}
            userEmail={currentUser?.email || ''}
            endingReturns={endingReturns}
            addOptOut={addOptOut}
            getOptOuts={getOptOuts}
            updateDevice={updateDevice}
            addHistoryEntry={addHistoryEntry}
          />
        )}
        {activeTab === 'report' && <ReportView devices={myDevices} userName={currentUser?.name || ''} userEmail={currentUser?.email || ''} />}
        {activeTab === 'profile' && (
          <ProfileView
            email={currentUser?.email || ''}
            profile={currentUser?.profile || {}}
            onSave={updateProfile}
          />
        )}
        {activeTab === 'leave' && (
          <LeaveProgramView
            userName={currentUser?.name || ''}
            userEmail={currentUser?.email || ''}
            devices={myDevices}
            programs={myPrograms}
            addOptOut={addOptOut}
            existingOptOut={getOptOuts().find((o) => o.personEmail.toLowerCase() === currentUser?.email?.toLowerCase())}
          />
        )}
      </main>
    </div>
  );
}

// ─── Confetti Burst ───────────────────────────────────────────────────────────
function Confetti() {
  const colors = ['#2c3e7a', '#4f6bc6', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#ec4899'];
  // Generate a fixed set of pieces with randomized position/timing/color
  const pieces = Array.from({ length: 80 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const duration = 2.5 + Math.random() * 2;
    const color = colors[i % colors.length];
    const size = 6 + Math.random() * 8;
    const round = Math.random() > 0.5;
    return { id: i, left, delay, duration, color, size, round };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── First-Time Welcome Modal ─────────────────────────────────────────────────
function WelcomeModal({ name, onClose, onGoToLearn, onBrowsePrograms }: { name: string; onClose: () => void; onGoToLearn: () => void; onBrowsePrograms: () => void }) {
  const firstName = name.split(' ')[0] || 'there';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <Confetti />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Festive header */}
        <div className="bg-gradient-to-br from-[#2c3e7a] to-[#1e2f5e] px-8 pt-8 pb-6 text-center text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X size={20} />
          </button>
          <div className="text-5xl mb-2">🎉🐶</div>
          <h2 className="text-2xl font-bold">Congrats on joining, {firstName}!</h2>
          <p className="text-blue-100 mt-2 text-sm">You're officially an eero Dogfooder.</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Welcome to the pack! 🐾 We're thrilled to have you on the team and we genuinely
            look forward to working with you. You're now one of the first people on the planet
            to play with eero's newest hardware and software — and your feedback shapes what
            millions of homes will use next.
          </p>

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <PartyPopper size={16} className="text-blue-600" /> Spread the word!
            </p>
            <p className="text-sm text-gray-600">
              Know someone who'd love early access to the future of WiFi? Tell your teammates to
              join the Dogfood program — the more testers, the better the products. 🚀
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Rocket size={16} className="text-blue-600" /> Ready to test something?
            </p>
            <p className="text-sm text-gray-600">
              Browse the open and upcoming dogfood programs and sign up for the ones you want to test.
              This is how you join — no Slack form needed.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <BookOpen size={16} className="text-gray-500" /> Get familiar with the program
            </p>
            <p className="text-sm text-gray-600">
              Head to the <strong>Learn</strong> menu to find out how dogfooding works, how to give
              great feedback (Shake-to-Report!), helpful Slack channels, videos, and docs.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onBrowsePrograms}
            className="w-full sm:flex-1 px-5 py-2.5 bg-[#2c3e7a] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f5e] transition-colors flex items-center justify-center gap-2"
          >
            <Rocket size={16} /> Browse programs →
          </button>
          <button
            onClick={onGoToLearn}
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen size={16} /> Learn
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardView({ name, deviceCount, programCount, programs, endingReturns, onGoToReturns }: { name: string; deviceCount: number; programCount: number; programs: string[]; endingReturns: any[]; onGoToReturns: () => void }) {
  return (
    <div className="space-y-6">
      {/* End-of-program return alert */}
      {endingReturns.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📦</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">Time to return your devices</h3>
              <div className="mt-1 space-y-1">
                {endingReturns.map((r, i) => (
                  <p key={i} className="text-sm text-amber-800">
                    <strong>{r.offering.name}</strong> ({r.phase.name}) {r.daysLeft >= 0 ? `ends in ${r.daysLeft} day${r.daysLeft === 1 ? '' : 's'}` : `ended ${Math.abs(r.daysLeft)} day${Math.abs(r.daysLeft) === 1 ? '' : 's'} ago`} — {r.devices.length} device(s) to return.
                  </p>
                ))}
              </div>
              <button onClick={onGoToReturns} className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                Start your return →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {name}</h1>
        <p className="text-gray-500 mt-2">Here's your dogfood program overview.</p>
        {programs.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {programs.map((p) => (
              <span key={p} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">{p}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">My Devices</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{deviceCount}</p>
          {deviceCount === 0 && <p className="text-xs text-gray-400 mt-2">Devices will appear once assigned by your admin.</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Programs</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{programCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Issues Reported</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
      </div>
    </div>
  );
}

// ─── My Devices Tab ───────────────────────────────────────────────────────────
function DevicesView({ devices, networkDevices }: { devices: any[]; networkDevices: any[] }) {
  // Devices that are en route (not yet delivered/online)
  const inTransit = devices.filter((d) =>
    ['ordered', 'in_transit_to_fc', 'at_fc', 'in_transit_to_tester'].includes(d.shipmentStatus) ||
    d.status === 'not_online'
  );

  return (
    <div className="space-y-6">
      {/* On the way — devices in transit to the tester */}
      {inTransit.length > 0 && (
        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
            <h2 className="text-base font-semibold text-blue-800 flex items-center gap-2">📦 On the Way to You ({inTransit.length})</h2>
            <p className="text-xs text-blue-600 mt-1">Devices shipping to you. Track them with the links below — they'll show as online once set up.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {inTransit.map((device) => {
              const tracking = device.leg2Tracking || device.tracking || '';
              const carrier = device.leg2Carrier || device.leg1Carrier || '';
              const url = getTrackingUrl(carrier, tracking);
              return (
                <div key={`transit-${device.id || device.serial}`} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{device.model || 'eero Device'} <span className="text-xs text-gray-400 font-normal">· {device.program || '—'}</span></p>
                    <p className="text-xs text-gray-500 font-mono">{device.serialNumber || device.serial}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {tracking ? (
                      url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                          {carrier ? `${carrier} ` : ''}{tracking} ↗
                        </a>
                      ) : (
                        <span className="text-sm font-mono text-gray-700">{tracking}</span>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">Tracking pending</span>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{(device.shipmentStatus || 'in transit').replace(/_/g, ' ')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My devices */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Smartphone size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No devices assigned to you yet.</p>
          <p className="text-sm text-gray-400 mt-1">Once your admin assigns devices, they'll appear here automatically.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">My Devices ({devices.length})</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Device</th>
                <th className="px-6 py-3 text-left">Serial</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Program</th>
                <th className="px-6 py-3 text-left">Network</th>
                <th className="px-6 py-3 text-left">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map((device) => (
                <tr key={device.id || device.serial} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.model || 'eero Device'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{device.serialNumber || device.serial}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      device.status === 'active' || device.status === 'online' ? 'bg-green-100 text-green-700' :
                      device.status === 'pending_return' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {device.status?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{device.program || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{device.network || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{device.leg2Tracking || device.tracking || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Other devices on my network */}
      {networkDevices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Other Devices on My Network ({networkDevices.length})</h2>
            <p className="text-xs text-gray-400 mt-1">Devices shared on your network but assigned to others or unassigned.</p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Device</th>
                <th className="px-6 py-3 text-left">Serial</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Network</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {networkDevices.map((device) => (
                <tr key={device.id || device.serial} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.model || 'eero Device'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{device.serialNumber || device.serial}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      device.status === 'active' || device.status === 'online' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {device.status?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{device.network || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── My Programs Tab ──────────────────────────────────────────────────────────
function ProgramsView({ programs, devices, closedPrograms }: { programs: string[]; devices: any[]; closedPrograms: string[] }) {
  if (programs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Layers size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">You're not part of any programs yet.</p>
        <p className="text-sm text-gray-400 mt-1">Programs will appear here once you're enrolled by an admin.</p>
      </div>
    );
  }

  const closedSet = new Set(closedPrograms.map((p) => p.toLowerCase()));

  return (
    <div className="space-y-4">
      {programs.map((program) => {
        const programDevices = devices.filter((d) => d.program === program);
        const isClosed = closedSet.has(program.toLowerCase());
        return (
          <div key={program} className={`bg-white rounded-xl border p-6 ${isClosed ? 'border-gray-200 opacity-90' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{program}</h3>
                <p className="text-sm text-gray-500 mt-1">{programDevices.length} device(s) assigned to you</p>
              </div>
              {isClosed ? (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Closed</span>
              ) : (
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">Active</span>
              )}
            </div>
            {isClosed && (
              <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                This program has been closed by the beta team. If you still have devices, check the Returns tab for next steps.
              </p>
            )}
            {programDevices.length > 0 && (
              <div className="mt-4 space-y-2">
                {programDevices.map((d) => (
                  <div key={d.id || d.serial} className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
                    <span className="font-mono text-xs">{d.serialNumber || d.serial}</span>
                    <span>{d.model || 'eero Device'}</span>
                    <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
                      d.status === 'active' || d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {d.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Report Issue Tab (with attachments) ──────────────────────────────────────
function ReportView({ devices, userName, userEmail }: { devices: any[]; userName: string; userEmail: string }) {
  const [category, setCategory] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<{ key: string; url: string } | null>(null);
  const [error, setError] = useState('');

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setCreatedTicket(null);
    try {
      const res = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createDogReport',
          category,
          description,
          deviceSerial: selectedDevice || undefined,
          reporterName: userName,
          reporterEmail: userEmail,
          attachmentNames: attachments.map((f) => f.name),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedTicket({ key: data.key, url: data.url });
        setSubmitted(true);
        setCategory('');
        setSelectedDevice('');
        setDescription('');
        setAttachments([]);
        setTimeout(() => setSubmitted(false), 10000);
      } else {
        setError(typeof data.error === 'string' ? data.error : 'Could not create the ticket. Please try again or use Shake-to-Report.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Report an Issue</h2>
      <p className="text-sm text-gray-500 mb-6">
        Although we encourage everyone to use <strong className="text-gray-700">Shake-to-Report</strong> to
        submit bugs (it lets us gather data logs and other useful telemetry), you can also share feedback
        here — bugs, positive experiences, feature requests, or hardware issues. Attach screenshots or
        videos to help us see what you saw.
      </p>

      {submitted && createdTicket && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ Report submitted — created JIRA ticket{' '}
          <a href={createdTicket.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-green-800">
            {createdTicket.key}
          </a>{' '}
          in the Dogfood Reports project. The beta team will review it shortly.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category...</option>
            <option value="bug">🐛 Bug / Something broken</option>
            <option value="positive">👍 Positive Experience</option>
            <option value="feedback">💬 General Feedback</option>
            <option value="feature">💡 Feature Request</option>
            <option value="hardware">🔧 Hardware Issue</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Device (optional)</label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Not device-specific</option>
            {devices.map((d) => (
              <option key={d.serialNumber || d.serial} value={d.serialNumber || d.serial}>
                {d.model || 'eero'} — {d.serialNumber || d.serial}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, what you expected, or what you liked..."
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
        </div>

        {/* Attachments — screenshots & videos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (optional)</label>
          <p className="text-xs text-gray-400 mb-2">Add screenshots or screen recordings. Images, MP4, MOV, WebM supported.</p>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload size={28} className="text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-700">Drag & drop files here</p>
            <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>

          {/* Selected files list */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, i) => {
                const isVideo = file.type.startsWith('video/');
                return (
                  <div key={`${file.name}-${i}`} className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      {isVideo ? <Video size={16} className="text-purple-500 shrink-0" /> : <FileText size={16} className="text-blue-500 shrink-0" />}
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{formatSize(file.size)}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !category || !description.trim()}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────────────────────
function LearnView() {
  const SLACK_CHANNELS = [
    { name: '#team-dogfood', desc: 'Ask general questions, chat with other Dogfooders, and learn about the latest developments.', url: 'https://eero.slack.com/archives/C04L20K9W8Z' },
  ];

  const VIDEOS = [
    { title: 'Introduction to Dogfooding', status: 'Available now', url: 'https://drive.google.com/file/d/13cfnWfk1GmUNVr8Z8pFrqr6IgOMSRmtv/view?usp=sharing' },
    { title: 'eero Dogfood: How to Get Started', status: 'Available now', url: 'https://drive.google.com/file/d/1RCMXIPHxSen5tCr1z5tAoXnQBKK7Xexs/view' },
    { title: 'eero Dogfood: Employee Stories', status: 'Coming May 2026', url: '' },
  ];

  const CONFLUENCE_DOCS = [
    { title: 'Dogfood & Beta — Program Home', desc: 'Mission, what to expect, and how to get started.', url: 'https://eeroinc.atlassian.net/wiki/spaces/Beta1/overview' },
    { title: 'What is Dogfood?', desc: 'Deep dive on dogfooding, onboarding, feedback, and FAQs.', url: 'https://eeroinc.atlassian.net/wiki/spaces/Beta1/pages/3523313671/What+is+Dogfood' },
    { title: 'Dogfood Program', desc: 'Mission, testing process, and how to sign up for your free eero.', url: 'https://eeroinc.atlassian.net/wiki/spaces/Beta1/pages/3515416645/Dogfood+Program' },
    { title: 'Installing the iOS Dogfood App with TestFlight', desc: 'Step-by-step setup for the iOS Dogfood app, plus how to switch cloud environments.', url: 'https://eeroinc.atlassian.net/wiki/spaces/MOB/pages/2637791303/Installing+the+iOS+Dogfood+App+with+Testflight' },
    { title: 'Enabling eero Plus on Dogfood Networks', desc: 'How to use a test card to sign up for eero Plus on a dogfood network.', url: 'https://eeroinc.atlassian.net/wiki/spaces/Beta1/pages/4254203928/Enabling+eero+Plus+on+Dogfood+Networks' },
    { title: 'Work with the Team!', desc: 'For stakeholders looking to run a dogfood/beta test with the team.', url: 'https://eeroinc.atlassian.net/wiki/spaces/Beta1/pages/5032345634/Work+with+the+Team' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero / What is dogfood */}
      <div className="bg-gradient-to-br from-[#2c3e7a] to-[#1e2f5e] rounded-xl p-8 text-white">
        <h1 className="text-2xl font-bold">Welcome to the Dogfood Program</h1>
        <p className="mt-3 text-blue-100 leading-relaxed max-w-3xl">
          "Eating your own dog food" is the practice of using our own products before our customers do.
          At eero, <strong>every employee network is in dogfood</strong> — a pre-beta phase where we test new
          features, software, and hardware in real-world conditions. The dogfooding environment (we call it
          "Stage") spans ~450 internal networks. We catch bugs, issues, and feedback here before they ever
          reach customers, because <em>we don't test on our customers.</em>
        </p>
      </div>

      {/* Why it matters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Why dogfooding matters</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Your participation makes you part of our front-line quality assurance team. By testing in
          real-world conditions, you directly shape products millions of homes rely on. Here's the impact:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Catch and fix issues before they reach customers',
            'Maintain our exceptional brand standards',
            'Get early access to the latest hardware and software',
            'Have a direct line to the engineering team',
          ].map((point) => (
            <div key={point} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How to give feedback */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">How to give great feedback</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The most important thing is just submitting feedback. If you see something out of the ordinary,
          there are two easy ways to report it:
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-xl">📱</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Shake-to-Report (preferred)</p>
              <p className="text-sm text-gray-600">Shake your device while in the eero Dogfood app to auto-generate a Jira ticket with diagnostic info pre-filled.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Slack support request</p>
              <p className="text-sm text-gray-600">Open your Slack DMs and type <code className="bg-white px-1.5 py-0.5 rounded text-xs">/DogfoodSupportRequest</code> to submit a request.</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Good feedback example</p>
          <p className="text-sm text-gray-600 italic">
            "On 3/28 8:27 PM PST I was streaming Netflix on my laptop using wifi and it fell offline. I had to
            toggle wifi on/off several times before it reconnected to my network (Quinntague) a few minutes
            later. My phone had wifi during this time."
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Tip: Give each eero device a unique nickname in the app <em>before</em> you hit an issue — it helps engineers identify the right device fast.
        </p>
      </div>

      {/* Video series */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Video series</h2>
        <p className="text-sm text-gray-500 mb-4">A three-part series to help you get familiar with dogfooding.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VIDEOS.map((v) => {
            const available = Boolean(v.url);
            const inner = (
              <>
                <PlayCircle size={28} className={available ? 'text-blue-600' : 'text-gray-300'} />
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900">{v.title}</p>
                  <p className={`text-xs mt-0.5 ${available ? 'text-green-600' : 'text-gray-400'}`}>{v.status}</p>
                </div>
              </>
            );
            return available ? (
              <a key={v.title} href={v.url} target="_blank" rel="noopener noreferrer" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                {inner}
              </a>
            ) : (
              <div key={v.title} className="p-4 border border-gray-100 rounded-lg bg-gray-50 cursor-default">
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <FileText size={18} className="text-gray-400" /> Documentation
        </h2>
        <p className="text-sm text-gray-500 mb-4">Key Confluence pages for the dogfood program.</p>
        <div className="space-y-2">
          {CONFLUENCE_DOCS.map((doc) => (
            <a
              key={doc.title}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-4 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{doc.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
              </div>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </div>

      {/* Slack channels */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <MessageSquare size={18} className="text-gray-400" /> Slack channels
        </h2>
        <p className="text-sm text-gray-500 mb-4">Connect with the team and other dogfooders.</p>
        <div className="space-y-2">
          {SLACK_CHANNELS.map((ch) => (
            <a
              key={ch.name}
              href={ch.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-4 p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-purple-700">{ch.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ch.desc}</p>
              </div>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-purple-600 shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </div>

      {/* Contact / support */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Need help or support?</h2>
        <p className="text-sm text-gray-500 mb-4">Support is available 7 days/week, 8am–5pm CST.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="mailto:beta-team@eero.com" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">General questions</p>
              <p className="text-sm font-medium text-gray-900">beta-team@eero.com</p>
            </div>
          </a>
          <a href="mailto:dogfood-jira@eero.com" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Jira filing</p>
              <p className="text-sm font-medium text-gray-900">dogfood-jira@eero.com</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Join a Program Tab (browse + sign up for offerings) ──────────────────────
function JoinProgramView({ userName, userEmail }: { userName: string; userEmail: string }) {
  const { offerings, addSignup, hasSignedUp, getSignupsForEmail } = useProgramsStore();
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [, forceRender] = useState(0);

  const mySignups = getSignupsForEmail(userEmail);
  const mySignupMap = new Map(mySignups.map((s) => [s.programId, s]));

  // Show open + upcoming offerings (hide closed)
  const visible = offerings.filter((o) => o.status !== 'closed');

  const handleSignup = (programId: string) => {
    addSignup({
      id: crypto.randomUUID(),
      programId,
      email: userEmail,
      name: userName,
      note: note.trim() || undefined,
      status: 'interested',
      signedUpAt: new Date().toISOString(),
    });
    setSigningUp(null);
    setNote('');
    forceRender((n) => n + 1);
  };

  const STATUS_BADGE: Record<string, string> = {
    upcoming: 'bg-purple-100 text-purple-700',
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };
  const SIGNUP_BADGE: Record<string, string> = {
    interested: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    waitlisted: 'bg-yellow-100 text-yellow-700',
    declined: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Rocket size={20} className="text-[#2c3e7a]" /> Join a Dogfood Program
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Browse new and upcoming dogfood programs and sign up for the ones you want to test. No more
          hunting through the Slack channel — the beta team sees your interest here directly.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Rocket size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No programs are open for sign-up right now.</p>
          <p className="text-xs text-gray-400 mt-1">Check back soon — new programs are added regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((p) => {
            const signup = mySignupMap.get(p.id);
            const isSignedUp = Boolean(signup);
            const isUpcoming = p.status === 'upcoming';
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{p.product}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_BADGE[p.status]}`}>
                    {p.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 flex-1">{p.description}</p>

                {p.requirements && (
                  <div className="mb-3 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Requirements:</span> {p.requirements}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
                  {p.startDate && (
                    <span className="flex items-center gap-1"><Calendar size={12} /> Starts {new Date(p.startDate).toLocaleDateString()}</span>
                  )}
                  {p.signupDeadline && (
                    <span className="flex items-center gap-1">⏳ Sign up by {new Date(p.signupDeadline).toLocaleDateString()}</span>
                  )}
                  {p.capacity && (
                    <span className="flex items-center gap-1"><Users size={12} /> {p.capacity} spots</span>
                  )}
                </div>

                {/* Action area */}
                {isSignedUp ? (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-blue-800">✓ Thanks for signing up!</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SIGNUP_BADGE[signup!.status]}`}>
                        {signup!.status}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      If you're picked for this program, you'll be notified shortly. Once selected, your
                      device(s) and program details will appear in your account automatically.
                    </p>
                  </div>
                ) : signingUp === p.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional: anything the team should know (your setup, why you're a good fit)..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSignup(p.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Confirm sign-up
                      </button>
                      <button
                        onClick={() => { setSigningUp(null); setNote(''); }}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSigningUp(p.id)}
                    className="px-4 py-2 bg-[#2c3e7a] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f5e] transition-colors"
                  >
                    {isUpcoming ? 'Notify me / Express interest' : 'Sign up'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Returns Tab (guided, region-aware device return) ─────────────────────────
function ReturnsView({ userName, userEmail, endingReturns, addOptOut, getOptOuts, updateDevice, addHistoryEntry }: {
  userName: string; userEmail: string; endingReturns: any[];
  addOptOut: (r: any) => void; getOptOuts: () => any[];
  updateDevice: (id: string, u: any) => void; addHistoryEntry: (e: any) => void;
}) {
  // US/CA self-ship tracking number entry, keyed by device id
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  // Flatten all devices that need returning across ending programs
  const devicesToReturn = useMemo(() => {
    const seen = new Set<string>();
    const list: { device: any; offering: any; phase: any }[] = [];
    endingReturns.forEach((r) => {
      r.devices.forEach((d: any) => {
        if (seen.has(d.id || d.serialNumber)) return;
        seen.add(d.id || d.serialNumber);
        list.push({ device: d, offering: r.offering, phase: r.phase });
      });
    });
    return list;
  }, [endingReturns]);

  const handleConfirmReturn = (entry: { device: any; offering: any; phase: any }, trackingNumber?: string) => {
    const { device, offering, phase } = entry;
    const tn = (trackingNumber || '').trim();
    // Mark device pending return + store the tester-entered return tracking number
    updateDevice(device.id, {
      status: 'pending_return',
      ...(tn ? { returnTrackingNumber: tn, returnShippedAt: new Date().toISOString() } : {}),
    });
    addHistoryEntry({
      id: crypto.randomUUID(),
      deviceId: device.id,
      timestamp: new Date().toISOString(),
      action: 'return_requested',
      user: `${userName} (self)`,
      description: tn
        ? `Tester marked device ${device.serialNumber} as shipped for ${offering.name} (${phase.name}). Return tracking #: ${tn}.`
        : `Tester confirmed return for ${offering.name} (${phase.name}). Device ${device.serialNumber} marked pending return via portal (international — return via re-teck portal).`,
    });
    // Create/ensure an opt-out record so it lands in the admin offboarding pipeline
    const existing = getOptOuts().find((o) => o.personEmail.toLowerCase() === userEmail.toLowerCase());
    if (!existing) {
      addOptOut({
        id: crypto.randomUUID(),
        personEmail: userEmail,
        personName: userName,
        reason: 'other',
        notes: `End-of-program return initiated from portal for ${offering.name} (${phase.name}).`,
        optOutDate: new Date().toISOString(),
        recordedBy: `${userName} (self)`,
        selfInitiated: true,
        program: device.program || phase.name || 'dogfood',
        devicesAtOptOut: [device.serialNumber],
      });
    }
    setConfirmed((prev) => ({ ...prev, [device.id]: true }));
  };

  if (devicesToReturn.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <PackageCheck size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No returns needed right now.</p>
        <p className="text-xs text-gray-400 mt-1">When a program you're in nears its end date, your assigned devices will appear here with return instructions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PackageCheck size={20} className="text-[#2c3e7a]" /> Return Your Devices
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          One of your programs is wrapping up. Here's what's next for each device.
        </p>
      </div>

      {/* Agent intro / next steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl">📬</span>
        <p className="text-sm text-blue-800">
          A dogfood agent will be in touch with next steps for returning your device. Once you've shipped
          it out, please come back here and mark the device as returned with your tracking number.
        </p>
      </div>

      {devicesToReturn.map(({ device, offering, phase }) => {
        const domestic = isDomesticCountry(device.country);
        const isConfirmed = confirmed[device.id] || device.status === 'pending_return';
        const tn = trackingInput[device.id] || '';
        return (
          <div key={device.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{device.model || 'eero Device'}</h3>
                <p className="text-xs text-gray-500 font-mono">{device.serialNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">{offering.name} · {phase.name} · {device.country || 'Region unknown'}</p>
              </div>
              {isConfirmed && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">Pending Return</span>
              )}
            </div>

            {isConfirmed ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                ✓ Marked as returned{device.returnTrackingNumber ? <> — tracking <span className="font-mono font-medium">{device.returnTrackingNumber}</span></> : ''}. The beta team can now track this device's return. Thank you!
              </div>
            ) : domestic ? (
              /* ── US / Canada: self-ship + enter tracking number ── */
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  When your agent has arranged the return and you've dropped off the package, enter your
                  return tracking number below and mark it returned.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Return tracking number</label>
                  <input
                    type="text"
                    value={tn}
                    onChange={(e) => setTrackingInput((prev) => ({ ...prev, [device.id]: e.target.value }))}
                    placeholder="e.g. 1Z999AA10123456784"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleConfirmReturn({ device, offering, phase }, tn)}
                  disabled={!tn.trim()}
                  className="px-5 py-2.5 bg-[#2c3e7a] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f5e] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Mark as returned
                </button>
              </div>
            ) : (
              /* ── International: re-teck website ── */
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  For international returns, please process your return through the re-teck returns portal.
                  Select "Eero/Wifi Router", enter your DSNs and shipping info, and choose
                  "end of Beta program/Recall" as the reason.
                </p>
                <a
                  href="https://termination-returns-emea.re-teck.com/recycling/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50"
                >
                  Open re-teck returns portal <ExternalLink size={14} />
                </a>
                <div>
                  <button
                    onClick={() => handleConfirmReturn({ device, offering, phase })}
                    className="px-5 py-2.5 bg-[#2c3e7a] text-white rounded-lg text-sm font-medium hover:bg-[#1e2f5e]"
                  >
                    I've submitted my return
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Leave Program Tab (self-service opt-out) ─────────────────────────────────
const LEAVE_REASONS: { value: OptOutReason; label: string }[] = [
  { value: 'no_longer_interested', label: 'No longer interested in testing' },
  { value: 'moving', label: 'Moving / relocating' },
  { value: 'device_issues', label: 'Device or network issues' },
  { value: 'time_constraints', label: 'Not enough time' },
  { value: 'other', label: 'Other' },
];

function LeaveProgramView({ userName, userEmail, devices, programs, addOptOut, existingOptOut }: {
  userName: string; userEmail: string; devices: any[]; programs: string[];
  addOptOut: (record: any) => void; existingOptOut?: any;
}) {
  const [reason, setReason] = useState<OptOutReason>('no_longer_interested');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  // Dogfooder's own offboarding tasks (their end)
  const [tasks, setTasks] = useState({ disconnected: false, factoryReset: false, packed: false });

  const alreadyRequested = Boolean(existingOptOut);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    addOptOut({
      id: crypto.randomUUID(),
      personEmail: userEmail,
      personName: userName,
      reason,
      notes,
      optOutDate: new Date().toISOString(),
      recordedBy: `${userName} (self)`,
      selfInitiated: true,
      program: devices[0]?.program || programs[0] || 'dogfood',
      devicesAtOptOut: devices.map((d) => d.serialNumber || d.serial).filter(Boolean),
    });
  };

  const toggleTask = (key: keyof typeof tasks) => setTasks((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Already submitted — show status + their task checklist ──
  if (alreadyRequested) {
    const myTasks = [
      { key: 'disconnected' as const, label: 'Disconnect your eero devices', desc: 'Unplug all eero devices from power and your network.' },
      { key: 'factoryReset' as const, label: 'Reset your network to default', desc: 'In the eero app, factory-reset your eeros so your network returns to its default (non-dogfood) state.' },
      { key: 'packed' as const, label: 'Pack devices for return', desc: 'Box up the devices and accessories. The beta team will email you a return label and instructions.' },
    ];
    const doneCount = Object.values(tasks).filter(Boolean).length;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <DoorOpen size={20} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Opt-out requested</h2>
            <p className="text-sm text-gray-500">Submitted {new Date(existingOptOut.optOutDate).toLocaleDateString()} — the beta team has been notified.</p>
          </div>
        </div>

        <div className="my-5 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-700">
          Thanks for being part of the dogfood program! The beta team will reach out to arrange device
          return and finish removing you from all systems on their end. In the meantime, here's what you
          can do to wrap up on your side.
        </div>

        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your tasks ({doneCount}/{myTasks.length})</h3>
        <div className="space-y-2">
          {myTasks.map((t) => (
            <button
              key={t.key}
              onClick={() => toggleTask(t.key)}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${tasks[t.key] ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              {tasks[t.key] ? <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" /> : <Circle size={20} className="text-gray-300 shrink-0 mt-0.5" />}
              <div>
                <p className={`text-sm font-medium ${tasks[t.key] ? 'text-green-700 line-through' : 'text-gray-900'}`}>{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {doneCount === myTasks.length && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            ✓ All set on your end! The beta team will confirm receipt of your devices and complete your offboarding.
          </div>
        )}
      </div>
    );
  }

  // ── Opt-out form ──
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Leave the Dogfood Program</h2>
      <p className="text-sm text-gray-500 mb-6">
        We're sorry to see you go! Opting out lets the beta team know to retrieve your devices and return
        your network to its default state. You can always rejoin later.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Why are you leaving?</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as OptOutReason)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LEAVE_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anything else? (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Let the team know if there's anything they should be aware of..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* What happens next */}
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What happens next</h3>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> The beta team is notified and will arrange to retrieve your {devices.length} device(s).</li>
            <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> You'll get a checklist to disconnect devices and reset your network to default.</li>
            <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> The team resets your network off the dogfood (stage) environment and removes you from all systems.</li>
          </ul>
        </div>

        {devices.length > 0 && (
          <div className="text-xs text-gray-500">
            Devices currently assigned to you: <span className="font-mono">{devices.map((d) => d.serialNumber || d.serial).join(', ')}</span>
          </div>
        )}

        <label className="flex items-start gap-2">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="rounded border-gray-300 mt-0.5" />
          <span className="text-sm text-gray-700">I understand my devices will be retrieved and my network returned to default.</span>
        </label>

        <button
          type="submit"
          disabled={!confirmed}
          className="px-6 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Opt-Out Request
        </button>
      </form>
    </div>
  );
}

// ─── My Profile Tab (update address, emails, phone) ───────────────────────────
function ProfileView({ email, profile, onSave }: { email: string; profile: any; onSave: (updates: any) => void }) {
  const [form, setForm] = useState({
    phoneNumber: profile.phoneNumber || '',
    networkEmail: profile.networkEmail || '',
    productionEmail: profile.productionEmail || '',
    streetAddress: profile.streetAddress || '',
    aptUnit: profile.aptUnit || '',
    city: profile.city || '',
    state: profile.state || '',
    zipCode: profile.zipCode || '',
    preferWorkAddress: profile.preferWorkAddress || false,
    workStreet: profile.workStreet || '',
    workFloor: profile.workFloor || '',
    workCity: profile.workCity || '',
    workState: profile.workState || '',
    workZip: profile.workZip || '',
  });
  const [saved, setSaved] = useState(false);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  const input = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h2>
      <p className="text-sm text-gray-500 mb-6">
        Keep your contact and shipping details up to date so the beta team can reach you and ship hardware
        to the right place.
      </p>

      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ Your profile has been updated.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account email (read-only) */}
        <div>
          <label className={labelCls}>eero Email (login)</label>
          <input type="email" value={email} readOnly className={`${input} bg-gray-50 text-gray-500 cursor-not-allowed`} />
          <p className="text-xs text-gray-400 mt-1">This is your login and can't be changed here. Contact the beta team if it needs to change.</p>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone Number</label>
              <input type="tel" value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} placeholder="+1 555 123 4567" className={input} />
            </div>
            <div>
              <label className={labelCls}>Production Account Email</label>
              <input type="email" value={form.productionEmail} onChange={(e) => update('productionEmail', e.target.value)} placeholder="you@example.com" className={input} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Network Email</label>
              <input type="email" value={form.networkEmail} onChange={(e) => update('networkEmail', e.target.value)} placeholder="Email tied to your eero network" className={input} />
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Street Address</label>
              <input type="text" value={form.streetAddress} onChange={(e) => update('streetAddress', e.target.value)} className={input} />
            </div>
            <div>
              <label className={labelCls}>Apt / Unit</label>
              <input type="text" value={form.aptUnit} onChange={(e) => update('aptUnit', e.target.value)} className={input} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} className={input} />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input type="text" value={form.state} onChange={(e) => update('state', e.target.value)} className={input} />
            </div>
            <div>
              <label className={labelCls}>Zip Code</label>
              <input type="text" value={form.zipCode} onChange={(e) => update('zipCode', e.target.value)} className={input} />
            </div>
          </div>
        </div>

        {/* Work address (optional) */}
        <div>
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={form.preferWorkAddress} onChange={(e) => update('preferWorkAddress', e.target.checked)} className="rounded border-gray-300" />
            <span className="text-sm font-medium text-gray-700">I'd prefer hardware shipped to a work address</span>
          </label>
          {form.preferWorkAddress && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-100">
              <div className="md:col-span-2">
                <label className={labelCls}>Work Street</label>
                <input type="text" value={form.workStreet} onChange={(e) => update('workStreet', e.target.value)} className={input} />
              </div>
              <div>
                <label className={labelCls}>Floor / Suite</label>
                <input type="text" value={form.workFloor} onChange={(e) => update('workFloor', e.target.value)} className={input} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input type="text" value={form.workCity} onChange={(e) => update('workCity', e.target.value)} className={input} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input type="text" value={form.workState} onChange={(e) => update('workState', e.target.value)} className={input} />
              </div>
              <div>
                <label className={labelCls}>Zip Code</label>
                <input type="text" value={form.workZip} onChange={(e) => update('workZip', e.target.value)} className={input} />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Save size={16} /> Save Changes
        </button>
      </form>
    </div>
  );
}

