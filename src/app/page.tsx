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
import PendingReturnReminder from '@/components/PendingReturnReminder';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [resetKey, setResetKey] = useState(0);
  const [selectedPersonEmail, setSelectedPersonEmail] = useState<string | null>(null);

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'devices') {
      setResetKey((k) => k + 1);
    }
  };

  const handleNavigateToPerson = (email: string) => {
    setSelectedPersonEmail(email);
    setActiveTab('people');
  };

  return (
    <SeedDataProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-12">
          <PendingReturnReminder onNavigateToReturns={() => handleSetActiveTab('shipments')} />
          <OverdueAlertsBanner />
          <DashboardStats onOverdueClick={() => handleSetActiveTab('shipments')} />
          <div className="mt-4">
            <NetworkSyncButton />
          </div>
          <div className="mt-6">
            {activeTab === 'devices' && <DevicesTab key={resetKey} onNavigateToPerson={handleNavigateToPerson} />}
            {activeTab === 'testbeds' && <ProgramsTab />}
            {activeTab === 'locations' && <LocationsTab />}
            {activeTab === 'people' && <PeopleTab initialSelectedPerson={selectedPersonEmail} onClearSelection={() => setSelectedPersonEmail(null)} />}
            {activeTab === 'shipments' && <ShipmentsTab showPendingReturns />}
          </div>
        </main>
      </div>
    </SeedDataProvider>
  );
}
