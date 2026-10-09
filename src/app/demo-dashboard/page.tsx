'use client';

// PREVIEW ROUTE — /demo-dashboard
// The real app shell (sidebar, header, cohort lens) with a Dashboard tab added as
// the landing page. Every other sidebar item renders the real menu, so you can
// click through from the dashboard. The main app at / is untouched.
//
// TO PROMOTE: add the 'dashboard' tab to src/app/page.tsx (pass
// leadingTabs={DASHBOARD_TAB} to Navbar, default activeTab to 'dashboard', render
// <DashboardView onNavigate={handleSetActiveTab} />), then delete this route.
import { useState, useEffect } from 'react';
import { TabType } from '@/types';
import Navbar from '@/components/Navbar';
import DevicesTab from '@/components/DevicesTab';
import LocationsTab from '@/components/LocationsTab';
import PeopleTab from '@/components/PeopleTab';
import ShipmentsTab from '@/components/ShipmentsTab';
import OverviewDashboard from '@/components/OverviewDashboard';
import SeedDataProvider from '@/components/SeedDataProvider';
import LoginPage from '@/components/LoginPage';
import DashboardView from '@/components/dashboard/DashboardView';
import { ToastProvider } from '@amzn/eero-web-design-components';
import { ProgramsView } from '@/components/programs/ProgramsView';
import { useAuthStore, DEMO_OPEN_ACCESS } from '@/store/authStore';
import { AutoSync } from '@/lib/useAutoSync';

const DASHBOARD_TAB: { id: TabType; label: string; key: string }[] = [{ id: 'dashboard', label: 'Dashboard', key: 'dashboard' }];

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedPersonEmail, setSelectedPersonEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, currentUser, loginAsGuest } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && DEMO_OPEN_ACCESS && !currentUser) loginAsGuest();
  }, [mounted, currentUser, loginAsGuest]);

  const handleNavigateToPerson = (email: string) => {
    setSelectedPersonEmail(email);
    setActiveTab('people');
  };

  if (!mounted || (DEMO_OPEN_ACCESS && !currentUser)) {
    return <div className="min-h-screen bg-[var(--ui-background-layer-background-page)]" />;
  }
  if (!isLoggedIn()) return <LoginPage />;

  return (
    <SeedDataProvider>
      {/* Weekly stale-check device sync — runs on every tab, for every role. */}
      <AutoSync />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} leadingTabs={DASHBOARD_TAB}>
        <div className="mb-4 rounded-lg border border-[var(--ui-support-border-support-info)] bg-[var(--ui-support-fill-support-info)] px-4 py-2 text-xs text-[var(--ui-support-text-icon-support-info)]">
          Preview — the Dashboard isn&apos;t in the main app yet. Everything here uses the same live data as <a href="/" className="font-semibold underline">the app</a>.
        </div>
        {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
        {activeTab === 'devices' && (
          <div className="flex flex-col gap-6">
            <OverviewDashboard />
            <DevicesTab onNavigateToPerson={handleNavigateToPerson} />
          </div>
        )}
        {activeTab === 'locations' && <LocationsTab />}
        {activeTab === 'people' && <PeopleTab initialSelectedPerson={selectedPersonEmail} onClearSelection={() => setSelectedPersonEmail(null)} />}
        {activeTab === 'surveys' && <ToastProvider><ProgramsView embedded onNavigateToPerson={handleNavigateToPerson} /></ToastProvider>}
        {activeTab === 'shipments' && <ShipmentsTab showPendingReturns />}
      </Navbar>
    </SeedDataProvider>
  );
}
