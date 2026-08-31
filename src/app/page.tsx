'use client';

import { useState, useEffect } from 'react';
import { TabType } from '@/types';
import Navbar from '@/components/Navbar';
import DevicesTab from '@/components/DevicesTab';
import LocationsTab from '@/components/LocationsTab';
import PeopleTab from '@/components/PeopleTab';
import ShipmentsTab from '@/components/ShipmentsTab';
import OverviewDashboard from '@/components/OverviewDashboard';
import SeedDataProvider from '@/components/SeedDataProvider';
import OverdueAlertsBanner from '@/components/OverdueAlertsBanner';
import NetworkSyncButton from '@/components/NetworkSyncButton';
import PendingReturnReminder from '@/components/PendingReturnReminder';
import TodayBriefing from '@/components/TodayBriefing';
import LoginPage from '@/components/LoginPage';
import DogfooderPortal from '@/components/DogfooderPortal';
import DogfoodOnboarding from '@/components/DogfoodOnboarding';
import ProgramSignupsTab from '@/components/ProgramSignupsTab';
import { ToastProvider } from '@amzn/eero-web-design-components';
import { DemoSurveysInner } from '@/components/SurveysDemo';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [resetKey, setResetKey] = useState(0);
  const [selectedPersonEmail, setSelectedPersonEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, currentUser, canEdit, isBetaViewer, isDogfoofer } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  // Reset to Devices tab (now the default landing, with Overview merged in) on user change
  useEffect(() => {
    if (currentUser) {
      setActiveTab('devices');
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
      <div className="min-h-screen bg-[var(--ui-background-layer-background-page)]">
        <div className="max-w-7xl mx-auto px-6 py-6 mt-12">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-[var(--ui-background-layer-layer-page-backplate)] rounded-xl" />
            <div className="h-12 bg-[var(--ui-background-layer-layer-page-backplate)] rounded-xl" />
            <div className="h-96 bg-[var(--ui-background-layer-layer-page-backplate)] rounded-xl" />
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
      <Navbar activeTab={activeTab} setActiveTab={handleSetActiveTab}>
        <PendingReturnReminder onNavigateToReturns={() => handleSetActiveTab('shipments')} />
        {activeTab !== 'devices' && activeTab !== 'surveys' && (
          <>
            <OverdueAlertsBanner />
            {canEdit() && (
              <div className="mt-4">
                <NetworkSyncButton />
              </div>
            )}
          </>
        )}
        <div className="mt-6">
          {activeTab === 'devices' && (
            <div className="flex flex-col gap-6">
              <OverviewDashboard />
              {canEdit() && <TodayBriefing onNavigate={handleSetActiveTab} />}
              <DevicesTab key={resetKey} onNavigateToPerson={handleNavigateToPerson} />
            </div>
          )}
          {activeTab === 'dogfood' && <DogfoodOnboarding />}
          {activeTab === 'program_signups' && <ProgramSignupsTab />}
          {activeTab === 'locations' && <LocationsTab />}
          {activeTab === 'people' && <PeopleTab initialSelectedPerson={selectedPersonEmail} onClearSelection={() => setSelectedPersonEmail(null)} />}
          {activeTab === 'surveys' && <ToastProvider><DemoSurveysInner embedded /></ToastProvider>}
          {activeTab === 'shipments' && <ShipmentsTab showPendingReturns />}
        </div>
      </Navbar>
    </SeedDataProvider>
  );
}
