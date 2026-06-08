'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDeviceStore } from '@/store/deviceStore';
import { Wifi, Smartphone, Bug, Video, LayoutDashboard, LogOut, Layers, Upload } from 'lucide-react';

type PortalTab = 'dashboard' | 'devices' | 'programs' | 'report' | 'videos';

export default function DogfooderPortal() {
  const { currentUser, logout } = useAuthStore();
  const { devices } = useDeviceStore();
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');

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
    { id: 'dashboard', label: 'My Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'devices', label: 'My Devices', icon: <Smartphone size={18} /> },
    { id: 'programs', label: 'My Programs', icon: <Layers size={18} /> },
    { id: 'report', label: 'Report Issue', icon: <Bug size={18} /> },
    { id: 'videos', label: 'Videos', icon: <Video size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
      <div className="fixed top-[57px] left-0 right-0 z-40 bg-white border-b border-gray-100 px-6">
        <div className="flex gap-1 max-w-[1200px] mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-6 mt-[105px]">
        {activeTab === 'dashboard' && (
          <DashboardView
            name={currentUser?.name || ''}
            deviceCount={myDevices.length}
            programCount={myPrograms.length}
            programs={myPrograms}
          />
        )}
        {activeTab === 'devices' && <DevicesView devices={myDevices} networkDevices={networkDevices} />}
        {activeTab === 'programs' && <ProgramsView programs={myPrograms} devices={myDevices} />}
        {activeTab === 'report' && <ReportView devices={myDevices} />}
        {activeTab === 'videos' && <VideosView />}
      </main>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardView({ name, deviceCount, programCount, programs }: { name: string; deviceCount: number; programCount: number; programs: string[] }) {
  return (
    <div className="space-y-6">
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
  return (
    <div className="space-y-6">
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
function ProgramsView({ programs, devices }: { programs: string[]; devices: any[] }) {
  if (programs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Layers size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">You're not part of any programs yet.</p>
        <p className="text-sm text-gray-400 mt-1">Programs will appear here once you're enrolled by an admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((program) => {
        const programDevices = devices.filter((d) => d.program === program);
        return (
          <div key={program} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{program}</h3>
                <p className="text-sm text-gray-500 mt-1">{programDevices.length} device(s) assigned to you</p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">Active</span>
            </div>
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

// ─── Report Issue Tab ─────────────────────────────────────────────────────────
function ReportView({ devices }: { devices: any[] }) {
  const [category, setCategory] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Create a service order on the admin side
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setCategory('');
    setSelectedDevice('');
    setDescription('');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Report an Issue</h2>
      <p className="text-sm text-gray-500 mb-6">Share feedback — bugs, positive experiences, feature requests, or hardware issues.</p>

      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ Report submitted successfully. The beta team will review it shortly.
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

        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Submit Report
        </button>
      </form>
    </div>
  );
}

// ─── Videos Tab ───────────────────────────────────────────────────────────────
function VideosView() {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); /* TODO: handle upload */ }}
        className={`bg-white rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
        }`}
      >
        <Upload size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-700">Drag & drop a video here</p>
        <p className="text-xs text-gray-400 mt-1">or click to browse. MP4, MOV, WebM supported.</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Upload Video
        </button>
      </div>

      {/* Shared videos from the team */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Team Videos</h3>
        <div className="text-center py-8">
          <Video size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No videos shared yet.</p>
          <p className="text-xs text-gray-400 mt-1">Videos from the beta team will appear here.</p>
        </div>
      </div>
    </div>
  );
}
