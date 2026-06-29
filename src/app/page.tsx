'use client';

import { useState, useEffect } from 'react';
import { TabType } from '@/types';
import Navbar from '@/components/Navbar';
import DevicesTab from '@/components/DevicesTab';
import ProgramsTab from '@/components/ProgramsTab';
import LocationsTab from '@/components/LocationsTab';
import PeopleTab from '@/components/PeopleTab';
import ShipmentsTab from '@/components/ShipmentsTab';
import PackagesTab from '@/components/PackagesTab';
import ShapeshiftTab from '@/components/ShapeshiftTab';
import OverviewDashboard from '@/components/OverviewDashboard';
import DashboardStats from '@/components/DashboardStats';
import SeedDataProvider from '@/components/SeedDataProvider';
import OverdueAlertsBanner from '@/components/OverdueAlertsBanner';
import NetworkSyncButton from '@/components/NetworkSyncButton';
import TesterRefreshButton from '@/components/TesterRefreshButton';
import PendingReturnReminder from '@/components/PendingReturnReminder';
import TodayBriefing from '@/components/TodayBriefing';
import LoginPage from '@/components/LoginPage';
import DogfooderPortal from '@/components/DogfooderPortal';
import DogfoodOnboarding from '@/components/DogfoodOnboarding';
import ProgramSignupsTab from '@/components/ProgramSignupsTab';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [resetKey, setResetKey] = useState(0);
  const [selectedPersonEmail, setSelectedPersonEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, currentUser, canEdit, isBetaViewer, isDogfoofer } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  // Reset to Overview tab whenever user changes (login/logout)
  useEffect(() => {
    if (currentUser) {
      setActiveTab('overview');
      setResetKey((k) => k + 1);
    }
  }, [currentUser?.email]);

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

  // Prevent hydration mismatch — don't render data-dependent content until client is ready
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-12">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Auth gate — show login if not authenticated
  if (!isLoggedIn()) {
    return <LoginPage />;
  }

  // Dogfoofers get the Dogfoofer Portal
  if (isDogfoofer()) {
    return <DogfooderPortal />;
  }

  return (
    <SeedDataProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-12">
          <PendingReturnReminder onNavigateToReturns={() => handleSetActiveTab('shipments')} />
          {activeTab === 'devices' && canEdit() && <TodayBriefing onNavigate={handleSetActiveTab} />}
          {activeTab === 'devices' && !canEdit() && (
            <>
              <DashboardStats onOverdueClick={() => handleSetActiveTab('shipments')} />
            </>
          )}
          {activeTab !== 'devices' && activeTab !== 'overview' && (
            <>
              <OverdueAlertsBanner />
              <DashboardStats onOverdueClick={() => handleSetActiveTab('shipments')} />
              {canEdit() && (
              <div className="mt-4 space-y-4">
                <NetworkSyncButton />
                <TesterRefreshButton />
              </div>
              )}
            </>
          )}
          <div className="mt-6">
            {activeTab === 'overview' && <OverviewDashboard />}
            {activeTab === 'devices' && <DevicesTab key={resetKey} onNavigateToPerson={handleNavigateToPerson} />}
            {activeTab === 'testbeds' && <ProgramsTab />}
            {activeTab === 'packages' && <PackagesTab />}
            {activeTab === 'shapeshift' && <ShapeshiftTab />}
            {activeTab === 'dogfood' && <DogfoodOnboarding />}
            {activeTab === 'program_signups' && <ProgramSignupsTab />}
            {activeTab === 'locations' && <LocationsTab />}
            {activeTab === 'people' && <PeopleTab initialSelectedPerson={selectedPersonEmail} onClearSelection={() => setSelectedPersonEmail(null)} />}
            {activeTab === 'shipments' && <ShipmentsTab showPendingReturns />}
          </div>
        </main>
      </div>
    </SeedDataProvider>
  );
}
