'use client';

import { useDeviceStore } from '@/store/deviceStore';
import { Monitor, Users, MapPin, FlaskConical, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DashboardStats() {
  const { devices, people, locations, testbeds } = useDeviceStore();

  const inStock = devices.filter((d) => d.status === 'online').length;
  const checkedOut = devices.filter((d) => d.status === 'not_online').length;
  const countries = new Set(devices.map((d) => d.country).filter(Boolean)).size;
  const overdue = devices.filter((d) => {
    if (!d.dueDate) return false;
    return new Date(d.dueDate) < new Date() && d.status === 'not_online';
  }).length;

  const stats = [
    { label: 'Total Devices', value: devices.length, icon: <Monitor size={20} />, color: 'bg-blue-500' },
    { label: 'Online', value: inStock, icon: <CheckCircle size={20} />, color: 'bg-green-500' },
    { label: 'Not Online', value: checkedOut, icon: <Users size={20} />, color: 'bg-yellow-500' },
    { label: 'Countries', value: countries, icon: <MapPin size={20} />, color: 'bg-orange-500' },
    { label: 'Programs', value: testbeds.length || new Set(devices.map((d) => d.program)).size, icon: <FlaskConical size={20} />, color: 'bg-indigo-500' },
    { label: 'People', value: people.length, icon: <Users size={20} />, color: 'bg-teal-500' },
    { label: 'Overdue', value: overdue, icon: <AlertTriangle size={20} />, color: overdue > 0 ? 'bg-red-500' : 'bg-gray-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className={`${stat.color} text-white p-1.5 rounded-lg`}>
              {stat.icon}
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
