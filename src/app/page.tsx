'use client';

// eero Fetch — main app shell.
// Sidebar: Dashboard · Programs · Surveys · Engagement · People · Imports.
// Devices live inside each program (Programs → click a program); Locations and the
// standalone Devices menu are hidden (their code stays for now).
import { useState, useEffect } from 'react';
import { TabType } from '@/types';
import Navbar from '@/components/Navbar';
import PeopleTab from '@/components/PeopleTab';
import ShipmentsTab from '@/components/ShipmentsTab';
import SeedDataProvider from '@/components/SeedDataProvider';
import LoginPage from '@/components/LoginPage';
import DogfooderPortal from '@/components/DogfooderPortal';
import DashboardView from '@/components/dashboard/DashboardView';
import AgentChat from '@/components/AgentChat';
import { PreviewModeContext } from '@/lib/previewMode';
import { ToastProvider } from '@amzn/eero-web-design-components';
import { ProgramsView, ProgramsSection } from '@/components/programs/ProgramsView';
import { useAuthStore, DEMO_OPEN_ACCESS } from '@/store/authStore';
import { AutoSync } from '@/lib/useAutoSync';

const DASHBOARD_TAB: { id: TabType; label: string; key: string }[] = [{ id: 'dashboard', label: 'Dashboard', key: 'dashboard' }];
// Surveys and Engagement as their own sidebar items, right under Programs.
const PROGRAM_SECTION_TABS: Partial<Record<TabType, { id: TabType; label: string; key: string }[]>> = {
  surveys: [
    { id: 'survey_results', label: 'Surveys', key: 'survey_results' },
    { id: 'engagement', label: 'Engagement', key: 'engagement' },
  ],
};
// Sidebar tab ↔ ProgramsView section.
const SECTION_FOR_TAB: Partial<Record<TabType, ProgramsSection>> = { surveys: 'health', survey_results: 'surveys', engagement: 'engagement' };
const TAB_FOR_SECTION: Record<ProgramsSection, TabType> = { health: 'surveys', surveys: 'survey_results', engagement: 'engagement' };

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedPersonEmail, setSelectedPersonEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, currentUser, isDogfoofer, loginAsGuest } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  // Open-access prototype: anyone running this locally is signed in automatically
  // so they can look around and give feedback without being on the roster.
  // Production builds keep the real sign-in screen (see DEMO_OPEN_ACCESS).
  useEffect(() => {
    if (mounted && DEMO_OPEN_ACCESS && !currentUser) loginAsGuest();
  }, [mounted, currentUser, loginAsGuest]);

  // Back to the Dashboard whenever the signed-in user changes.
  useEffect(() => {
    if (currentUser) setActiveTab('dashboard');
  }, [currentUser?.email]);

  const handleNavigateToPerson = (email: string) => {
    setSelectedPersonEmail(email);
    setActiveTab('people');
  };

  // Prevent hydration mismatch — don't render data-dependent content until the
  // client is ready (and, in open-access mode, until the guest sign-in has run).
  if (!mounted || (DEMO_OPEN_ACCESS && !currentUser)) {
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

  if (!isLoggedIn()) return <LoginPage />;
  if (isDogfoofer()) return <DogfooderPortal />;

  return (
    // The app runs in the streamlined layout (trimmed device page, per-program
    // device views, etc.) — see src/lib/previewMode.ts.
    <PreviewModeContext.Provider value={true}>
      <SeedDataProvider>
        {/* Weekly stale-check device sync — runs on every tab, for every role. */}
        <AutoSync />
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          leadingTabs={DASHBOARD_TAB}
          tabsAfter={PROGRAM_SECTION_TABS}
          tabLabels={{ shipments: 'Imports' }}
          hiddenTabs={['locations', 'devices']}
        >
          {/* Devices isn't in the sidebar — device links from the Dashboard open Programs (each program has its device list). */}
          {activeTab === 'dashboard' && <DashboardView onNavigate={(t) => setActiveTab(t === 'devices' ? 'surveys' : t)} />}
          {activeTab === 'people' && <PeopleTab initialSelectedPerson={selectedPersonEmail} onClearSelection={() => setSelectedPersonEmail(null)} />}
          {SECTION_FOR_TAB[activeTab] && (
            <ToastProvider>
              <ProgramsView
                embedded
                section={SECTION_FOR_TAB[activeTab]}
                onSectionChange={(s) => setActiveTab(TAB_FOR_SECTION[s])}
                onNavigateToPerson={handleNavigateToPerson}
              />
            </ToastProvider>
          )}
          {activeTab === 'shipments' && <ShipmentsTab importsMode />}
        </Navbar>
        {/* AI assistant — floating button on every page */}
        <AgentChat variant="floating" />
      </SeedDataProvider>
    </PreviewModeContext.Provider>
  );
}
