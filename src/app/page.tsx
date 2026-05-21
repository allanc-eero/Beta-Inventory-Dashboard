'use client';

import { useState } from 'react';
import { TabType } from '@/types';
import Navbar from '@/components/Navbar';
import DevicesTab from '@/components/DevicesTab';
import ProgramsTab from '@/components/ProgramsTab';
import LocationsTab from '@/components/LocationsTab';
import PeopleTab from '@/components/PeopleTab';
import ShipmentsTab from '@/components/ShipmentsTab';
import DashboardStats from '@/components/DashboardStats';
import SeedDataProvider from '@/components/SeedDataProvider';
import OverdueAlertsBanner from '@/components/OverdueAlertsBanner';
import NetworkSyncButton from '@/components/NetworkSyncButton';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [resetKey, setResetKey] = useState(0);

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    // Force remount of DevicesTab to close any open panels
    if (tab === 'devices') {
      setResetKey((k) => k + 1);
    }
  };

  return (
    <SeedDataProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-12">
          <OverdueAlertsBanner />
          <DashboardStats />
          <div className="mt-4">
            <NetworkSyncButton />
          </div>
          <div className="mt-6">
            {activeTab === 'devices' && <DevicesTab key={resetKey} />}
            {activeTab === 'testbeds' && <ProgramsTab />}
            {activeTab === 'locations' && <LocationsTab />}
            {activeTab === 'people' && <PeopleTab />}
            {activeTab === 'shipments' && <ShipmentsTab />}
          </div>
        </main>
      </div>
    </SeedDataProvider>
  );
}
