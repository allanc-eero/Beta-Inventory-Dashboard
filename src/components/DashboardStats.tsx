'use client';

import { useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Card } from '@amzn/eero-web-design-components';
import { Monitor, Users, MapPin, FlaskConical, CheckCircle, AlertTriangle } from 'lucide-react';

interface DashboardStatsProps {
  onOverdueClick?: () => void;
}

export default function DashboardStats({ onOverdueClick }: DashboardStatsProps) {
  const { devices, people, testbeds } = useDeviceStore();

  const stats = useMemo(() => {
    const online = devices.filter((d) => d.status === 'online').length;
    const notOnline = devices.filter((d) => d.status === 'not_online').length;
    const countries = new Set(devices.map((d) => d.country).filter(Boolean)).size;
    const programs = testbeds.length || new Set(devices.map((d) => d.program)).size;
    const now = new Date();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const overdue = devices.filter((d) => {
      if (d.dueDate && new Date(d.dueDate) < now && d.status === 'not_online') return true;
      if (d.status === 'pending_return' && d.returnEmailSentAt && (now.getTime() - new Date(d.returnEmailSentAt).getTime()) >= twoWeeksMs) return true;
      return false;
    }).length;

    return [
      { label: 'Total Devices', value: devices.length, icon: Monitor, color: 'bg-[var(--ui-core-periwinkle-periwinkle-6)]' },
      { label: 'Online', value: online, icon: CheckCircle, color: 'bg-[var(--ui-core-green-green-5)]' },
      { label: 'Not Online', value: notOnline, icon: Users, color: 'bg-[var(--ui-core-orange-orange-5)]' },
      { label: 'Countries', value: countries, icon: MapPin, color: 'bg-[var(--ui-core-orange-orange-5)]' },
      { label: 'Programs', value: programs, icon: FlaskConical, color: 'bg-[var(--ui-core-ocean-blue-ocean-6)]' },
      { label: 'People', value: people.length, icon: Users, color: 'bg-[var(--ui-core-turquoise-turquoise-6)]' },
      { label: 'Overdue', value: overdue, icon: AlertTriangle, color: overdue > 0 ? 'bg-[var(--ui-core-red-red-5)]' : 'bg-[var(--ui-core-gray-gray-5)]', onClick: onOverdueClick },
    ];
  }, [devices, people, testbeds, onOverdueClick]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map(({ label, value, icon: Icon, color, onClick }) => (
        <Card key={label} size={1} className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
          <div onClick={onClick}>
            <div className={`${color} text-white p-1.5 rounded-lg w-fit mb-2`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-[var(--ui-text-text-primary)]">{value}</p>
            <p className="text-xs text-[var(--ui-text-text-tertiary)] mt-0.5">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
