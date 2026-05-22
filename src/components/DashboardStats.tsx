'use client';

import { useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Monitor, Users, MapPin, FlaskConical, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DashboardStats() {
  const { devices, people, testbeds } = useDeviceStore();

  const stats = useMemo(() => {
    const online = devices.filter((d) => d.status === 'online').length;
    const notOnline = devices.filter((d) => d.status === 'not_online').length;
    const countries = new Set(devices.map((d) => d.country).filter(Boolean)).size;
    const programs = testbeds.length || new Set(devices.map((d) => d.program)).size;
    const now = new Date();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const overdue = devices.filter((d) => {
      // Original: devices past due date and not online
      if (d.dueDate && new Date(d.dueDate) < now && d.status === 'not_online') return true;
      // New: pending_return devices where return email was sent 2+ weeks ago
      if (d.status === 'pending_return' && d.returnEmailSentAt && (now.getTime() - new Date(d.returnEmailSentAt).getTime()) >= twoWeeksMs) return true;
      return false;
    }).length;

    return [
      { label: 'Total Devices', value: devices.length, icon: Monitor, color: 'bg-blue-500' },
      { label: 'Online', value: online, icon: CheckCircle, color: 'bg-green-500' },
      { label: 'Not Online', value: notOnline, icon: Users, color: 'bg-yellow-500' },
      { label: 'Countries', value: countries, icon: MapPin, color: 'bg-orange-500' },
      { label: 'Programs', value: programs, icon: FlaskConical, color: 'bg-indigo-500' },
      { label: 'People', value: people.length, icon: Users, color: 'bg-teal-500' },
      { label: 'Overdue', value: overdue, icon: AlertTriangle, color: overdue > 0 ? 'bg-red-500' : 'bg-gray-400' },
    ];
  }, [devices, people, testbeds]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className={`${color} text-white p-1.5 rounded-lg w-fit mb-2`}>
            <Icon size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
